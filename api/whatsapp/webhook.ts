import type { IncomingMessage, ServerResponse } from "http";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { waitUntil } from '@vercel/functions';
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// 1. Instancia Supabase Server Inline
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://lqagnlbygzurddkzbbwn.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServer = createClient(supabaseUrl, supabaseKey);

// 2. Evolution API Inline
async function sendWhatsAppMessage(phone: string, text: string, instanceName: string, apiUrl: string, apiKey: string) {
  // 1. Limpieza estricta del número:
  const recipientNumber = phone.replace('@s.whatsapp.net', '').replace('@g.us', '').replace(/\D/g, '');

  try {
    console.log(`[Evolution API] Enviando mensaje a: ${recipientNumber} en instancia: ${instanceName}`);
    
    // 2. Formato del Payload para Evolution API v2:
    const payload = {
      number: recipientNumber,
      text: text
    };

    // 3. POST a Evolution API
    const rawBaseUrl = apiUrl || process.env.EVOLUTION_API_URL || "https://evolution-api-production-a3a5.up.railway.app";
    const cleanBaseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
    const instance = instanceName || process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main";
    const targetUrl = `${cleanBaseUrl}/message/sendText/${instance}`;
    
    console.log("[Evolution API Target URL]:", targetUrl);

    const GLOBAL_API_KEY = "a2bf8aaaec21a9806766c4a536c75e716d1480feff6f9705697bf626e8fab135";
    const activeApiKey = apiKey || process.env.EVOLUTION_API_KEY || GLOBAL_API_KEY;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": activeApiKey
      },
      body: JSON.stringify({
        number: String(recipientNumber),
        text: text,
        delay: Math.floor(Math.random() * (3500 - 1500 + 1) + 1500), // 1.5s to 3.5s of typing
        presence: "composing" // Shows "typing..." in WhatsApp
      })
    });
    
    const responseText = await response.text();
    let evoData: any = responseText;
    try {
      evoData = JSON.parse(responseText);
    } catch (e) {
      // Ignorar si no es JSON
    }
    
    console.log("[Evolution API] Enviando con apikey status:", response.status);
    console.log("[Evolution API Delivery Result]:", evoData?.status || evoData);
    
    if (!response.ok) console.error("[Evolution API] Error HTTP:", response.status);
    return response.ok;
  } catch (err) {
    console.error("[Evolution API] Fallo de red:", err);
    return false;
  }
}

// 3. OpenAI Embeddings Inline (text-embedding-3-small 768d)
async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 768
    });
    const embedding = response.data[0]?.embedding;
    return embedding && embedding.length === 768 ? embedding : Array(768).fill(0);
  } catch (err) {
    console.warn("[OpenAI] Embeddings API Error (fallback to dummy):", err);
    return Array.from({ length: 768 }, () => (Math.random() - 0.5) * 0.1);
  }
}

// Cache simple en memoria para idempotencia (Message ID -> Timestamp)
const processedMessages = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 60000; // 60 segundos

interface WebhookProcessOptions {
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionInstance?: string;
}

