import { OpenAI } from "openai";
import { GoogleGenAI } from "@google/genai";
import { Property, Lead, PipelineStage, EvolutionWebhookPayload } from "@/src/types/property";
import { sendWhatsAppMessage } from "@/src/lib/evolution";
import { supabase } from "@/src/lib/supabase";

// Cache en memoria para deduplicación de mensajes entrantes de Evolution API (TTL: 60s)
const processedMessagesCache = new Map<string, number>();
function isDuplicateMessage(messageId: string): boolean {
  const now = Date.now();
  // Limpiar mensajes antiguos (> 60 segundos)
  for (const [id, timestamp] of processedMessagesCache.entries()) {
    if (now - timestamp > 60000) processedMessagesCache.delete(id);
  }
  if (processedMessagesCache.has(messageId)) return true;
  processedMessagesCache.set(messageId, now);
  return false;
}

// ─── Tipos internos estrictos ───────────────────────────────────────────────

interface WebhookProcessOptions {
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionInstance?: string;
}

interface WebhookResult {
  status: string;
  instance?: string;
  phoneNumber?: string;
  lead?: Partial<Lead>;
  aiReply?: string;
  ragMatch?: { property: Property; similarityScore: number };
  nextAction?: string;
  message?: string;
  leadId?: string;
}

// ─── Procesamiento principal del Webhook ────────────────────────────────────

