import OpenAI from "openai";
import { EvolutionWebhookPayload } from "@/src/types/property";
import { sendWhatsAppMessage } from "@/src/lib/evolution";
import { supabaseServer } from "@/src/lib/supabase-server";
import { EmbeddingFactory } from "@/src/lib/embeddings";

// Cache simple en memoria para idempotencia (Message ID -> Timestamp)
const processedMessages = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 60000; // 60 segundos


interface WebhookProcessOptions {
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionInstance?: string;
}

export async function processWebhookMessage(
  body: EvolutionWebhookPayload | Record<string, unknown>,
  options: WebhookProcessOptions = {}
): Promise<any> {
  const payload = body as Record<string, unknown>;
  const data = payload.data as Record<string, unknown> | undefined;
  const keyData = (data?.key as Record<string, unknown>) ?? undefined;
  
  const remoteJid = (keyData?.remoteJid as string) || (payload.remoteJid as string) || "";
  const messageId = (keyData?.id as string) || (payload.id as string) || "";
  const fromMe = (keyData?.fromMe as boolean) ?? (payload.fromMe as boolean) ?? false;
  
  if (fromMe) {
    return { status: "IGNORED", reason: "Message sent by me (human intervention)" };
  }

  if (!remoteJid || remoteJid.includes("@g.us")) {
    return { status: "IGNORED", reason: "Group message or missing JID" };
  }

  const rawPhoneNumber = remoteJid.replace("@s.whatsapp.net", "");
  const senderName = (data?.pushName as string) || (payload.pushName as string) || "Cliente WhatsApp";

  const messageData = data?.message as Record<string, unknown> | undefined;
  const extText = (messageData?.extendedTextMessage as Record<string, unknown> | undefined)?.text;
  const userMessageText = (messageData?.conversation as string) || (extText as string) || (payload.message as string) || "";

  if (!userMessageText) {
    return { status: "IGNORED", reason: "Empty message" };
  }

  // 1. Deduplicación por messageId
  if (messageId) {
    const now = Date.now();
    const lastSeen = processedMessages.get(messageId);
    
    if (lastSeen && (now - lastSeen) < DEDUPLICATION_WINDOW_MS) {
      console.log(`[Webhook] ⚠️ Mensaje duplicado ignorado: ${messageId}`);
      return { status: "DUPLICATE_IGNORED", reason: "Message already processed recently" };
    }
    
    processedMessages.set(messageId, now);
    for (const [id, time] of processedMessages.entries()) {
      if (now - time > DEDUPLICATION_WINDOW_MS) {
        processedMessages.delete(id);
      }
    }
  }

  // 2. Buscar si el Lead ya existe y si tiene la IA pausada
  let { data: existingLead } = await supabaseServer
    .from("leads")
    .select("id, ai_paused, pipeline_stage")
    .eq("phone_number", rawPhoneNumber)
    .limit(1)
    .single();

  if (existingLead?.ai_paused) {
    console.log(`[Webhook] ⏸️ IA pausada para ${rawPhoneNumber}.`);
    return { status: "AI_PAUSED", leadId: existingLead.id };
  }

  // 3. Validación Estricta de Palabras Clave (Solo para leads NUEVOS)
  const defaultKeywords = ["departamento", "casa", "garsonier", "garaje", "tienda", "almacen", "property", "informacion", "precio", "venta", "hola", "buen dia", "buenas", "info", "ubicacion", "agente"];
  const lowerMsg = userMessageText.toLowerCase();
  const hasKeyword = defaultKeywords.some(kw => lowerMsg.includes(kw));
  
  if (!existingLead && !hasKeyword) {
    console.log(`[Webhook] 🔇 Ignorado: Lead nuevo no contiene palabras clave inmobiliarias. (${userMessageText})`);
    return { status: "IGNORED", reason: "No matching keywords" };
  }

  // 3. RAG Nativo en PostgreSQL (100% RPC, 0% CPU local)
  let matchedProperties: any[] = [];
  try {
    const provider = await EmbeddingFactory.getProvider();
    const queryEmbedding = await provider.generateEmbedding(userMessageText);

    const { data: matches, error: rpcError } = await supabaseServer.rpc("match_properties", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.3,
      match_count: 2
    });

    if (rpcError) {
      console.error("[Webhook] RPC match_properties error:", rpcError);
    } else {
      matchedProperties = matches || [];
    }
  } catch (err) {
    console.error("[Webhook] Vector search failed:", err);
  }

  const bestMatch = matchedProperties.length > 0 ? matchedProperties[0] : null;

  // 4.1 Recuperar Historial de Chat
  let chatHistoryText = "";
  if (existingLead) {
    const { data: historyData } = await supabaseServer
      .from("messages")
      .select("sender, text")
      .eq("lead_id", existingLead.id)
      .order("created_at", { ascending: false })
      .limit(6);
      
    if (historyData && historyData.length > 0) {
      // Revertir para orden cronológico
      const sortedHistory = historyData.reverse();
      chatHistoryText = "HISTORIAL DE CONVERSACIÓN RECIENTE:\n" + sortedHistory.map(msg => 
        `[${msg.sender === "lead" ? "Cliente" : "Sofía"}]: ${msg.text}`
      ).join("\n");
    }
  }

  // 5. Armar el prompt para el LLM (Sofía)
  const sofiaSystemPrompt = `
Eres Sofía, la Asistente Virtual Inteligente de Bienes Raíces de Property OS.
Objetivo: Calificar al prospecto para Crédito de Vivienda Social (VIS/ASFI) y coordinar una visita o dar seguimiento según la conversación.

REGLAS DE CALIFICACIÓN DE CUOTA INICIAL:
- Evalúa si tiene Aporte Propio/Cuota Inicial (mínimo 10% a 20%).
- Evalúa el presupuesto máximo.

INMUEBLE SUGERIDO EN BASE A LA BÚSQUEDA DEL USUARIO (RAG):
${bestMatch 
  ? `- Código de Referencia: ${bestMatch.property_code || bestMatch.id.substring(0,6)}\n- Título: ${bestMatch.title}\n- Zona: ${bestMatch.zone}\n- Precio: $${bestMatch.price_usd} USD\n- Califica VIS: ${bestMatch.accepts_social_housing ? 'SÍ' : 'NO'}\n- Descripción: ${bestMatch.raw_description}`
  : '- No se encontraron inmuebles exactos. Sugiere consultar disponibilidad general o responde en base al historial.'}

${chatHistoryText}

Responde en un tono ejecutivo, cálido y profesional (máximo 3 oraciones). Cita el Código de Referencia de la propiedad sugerida si existe. Si el cliente dice algo corto como "ok" o "estoy en clases", responde de acuerdo al historial de conversación de forma natural.
`;

  // 6. Generación de respuesta con OpenAI (gpt-4o-mini)
  let aiReplyText = "";
  let isAppointmentCreated = false;
  let appointmentDateString = "";

  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: sofiaSystemPrompt },
          { role: "user", content: `[Cliente]: "${userMessageText}"` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "agendar_visita",
              description: "Programa una cita o visita al inmueble. Usa esto solo cuando el cliente explícitamente confirme una fecha y hora aproximada.",
              parameters: {
                type: "object",
                properties: {
                  fecha: { type: "string", description: "Fecha de la cita (ej. 2026-08-07)" },
                  hora: { type: "string", description: "Hora de la cita (ej. 10:00 AM)" }
                },
                required: ["fecha", "hora"]
              }
            }
          }
        ],
        temperature: 0.7,
        max_tokens: 250,
      });

      const message = response.choices[0].message;
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        if (toolCall.function.name === "agendar_visita") {
          const args = JSON.parse(toolCall.function.arguments);
          aiReplyText = `¡Perfecto! He agendado formalmente la visita para el ${args.fecha} a las ${args.hora}. Un asesor se pondrá en contacto para afinar detalles.`;
          isAppointmentCreated = true;
          appointmentDateString = `${args.fecha} ${args.hora}`;
        }
      } else {
        aiReplyText = message.content || "";
      }
    } catch (err) {
      console.error("[Webhook] LLM Error (OpenAI):", err);
    }
  }

  // Fallback de texto con gestión de palabras clave si falla LLM
  if (!aiReplyText) {
    const wantsDepartment = lowerMsg.includes("departamento") || lowerMsg.includes("dormitorio") || lowerMsg.includes("cuarto") || lowerMsg.includes("habitacion");
    const isGreeting = lowerMsg === "hola" || lowerMsg === "hola " || lowerMsg.includes("buen dia") || lowerMsg.includes("buenas tardes");
    
    if (isGreeting && !wantsDepartment) {
      aiReplyText = `¡Hola ${senderName}! Soy Sofía, asistente virtual de Property OS. ¿En qué tipo de inmueble estás interesado hoy?`;
    } else if (wantsDepartment) {
      if (bestMatch && bestMatch.title.toLowerCase().includes("departamento")) {
        aiReplyText = `¡Hola ${senderName}! Tengo este departamento ideal para ti: "${bestMatch.title}" en ${bestMatch.zone} por $${bestMatch.price_usd}. ¿Te interesaría agendar una visita?`;
      } else {
        // Si el RAG trajo un Lote o algo que no es departamento, forzamos respuesta genérica coherente
        aiReplyText = `¡Hola ${senderName}! Contamos con departamentos de diferentes dormitorios en las mejores zonas. Un asesor te enviará nuestro catálogo en breve.`;
      }
    } else if (lowerMsg.includes("precio") || lowerMsg.includes("costo") || lowerMsg.includes("cuanto")) {
      if (bestMatch) {
        aiReplyText = `El inmueble más cercano a tu búsqueda es "${bestMatch.title}" y tiene un valor de $${bestMatch.price_usd}. ¿Quisieras detalles del financiamiento?`;
      } else {
        aiReplyText = `Los precios varían según la zona. ¿Tienes algún presupuesto aproximado en mente?`;
      }
    } else if (bestMatch) {
      aiReplyText = `¡Hola ${senderName}! Basado en tu búsqueda, te sugiero el inmueble "${bestMatch.title}" en ${bestMatch.zone} por $${bestMatch.price_usd}. ¿Te gustaría visitarlo?`;
    } else {
      aiReplyText = `¡Hola ${senderName}! Un agente se comunicará contigo en breve para asesorarte detalladamente en tu búsqueda.`;
    }
  }

  // 6. Evaluación básica de keywords para Pipeline
  const isFullyQualified = lowerMsg.includes("aporte") || lowerMsg.includes("cuota inicial") || lowerMsg.includes("banco");
  const stage = isAppointmentCreated ? "VISITA_AGENDADA" : (isFullyQualified ? "CALIFICADO_VISITA_PENDIENTE" : "EN_CALIFICACION");

  // 7. Upsert Lead en Supabase
  const { data: orgs, error: orgErr } = await supabaseServer.from("organizations").select("id").limit(1);
  if (orgErr) console.error("[Webhook] Error obteniendo Organization:", orgErr);
  const orgId = orgs?.[0]?.id || "org-1"; // Fallback para evitar error de NOT NULL

  const leadPayload = {
    organization_id: orgId,
    phone_number: rawPhoneNumber,
    full_name: senderName,
    pipeline_stage: existingLead ? existingLead.pipeline_stage : stage, // Solo actualiza stage si es nuevo o lógica manual
    ai_summary: `[Último mensaje]: ${userMessageText.substring(0, 100)}...`,
    property_interest_id: bestMatch?.id || null,
  };

  let finalLead = existingLead;
  if (existingLead) {
    const { data: updated, error: updateErr } = await supabaseServer
      .from("leads")
      .update(leadPayload)
      .eq("id", existingLead.id)
      .select()
      .single();
    if (updateErr) console.error("[Webhook] Error actualizando Lead:", updateErr);
    if (updated) finalLead = updated;
  } else {
    const { data: inserted, error: insertErr } = await supabaseServer
      .from("leads")
      .insert(leadPayload)
      .select()
      .single();
    if (insertErr) console.error("[Webhook] Error insertando Lead nuevo:", insertErr, leadPayload);
    if (inserted) finalLead = inserted;
  }

  // Guardar mensajes en la base de datos para la Central de Conversaciones
  if (finalLead?.id) {
    try {
      await supabaseServer.from("messages").insert([
        { lead_id: finalLead.id, sender: "lead", text: userMessageText },
        { lead_id: finalLead.id, sender: "ai_sofia", text: aiReplyText }
      ]);
      
      if (isAppointmentCreated) {
        const aptDate = new Date();
        aptDate.setDate(aptDate.getDate() + 1); // Día siguiente como fallback de timestamp
        
        await supabaseServer.from("appointments").insert([{
          organization_id: orgId,
          lead_id: finalLead.id,
          property_id: bestMatch?.id || null,
          appointment_date: aptDate.toISOString(),
          status: "SCHEDULED"
        }]);
      }
    } catch (msgErr) {
      console.error("[Webhook] Error guardando historial de chat o cita:", msgErr);
    }
  }

  // 8. Enviar WhatsApp (con retraso humano de 5 a 15 segundos)
  const { evolutionApiUrl, evolutionApiKey, evolutionInstance } = options;
  if (evolutionApiUrl && evolutionApiKey && evolutionInstance) {
    try {
      // Calcular retraso aleatorio entre 5000 y 15000 milisegundos
      const humanDelayMs = Math.floor(Math.random() * (15000 - 5000 + 1) + 5000);
      console.log(`[Webhook] Retraso humano aplicado: ${humanDelayMs}ms antes de responder a ${rawPhoneNumber}`);
      await new Promise(resolve => setTimeout(resolve, humanDelayMs));

      await sendWhatsAppMessage(
        rawPhoneNumber,
        aiReplyText,
        evolutionInstance,
        evolutionApiUrl,
        evolutionApiKey
      );
    } catch (sendErr) {
      console.error("[Webhook] Error enviando mensaje de WhatsApp:", sendErr);
    }
  }

  return {
    status: "SUCCESS",
    leadId: finalLead?.id,
    aiReply: aiReplyText,
    matchedProperty: bestMatch
  };
}

