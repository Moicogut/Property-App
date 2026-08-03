import { GoogleGenAI } from "@google/genai";
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
    
    // Registrar el ID y limpiar entradas viejas para no inflar la memoria
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

  // 4. Armar el prompt para el LLM (Sofía)
  const sofiaSystemPrompt = `
Eres Sofía, la Asistente Virtual Inteligente de Bienes Raíces de Property OS.
Objetivo: Calificar al prospecto para Crédito de Vivienda Social (VIS/ASFI) y coordinar una visita.

REGLAS DE CALIFICACIÓN DE CUOTA INICIAL:
- Evalúa si tiene Aporte Propio/Cuota Inicial (mínimo 10% a 20%).
- Evalúa el presupuesto máximo.

INMUEBLE SUGERIDO EN BASE A LA BÚSQUEDA DEL USUARIO (RAG):
${bestMatch 
  ? `- Título: ${bestMatch.title}\n- Zona: ${bestMatch.zone}\n- Precio: $${bestMatch.price_usd} USD\n- Califica VIS: ${bestMatch.accepts_social_housing ? 'SÍ' : 'NO'}\n- Descripción: ${bestMatch.raw_description}`
  : '- No se encontraron inmuebles exactos. Sugiere consultar disponibilidad general.'}

Responde en un tono ejecutivo, cálido y profesional (máximo 3 oraciones).
`;

  // 5. Generación de respuesta con Gemini (si está configurado)
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
      console.error("[Webhook] LLM Error:", err);
    }
  }

  // Fallback de texto si falla LLM
  if (!aiReplyText) {
    if (bestMatch) {
      aiReplyText = `¡Hola ${senderName}! El inmueble ${bestMatch.title} en ${bestMatch.zone} califica a sus requerimientos por $${bestMatch.price_usd}. ¿Le gustaría agendar una visita?`;
    } else {
      aiReplyText = `¡Hola ${senderName}! Un agente se comunicará con usted en breve para asesorarle en su búsqueda.`;
    }
  }

  // 6. Evaluación básica de keywords para Pipeline
  const lowerMsg = userMessageText.toLowerCase();
  const isFullyQualified = lowerMsg.includes("aporte") || lowerMsg.includes("cuota inicial") || lowerMsg.includes("banco");
  const stage = isFullyQualified ? "CALIFICADO_VISITA_PENDIENTE" : "EN_CALIFICACION";

  // 7. Upsert Lead en Supabase
  const { data: orgs } = await supabaseServer.from("organizations").select("id").limit(1);
  const orgId = orgs?.[0]?.id;

  const leadPayload = {
    organization_id: orgId,
    phone_number: rawPhoneNumber,
    full_name: senderName,
    pipeline_stage: existingLead ? existingLead.pipeline_stage : stage, // Solo actualiza stage si es nuevo o lógica manual
    ai_summary: `[Último mensaje]: ${userMessageText.substring(0, 100)}...`,
    property_interest_id: bestMatch?.id || null,
  };

  let finalLead;
  if (existingLead) {
    const { data: updated } = await supabaseServer
      .from("leads")
      .update(leadPayload)
      .eq("id", existingLead.id)
      .select()
      .single();
    finalLead = updated;
  } else {
    const { data: inserted } = await supabaseServer
      .from("leads")
      .insert(leadPayload)
      .select()
      .single();
    finalLead = inserted;
  }

  // 8. Enviar WhatsApp
  const { evolutionApiUrl, evolutionApiKey, evolutionInstance } = options;
  if (evolutionApiUrl && evolutionApiKey && evolutionInstance) {
    await sendWhatsAppMessage(
      rawPhoneNumber,
      aiReplyText,
      evolutionInstance,
      evolutionApiUrl,
      evolutionApiKey
    );
  }

  return {
    status: "SUCCESS",
    leadId: finalLead?.id,
    aiReply: aiReplyText,
    matchedProperty: bestMatch
  };
}

export async function POST(req: Request): Promise<Response> {
  try {
    const expectedKey = process.env.EVOLUTION_API_KEY;
    if (expectedKey) {
      const incomingKey = req.headers.get("apikey") || req.headers.get("authorization")?.replace("Bearer ", "");
      if (incomingKey !== expectedKey) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }
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
}