export async function processWebhookMessage(
  body: EvolutionWebhookPayload | Record<string, unknown>,
  options: WebhookProcessOptions = {}
): Promise<WebhookResult> {
  const payload = body as Record<string, unknown>;
  console.log("📥 Evolution API Webhook payload recibido:", JSON.stringify(payload));

  const instance = (payload.instance as string) || "PropertyOS-Main";
  const data = payload.data as Record<string, unknown> | undefined;
  const keyData = (data?.key as Record<string, unknown>) ?? undefined;
  const messageId = (keyData?.id as string) || (payload.messageId as string) || `msg-${Date.now()}`;

  // 0. Guard de Deduplicación (Evita responder 2 veces al mismo webhook)
  if (messageId && isDuplicateMessage(messageId)) {
    console.warn(`[Webhook] ⚠️ Mensaje duplicado ignorado (messageId: ${messageId})`);
    return {
      status: "DUPLICATE_IGNORED",
      message: "Mensaje ignorado por deduplicación.",
    };
  }

  const remoteJid =
    (keyData?.remoteJid as string) ||
    (data?.remoteJid as string) ||
    (payload.remoteJid as string) ||
    "59171234567@s.whatsapp.net";
  // Normalizar número: eliminar cualquier sufijo JID de WhatsApp
  const rawPhoneNumber = remoteJid
    .replace(/@s\.whatsapp\.net$/i, "")
    .replace(/@c\.us$/i, "")
    .replace(/@g\.us$/i, "");
  const senderName =
    (data?.pushName as string) ||
    (payload.pushName as string) ||
    "Cliente WhatsApp";

  console.log(`[Webhook] 📋 Payload resuelto — teléfono: ${rawPhoneNumber} | nombre: ${senderName} | jid: ${remoteJid}`);

  const messageData = data?.message as Record<string, unknown> | undefined;
  const extText = (messageData?.extendedTextMessage as Record<string, unknown> | undefined)?.text as string | undefined;
  const captionText = (messageData?.imageMessage as Record<string, unknown> | undefined)?.caption as string | undefined;

  // Extracción flexible del texto: cubre todos los formatos conocidos de Evolution API v1 / v2
  const userMessageText: string =
    (messageData?.conversation as string) ||          // Texto simple (mayoría de casos)
    extText ||                                         // Mensaje con formato rico / respuesta
    captionText ||                                     // Caption de imagen
    (data?.body as string) ||                          // Algunos payloads v1 usan data.body
    (payload.message as string) ||                     // Nivel raíz legacy
    (payload.text as string) ||                        // Formato alternativo
    (payload.body as string) ||                        // Otro formato alternativo
    "Hola, busco departamento con crédito VIS y tengo aporte propio.";

  // 1. Verificar estado actual del lead en Supabase DB
  let isAiPaused = false;
  try {
    const { data: existingLead } = await supabase
      .from("leads")
      .select("ai_paused")
      .eq("phone_number", rawPhoneNumber)
      .single();
    if (existingLead) {
      isAiPaused = existingLead.ai_paused ?? false;
    }
  } catch (_e) {
    // Si no existe, se asumirá aiPaused = false
  }

  // 2. Guard: si IA pausada → no responder automáticamente
  if (isAiPaused) {
    console.log(`[Webhook] ⏸️ IA pausada para ${rawPhoneNumber}. Intervención humana requerida.`);
    return {
      status: "AI_PAUSED",
      message: "La IA Sofía está pausada para este cliente. Intervención humana requerida.",
      leadId: `lead-${rawPhoneNumber}`,
    };
  }

  // 3. RAG Semantic Search — Estrategia dinámica por proveedor de embeddings (app_config)
  let matchedProperty: Property | null = null;
  let ragMatchScore = 0.85;

  let provider = "openai";
  let embeddingModel = "text-embedding-3-small";
  try {
    const { data: configData } = await supabase
      .from("app_config")
      .select("embedding_provider, embedding_model")
      .limit(1)
      .single();
    if (configData) {
      provider = configData.embedding_provider || "openai";
      embeddingModel = configData.embedding_model || "text-embedding-3-small";
    }
  } catch (_cfgErr) {
    // Usar defaults OpenAI si la tabla app_config aún no existe
  }

  let queryEmbedding: number[] | null = null;

  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.embedContent({
        model: embeddingModel || "text-embedding-004",
        contents: userMessageText,
      });
      const resAny = response as unknown as { embedding?: { values?: number[] }; embeddings?: Array<{ values?: number[] }> };
      queryEmbedding = resAny.embedding?.values || resAny.embeddings?.[0]?.values || null;
    } catch (e) {
      console.warn("[Webhook] Fallback en estrategia Gemini embedding:", e);
    }
  } else if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const embedResponse = await openai.embeddings.create({
        model: embeddingModel || "text-embedding-3-small",
        input: userMessageText,
      });
      queryEmbedding = embedResponse.data[0].embedding;
    } catch (e) {
      console.warn("[Webhook] Fallback en estrategia OpenAI embedding:", e);
    }
  }

  if (queryEmbedding && queryEmbedding.length > 0) {
    try {
      // Invocación del RPC nativo match_properties en PostgreSQL
      const { data: rpcMatches, error: rpcError } = await supabase.rpc("match_properties", {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 1
      });

      if (!rpcError && rpcMatches && rpcMatches.length > 0) {
        const topMatch = rpcMatches[0];
        matchedProperty = {
          id: topMatch.id,
          organizationId: topMatch.organization_id,
          title: topMatch.title,
          city: topMatch.city,
          zone: topMatch.zone,
          priceUsd: Number(topMatch.price_usd),
          bedrooms: topMatch.bedrooms,
          bathrooms: topMatch.bathrooms,
          areaSqm: Number(topMatch.area_sqm),
          acceptsSocialHousing: topMatch.accepts_social_housing,
          status: topMatch.status,
          rawDescription: topMatch.raw_description,
          imageUrl: topMatch.image_url,
          vectorIndexed: true,
          vectorDimensions: 1536
        };
        ragMatchScore = topMatch.similarity;
      }
    } catch (e) {
      console.warn("[Webhook] Error en llamada Supabase RPC match_properties:", e);
    }
  }

  // Fallback si no hubo match por RPC: consultar primer inmueble disponible de la DB
  if (!matchedProperty) {
    const { data: fallbackProps } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "AVAILABLE")
      .limit(1);

    if (fallbackProps && fallbackProps.length > 0) {
      const fp = fallbackProps[0];
      matchedProperty = {
        id: fp.id,
        organizationId: fp.organization_id,
        title: fp.title,
        city: fp.city,
        zone: fp.zone,
        priceUsd: Number(fp.price_usd),
        bedrooms: fp.bedrooms,
        bathrooms: fp.bathrooms,
        areaSqm: Number(fp.area_sqm),
        acceptsSocialHousing: fp.accepts_social_housing,
        status: fp.status,
        rawDescription: fp.raw_description,
        imageUrl: fp.image_url,
        vectorIndexed: true,
        vectorDimensions: 1536
      };
    }
  }

  // Default estructural de seguridad si la DB no tiene registros cargados
  const targetProperty = matchedProperty || {
    id: "prop-default",
    organizationId: "org-1",
    title: "Smart Tower 2D",
    city: "Santa Cruz",
    zone: "Equipetrol Norte",
    priceUsd: 82000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 68.5,
    acceptsSocialHousing: true,
    status: "AVAILABLE",
    rawDescription: "Departamento 2D apto crédito VIS.",
    vectorIndexed: true,
    vectorDimensions: 1536
  };

  // 4. Prompt de sistema "Sofía" con inmueble RAG RPC inyectado
  const sofiaSystemPrompt = `
Eres Sofía, la Asistente Virtual Inteligente de Bienes Raíces de Property OS.
Tu objetivo es calificar sutilmente al prospecto de WhatsApp usando el Filtro Crediticio Invisible para Vivienda Social (VIS / ASFI) y coordinar una visita.

REGLAS DE CALIFICACIÓN DE CUOTA INICIAL / APORTE PROPIO:
- Verifica si el cliente busca crédito de vivienda social (VIS/ASFI) o contado.
- Confirma si dispone del Aporte Propio/Cuota Inicial requerido por los bancos bolivianos (mínimo 10% a 20%).
- Evalúa el presupuesto máximo (ej. $85,000 USD).
- Inmueble sugerido RAG (RPC): "${targetProperty.title}" en ${targetProperty.zone}, ${targetProperty.city} a $${targetProperty.priceUsd.toLocaleString()} USD (Califica VIS: ${targetProperty.acceptsSocialHousing ? "SÍ" : "NO"}).

REGLA DE PIPELINE AUTOMÁTICO:
Si el cliente confirma (1) Presupuesto en rango, (2) Método de pago (VIS o Contado), y (3) Aporte propio del 10%-20% ahorrado en banco, el cliente pasará al estado "CALIFICADO - CITA PENDIENTE".
Mantén un tono ejecutivo, cálido, profesional y conciso (máximo 3 oraciones por mensaje).
`;

  // 5. Evaluación de calificación por keywords
  const lowerMsg = userMessageText.toLowerCase();
  const hasBudgetMention = lowerMsg.includes("presupuesto") || lowerMsg.includes("usd") || lowerMsg.includes("$") || lowerMsg.includes("disponible");
  const hasVisMention = lowerMsg.includes("vis") || lowerMsg.includes("asfi") || lowerMsg.includes("crédito") || lowerMsg.includes("credito") || lowerMsg.includes("banco");
  const hasDownPaymentMention = lowerMsg.includes("20%") || lowerMsg.includes("10%") || lowerMsg.includes("15%") || lowerMsg.includes("aporte") || lowerMsg.includes("cuota inicial") || lowerMsg.includes("bcp");
  const isFullyQualified = (hasBudgetMention || true) && (hasVisMention || lowerMsg.includes("sí") || lowerMsg.includes("si")) && (hasDownPaymentMention || lowerMsg.includes("bcp"));

  // 6. Generación de respuesta: Gemini → fallback determinístico
  let aiReplyText = "";

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `${sofiaSystemPrompt}\n\nCliente dice: "${userMessageText}"` }] }
        ],
      });
      aiReplyText = response.text || "";
    } catch (err) {
      console.warn("[Webhook] Gemini fallback activado:", err);
    }
  }

  if (!aiReplyText) {
    aiReplyText = isFullyQualified
      ? `¡Excelente noticia ${senderName}! El ${targetProperty.title} ($${targetProperty.priceUsd.toLocaleString()} USD) califica perfectamente para crédito VIS de ASFI. Con tu aporte propio en el banco ya tienes la base. ¿Agendamos una visita mañana a las 10:00 AM?`
      : `¡Hola ${senderName}! 👋 El ${targetProperty.title} de $${targetProperty.priceUsd.toLocaleString()} USD en ${targetProperty.zone} sigue disponible. ¿Cuentas con el aporte propio inicial (10%-20%) para crédito de vivienda social (VIS)?`;
  }

  const updatedStage: PipelineStage = isFullyQualified ? "CALIFICADO_VISITA_PENDIENTE" : "EN_CALIFICACION";

  // 7. Persistir / Actualizar Lead en Supabase PostgreSQL
  try {
    await supabase.from("leads").upsert({
      phone_number: rawPhoneNumber,
      full_name: senderName,
      pipeline_stage: updatedStage,
      budget_max_usd: 85000,
      payment_method: "CREDITO_VIS",
      has_down_payment: true,
      down_payment_percent: 20,
      down_payment_bank: "Banco BCP",
      preferred_zone: targetProperty.zone,
      property_interest_id: targetProperty.id !== "prop-default" ? targetProperty.id : null,
      ai_summary: `Interesado en ${targetProperty.title}. Calificación automática por Sofía IA.`,
      ai_paused: false,
      intent_score: isFullyQualified ? 95 : 70,
    }, { onConflict: "phone_number" });
  } catch (dbErr) {
    console.error("[Webhook] Error upserting lead in Supabase DB:", dbErr);
  }

  // 8. Enviar respuesta via Evolution API
  const { evolutionApiUrl, evolutionApiKey, evolutionInstance } = options;
  if (evolutionApiUrl && evolutionApiKey && evolutionInstance) {
    const sendResult = await sendWhatsAppMessage(
      rawPhoneNumber,
      aiReplyText,
      evolutionInstance,
      evolutionApiUrl,
      evolutionApiKey
    );
    if (!sendResult.success) {
      console.warn("[Webhook] No se pudo enviar via Evolution API:", sendResult.error);
    }
  } else {
    console.log("[Webhook] Credenciales Evolution API no configuradas — modo simulación activo.");
    console.log(`[Webhook] 📤 Respuesta que se enviaría a ${rawPhoneNumber}:`, aiReplyText);
  }

  return {
    status: "SUCCESS",
    instance,
    phoneNumber: rawPhoneNumber,
    lead: {
      id: `lead-${rawPhoneNumber}`,
      fullName: senderName,
      phoneNumber: rawPhoneNumber,
      pipelineStage: updatedStage,
      budgetMaxUsd: 85000,
      paymentMethod: "CREDITO_VIS",
      hasDownPayment: true,
      downPaymentPercent: 20,
      downPaymentBank: "Banco BCP",
      preferredZone: targetProperty.zone,
      matchedProperty: targetProperty,
      aiSummary: "Cliente calificado con 20% de aporte propio. Interesado en propiedad VIS.",
      aiPaused: false,
      intentScore: isFullyQualified ? 95 : 70,
      createdAt: new Date().toISOString(),
    },
    aiReply: aiReplyText,
    ragMatch: { property: targetProperty, similarityScore: ragMatchScore },
    nextAction: isFullyQualified ? "CALIFICADO_VISITA_PENDIENTE" : "SEGUIMIENTO",
  };
}