export async function POST(req: Request): Promise<Response> {
  // ── Log de entrada INMEDIATO — antes de cualquier validación o parseo ──────
  const rawHeaders: Record<string, string> = {};
  req.headers.forEach((v, k) => { rawHeaders[k] = v; });
  console.log("📥 [WEBHOOK ENTRY] Headers:", JSON.stringify(rawHeaders));

  let rawBody = "";
  try {
    const incomingKey = req.headers.get("apikey") || req.headers.get("x-api-key") || new URL(req.url).searchParams.get("apikey") || req.headers.get("authorization")?.replace("Bearer ", "");
    const expectedKey = process.env.WEBHOOK_SECRET || process.env.EVOLUTION_API_KEY;
    
    if (process.env.NODE_ENV === "development") {
      console.log("[Route Dev] Webhook recibido con Key:", incomingKey);
    } else if (expectedKey && incomingKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await req.json();
    const result = await processWebhookMessage(body, {
      evolutionApiUrl: process.env.EVOLUTION_API_URL,
      evolutionApiKey: process.env.EVOLUTION_API_KEY,
      evolutionInstance: process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main",
    });

    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }

  // Responder 200 INMEDIATAMENTE a Evolution API para evitar timeouts / reintentos
  // El procesamiento real se ejecuta de forma asíncrona después
  const immediateResponse = new Response(JSON.stringify({ status: "EVENT_RECEIVED" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

  // Procesar el payload de forma async (fire-and-forget seguro en Edge/Node)
  (async () => {
    try {
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        console.error("[Webhook] ❌ Body no es JSON válido:", rawBody);
        return;
      }

      // ── Validación de API Key (SOFT — solo bloquea si AMBAS están configuradas) ─
      // Si EVOLUTION_API_KEY no está en env, se permite pasar (modo setup/debug)
      const expectedKey = process.env.WEBHOOK_SECRET || process.env.EVOLUTION_API_KEY;
      if (process.env.NODE_ENV !== "development" && expectedKey) {
        const incomingKey =
          req.headers.get("apikey") ||
          req.headers.get("x-api-key") ||
          new URL(req.url).searchParams.get("apikey") ||
          req.headers.get("authorization")?.replace("Bearer ", "");
        if (incomingKey && incomingKey !== expectedKey) {
          console.warn(`[Webhook] ❌ API Key inválida. Recibida: "${incomingKey}" | Esperada: "${expectedKey?.slice(0, 6)}..."`);
          return; // Silenciar — ya se respondió 200 arriba
        }
      }

      await processWebhookMessage(body, {
        evolutionApiUrl: process.env.EVOLUTION_API_URL,
        evolutionApiKey: process.env.EVOLUTION_API_KEY,
        evolutionInstance: process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[Webhook] ❌ Error procesando mensaje:", message);
    }
  })();

  return immediateResponse;
}