export async function processWebhookMessage(
  body: Record<string, unknown>,
  options: WebhookProcessOptions = {}
): Promise<any> {
  const payload = body;
  console.log("📥 [WEBHOOK_PAYLOAD]:", JSON.stringify(payload).substring(0, 500) + "...");
  
  const payloadApiKey = (payload.apikey as string) || (payload.data && (payload.data as any).apikey) || undefined;
  
  const messageDataObj = (payload.data as Record<string, any>) || (payload as Record<string, any>);
  const keyData = messageDataObj.key || {};
  
  // Extraer el JID del cliente que envía el mensaje:
  const rawRemoteJid = (keyData.remoteJid as string) || (messageDataObj.sender as string) || (payload.remoteJid as string) || "";
  
  // Limpiar para obtener SOLO los dígitos del cliente:
  const rawPhoneNumber = rawRemoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '').replace(/\D/g, '');
  
  console.log("[Webhook] Remitente real del CLIENTE para responder:", rawPhoneNumber);

  const messageId = (keyData.id as string) || (payload.id as string) || "";
  const fromMe = (keyData.fromMe as boolean) ?? (payload.fromMe as boolean) ?? false;
  
  const messageData = messageDataObj.message as Record<string, any> | undefined;
  const extText = messageData?.extendedTextMessage?.text;
  const userMessageText = (messageData?.conversation as string) || (extText as string) || (payload.message as string) || "";

  if (fromMe) {
    console.log("[Webhook Skip] Ignorando mensaje saliente generado por el bot (fromMe: true)");
    return { skipped: true, reason: "fromMe", status: "IGNORED" };
  }

  if (!rawRemoteJid || rawRemoteJid.includes("@g.us")) {
    console.log(`[IGNORE] Group message or missing JID: ${rawRemoteJid}`);
    return { status: "IGNORED", reason: "Group message or missing JID" };
  }

  const senderName = (messageDataObj?.pushName as string) || (payload.pushName as string) || "Cliente WhatsApp";

  console.log(`[Webhook] Remitente extraído: ${rawPhoneNumber} (${senderName})`);

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

  // 4. Obtener Organización y Configuración IA TEMPRANO
  const { data: orgs, error: orgErr } = await supabaseServer.from("organizations").select("*").limit(1);
  if (orgErr) console.error("[Webhook] Error obteniendo Organization:", orgErr);
  const orgId = orgs?.[0]?.id || "org-1"; // Fallback para evitar error de NOT NULL
  const aiConfig = orgs?.[0]?.ai_config || {
    systemRules: "Eres Sofía, Asesora Inmobiliaria de Property OS. Califica al prospecto (Cuota inicial, presupuesto).",
    tone: "Cálida, profesional y ejecutiva. Máximo 2 oraciones.",
    fallbacks: "Si pregunta por temas no inmobiliarios, deniega amablemente."
  };

  // 4.1 Recuperar Historial de Chat
  let chatHistoryText = "";
  let historyCount = 0;
  if (existingLead) {
    const { data: historyData } = await supabaseServer
      .from("messages")
      .select("sender, text")
      .eq("lead_id", existingLead.id)
      .order("created_at", { ascending: false })
      .limit(6);
      
    if (historyData && historyData.length > 0) {
      historyCount = historyData.length;
      // Revertir para orden cronológico
      const sortedHistory = historyData.reverse();
      chatHistoryText = "HISTORIAL DE CONVERSACIÓN RECIENTE:\n" + sortedHistory.map(msg => 
        `[${msg.sender === "lead" ? "Cliente" : "Sofía"}]: ${msg.text}`
      ).join("\n");
    }
  }

  // FRENO LÓGICO (Context Control)
  const wordCount = userMessageText.trim().split(/\s+/).length;
  if (wordCount < 3 && historyCount === 0) {
    console.log(`[Webhook] Freno lógico activado para mensaje corto: "${userMessageText}" sin historial.`);
    const fallbackReply = `¡Hola ${senderName}! Soy Sofía de Property OS. Para ayudarte mejor, ¿podrías darme un poco más de detalles sobre qué tipo de inmueble buscas o en qué zona?`;
    
    // Upsert Lead inicial y retornar rápido
    const stage = "EN_CALIFICACION";
    const leadPayload = {
      organization_id: orgId,
      phone_number: rawPhoneNumber,
      full_name: senderName,
      pipeline_stage: stage,
      ai_summary: `[Último mensaje]: ${userMessageText.substring(0, 100)}...`,
    };
    
    let fastLead = existingLead;
    if (!existingLead) {
      const { data: inserted } = await supabaseServer.from("leads").insert(leadPayload).select().single();
      if (inserted) fastLead = inserted;
    }

    if (fastLead?.id) {
      await supabaseServer.from("messages").insert([
        { lead_id: fastLead.id, sender: "lead", text: userMessageText },
        { lead_id: fastLead.id, sender: "ai_sofia", text: fallbackReply }
      ]);
    }

    const { evolutionApiUrl, evolutionApiKey, evolutionInstance } = options;
    if (evolutionApiUrl && evolutionInstance) {
      await sendWhatsAppMessage(rawPhoneNumber, fallbackReply, evolutionInstance, evolutionApiUrl, payloadApiKey || evolutionApiKey || "");
    }
    
    return { status: "SHORT_CIRCUIT", reason: "Mensaje sin contexto inicial", leadId: fastLead?.id };
  }

  // 3. RAG Nativo en PostgreSQL
  let matchedProperties: any[] = [];
  try {
    const queryEmbedding = await generateEmbedding(userMessageText);

    const { data: matches, error: rpcError } = await supabaseServer.rpc("match_properties", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.3, // Podría subirse a 0.5 luego
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

  // 5. Armar el prompt estructurado para el LLM (Sofía)
  const sofiaSystemPrompt = `
<system_rules>
${aiConfig.systemRules}
REGLA DE ORO: Si hay HISTORIAL DE CONVERSACIÓN RECIENTE, NO SALUDES de nuevo. Ve directo al punto.
</system_rules>

<tone>
${aiConfig.tone}
</tone>

<fallbacks>
${aiConfig.fallbacks}
Si el INMUEBLE SUGERIDO (RAG) no coincide lógicamente con lo que busca el usuario (ej. busca casa y el RAG sugiere un lote), IGNORA EL INMUEBLE y haz una repregunta.
</fallbacks>

<rag_enforcement>
OBLIGATORIO: Si hay un INMUEBLE SUGERIDO válido abajo, DEBES mencionarlo EXPLÍCITAMENTE en tu respuesta (citando al menos el Título y el Precio). ESTÁ ESTRICTAMENTE PROHIBIDO decir "tenemos varias opciones" sin presentar los datos reales del inmueble sugerido.
</rag_enforcement>

INMUEBLE SUGERIDO EN BASE A LA BÚSQUEDA DEL USUARIO (RAG):
${bestMatch 
  ? `- Código de Referencia: ${bestMatch.property_code || bestMatch.id.substring(0,6)}\n- Título: ${bestMatch.title}\n- Zona: ${bestMatch.zone}\n- Precio: $${bestMatch.price_usd} USD\n- Descripción: ${bestMatch.raw_description}`
  : '- No se encontraron inmuebles exactos. Ofrece ayuda genérica o pregunta detalles.'}

${chatHistoryText}
`;

  // 6. Generación de respuesta con OpenAI (gpt-4o-mini)
  let aiReplyText = "";
  let isAppointmentCreated = false;
  let appointmentDateString = "";

  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      // Herramientas disponibles (condicionadas a que no haya visita ya agendada)
      const tools: any[] = [];
      if (existingLead?.pipeline_stage !== "VISITA_AGENDADA") {
        tools.push({
          type: "function",
          function: {
            name: "agendar_visita",
            description: `Programa una cita o visita al inmueble. Usa esto SOLO LA PRIMERA VEZ que el cliente acepta agendar explícitamente una fecha/hora. NO lo uses si el cliente solo agradece o si pide la ubicación de una cita ya agendada. Usa SIEMPRE el año actual (${new Date().getFullYear()}).`,
            parameters: {
              type: "object",
              properties: {
                fecha: { type: "string", description: `Fecha de la cita (ej. ${new Date().getFullYear()}-08-07)` },
                hora: { type: "string", description: "Hora de la cita (ej. 10:00 AM)" }
              },
              required: ["fecha", "hora"]
            }
          }
        });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: sofiaSystemPrompt },
          { role: "user", content: `[Cliente]: "${userMessageText}"` }
        ],
        tools: tools.length > 0 ? tools : undefined,
        temperature: 0.7,
        max_tokens: 250,
      });

      const message = response.choices[0].message;
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0] as any;
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

  console.log(`[Webhook] Respuesta final de la IA generada:`, aiReplyText);

  // 6. Evaluación básica de keywords para Pipeline
  const isFullyQualified = lowerMsg.includes("aporte") || lowerMsg.includes("cuota inicial") || lowerMsg.includes("banco");
  const stage = isAppointmentCreated ? "VISITA_AGENDADA" : (isFullyQualified ? "CALIFICADO_VISITA_PENDIENTE" : "EN_CALIFICACION");

  // 7. Extracción BANT (Asíncrono en background - JSON mode)
  let extractedBant: any = null;
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const bantPrompt = `Eres un sistema experto en Scoring Inmobiliario BANT (Budget, Authority, Need, Timeline). 
Extrae o deduce estos atributos basados en el historial y el último mensaje del lead.
Responde ÚNICAMENTE en JSON con la siguiente estructura estricta:
{
  "budget": 0, // número (USD). Intenta extraer el presupuesto máximo declarado por el cliente. 0 si es desconocido.
  "authority": false, // booleano. ¿Es el tomador de decisión? (asume true a menos que diga que debe consultar a un familiar/pareja).
  "need": "", // string corto de 5 palabras máximo resumiendo lo que busca.
  "timeline": "", // string corto (ej. "En 3 meses", "Inmediato"). "" si es desconocido.
  "preferred_zone": "", // string. La zona o barrio que el cliente mencionó explícitamente (ej. "Sopocachi", "Equipetrol Norte"). "" si no se mencionó.
  "score": 0 // número de 0 a 100 (100 = listo para comprar, 50 = tibio, 0 = no calificado).
}`;
      const bantResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: bantPrompt },
          { role: "user", content: `HISTORIAL:\n${chatHistoryText}\nULTIMO MENSAJE: "${userMessageText}"` }
        ],
        temperature: 0.1,
      });
      const parsed = JSON.parse(bantResponse.choices[0].message.content || "{}");
      if (typeof parsed.budget === "number" && typeof parsed.score === "number") {
        extractedBant = parsed;
      }
    } catch (err) {
      console.error("[Webhook] Error extrayendo BANT:", err);
    }
  }

  // 8. Upsert Lead en Supabase (orgId ya se obtuvo arriba)
  const leadPayload: any = {
    organization_id: orgId,
    phone_number: rawPhoneNumber,
    full_name: senderName,
    pipeline_stage: existingLead ? existingLead.pipeline_stage : stage,
    ai_summary: `[Último mensaje]: ${userMessageText.substring(0, 100)}...`,
    property_interest_id: bestMatch?.id || null,
  };
  
  if (extractedBant) {
    leadPayload.bant_score = extractedBant;
    // Sincronizar campos principales para que el frontend los lea sin depender del JSON
    if (extractedBant.budget > 0) {
      leadPayload.budget_max_usd = extractedBant.budget;
    }
    if (extractedBant.preferred_zone) {
      leadPayload.preferred_zone = extractedBant.preferred_zone;
    }
  }

  let finalLead = existingLead;
  if (existingLead) {
    const { data: updated } = await supabaseServer.from("leads").update(leadPayload).eq("id", existingLead.id).select().single();
    if (updated) finalLead = updated;
  } else {
    const { data: inserted } = await supabaseServer.from("leads").insert(leadPayload).select().single();
    if (inserted) finalLead = inserted;
  }

  if (finalLead?.id) {
    try {
      await supabaseServer.from("messages").insert([
        { lead_id: finalLead.id, sender: "lead", text: userMessageText },
        { lead_id: finalLead.id, sender: "ai_sofia", text: aiReplyText }
      ]);
      if (isAppointmentCreated) {
        const aptDate = new Date();
        aptDate.setDate(aptDate.getDate() + 1);
        await supabaseServer.from("appointments").insert([{
          organization_id: orgId,
          lead_id: finalLead.id,
          property_id: bestMatch?.id || null,
          appointment_date: aptDate.toISOString(),
          status: "SCHEDULED"
        }]);
      }
    } catch (msgErr) {
      console.error("[Webhook] Error guardando historial:", msgErr);
    }
  }

  // 10. Enviar WhatsApp (con retraso humano acotado < 2s para evitar timeout)
  const { evolutionApiUrl, evolutionApiKey, evolutionInstance } = options;
  if (evolutionApiUrl && evolutionApiKey && evolutionInstance) {
    try {
      // Máximo 1500ms para asegurar que todo termina en < 8s
      const humanDelayMs = Math.min(Math.floor(aiReplyText.length * 15), 1500);
      console.log(`[Webhook] Retraso dinámico acotado aplicado: ${humanDelayMs}ms`);
      await new Promise(resolve => setTimeout(resolve, humanDelayMs));

      await sendWhatsAppMessage(rawPhoneNumber, aiReplyText, evolutionInstance, evolutionApiUrl, payloadApiKey || evolutionApiKey || "");
      
      // MOTOR DE ALERTAS PUSH PARA EL AGENTE
      if (isAppointmentCreated) {
        let agentPhone = "";
        
        // Nivel 1: Teléfono del Agente Asignado
        if (finalLead?.assigned_agent_id) {
          const { data: agentData } = await supabaseServer.from("users").select("phone_number").eq("id", finalLead.assigned_agent_id).single();
          if (agentData?.phone_number) agentPhone = agentData.phone_number;
        }
        
        // Nivel 2: Configuración de la Organización
        if (!agentPhone && aiConfig?.defaultAgentPhone) {
          agentPhone = aiConfig.defaultAgentPhone;
        }
        
        // Nivel 3: Fallback de Variable de Entorno (.env)
        if (!agentPhone && process.env.AGENT_PHONE_NUMBER) {
          agentPhone = process.env.AGENT_PHONE_NUMBER;
        }

        if (agentPhone) {
          const pushAlertText = `*NUEVA VISITA AGENDADA* 🚨\n\n*Lead:* ${senderName}\n*Teléfono:* ${rawPhoneNumber}\n*Fecha/Hora:* ${appointmentDateString}\n*Inmueble:* ${bestMatch?.title || 'Por definir'}\n*Presupuesto (BANT):* $${extractedBant?.budget || 0}\n\n👉 Accede al Kanban para más detalles.`;
          await sendWhatsAppMessage(agentPhone, pushAlertText, evolutionInstance, evolutionApiUrl, payloadApiKey || evolutionApiKey || "");
          console.log(`[Webhook] 📱 Push Alert enviado al agente (${agentPhone})`);
        } else {
          console.log("[Webhook] ⚠️ Visita agendada pero no hay teléfono de agente configurado (AGENT_PHONE_NUMBER).");
        }
      }
    } catch (sendErr) {
      console.error("[Webhook] Error enviando mensaje:", sendErr);
    }
  }

  return { status: "SUCCESS", leadId: finalLead?.id };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ status: "WEBHOOK_ACTIVE", system: "Property OS" });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Log inicial
  console.log('WEBHOOK_HIT:', JSON.stringify(req.body).substring(0, 300) + '...');
  
  // 1. Responder INMEDIATAMENTE HTTP 200 para evitar timeout en WhatsApp/Evolution
  res.status(200).json({ status: 'OK' });
  
  // 2. Ejecutar proceso pesado en background usando waitUntil
  const body = req.body || {};
  waitUntil(
    processWebhookMessage(body, {
      evolutionApiUrl: process.env.EVOLUTION_API_URL,
      evolutionApiKey: process.env.EVOLUTION_API_KEY,
      evolutionInstance: process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main",
    }).catch(err => {
      console.error('ERROR_PROCESSING_WEBHOOK:', err);
    })
  );
}