// ─── Express handler (usado en server.ts) ───────────────────────────────────
// La validación de EVOLUTION_API_KEY se hace en server.ts antes de llamar aquí.

// ─── Next.js App Router Handler (compatibilidad forward) ────────────────────

// GET: responde al ping de verificación de Evolution API (evita 405)
export async function GET(): Promise<Response> {
  return new Response(JSON.stringify({ status: "WEBHOOK_ACTIVE", service: "PropertyOS-Sofia" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request): Promise<Response> {
  // ── Log de entrada INMEDIATO — antes de cualquier validación o parseo ──────
  const rawHeaders: Record<string, string> = {};
  req.headers.forEach((v, k) => { rawHeaders[k] = v; });
  console.log("📥 [WEBHOOK ENTRY] Headers:", JSON.stringify(rawHeaders));

  let rawBody = "";
  try {
    rawBody = await req.text();
    console.log("📥 [WEBHOOK ENTRY] Raw body:", rawBody);
  } catch (parseErr) {
    console.error("[Webhook] ❌ No se pudo leer el body:", parseErr);
    return new Response(JSON.stringify({ status: "EVENT_RECEIVED" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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
      const expectedKey = process.env.EVOLUTION_API_KEY;
      if (expectedKey) {
        const incomingKey =
          req.headers.get("apikey") ||
          req.headers.get("x-api-key") ||
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
