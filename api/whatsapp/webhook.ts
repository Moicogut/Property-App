import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ── 1. SUPABASE CLIENT LAZY INIT PROXY ──
const FALLBACK_SUPABASE_URL = "https://lqagnlbygzurddkzbbwn.supabase.co";

let _supabaseServer: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabaseServer) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || FALLBACK_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
    _supabaseServer = createClient(supabaseUrl, supabaseKey || "dummy-key-for-init");
  }
  return _supabaseServer;
}

const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? (val as (...args: unknown[]) => unknown).bind(client) : val;
  },
});

// ── 2. CONSTANTES Y CONFIGURACIÓN ──
const DEFAULT_AI_CONFIG = {
  systemRules: "Eres Sofía, Asesora Inmobiliaria Senior de Property OS. Tu objetivo es calificar y entusiasmar al prospecto presentándole opciones concretas y guiándolo comercialmente hacia una visita.",
  tone: "Empática, ultra-resolutiva, persuasiva, cercana y profesional. Estilo inmobiliario boliviano de alto nivel.",
  fallbacks: "Si el usuario no sabe su presupuesto, no insistas en números abstractos: dale rangos y ejemplos de inmuebles reales.",
  defaultAgentPhone: "",
};

const DEFAULT_KEYWORDS = [
  "departamento", "casa", "garsonier", "garaje", "tienda", "almacen",
  "property", "informacion", "precio", "venta", "hola", "buen dia",
  "buenas", "info", "ubicacion", "agente", "alquiler", "renta", "terreno", "lote"
];

const processedMessages = new Map<string, number>();
const DEDUP_WINDOW_MS = 60_000;

// ── 3. EMBEDDINGS Y BÚSQUEDA RAG ──
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Array.from({ length: 768 }, () => (Math.random() - 0.5) * 0.1);
  }
  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 768,
    });
    const embedding = response.data[0]?.embedding;
    return embedding && embedding.length === 768 ? embedding : Array(768).fill(0);
  } catch (err) {
    console.warn("[OpenAI] Embeddings error:", err);
    return Array.from({ length: 768 }, () => (Math.random() - 0.5) * 0.1);
  }
}

interface MatchedProperty {
  id: string;
  title: string;
  zone: string;
  city: string;
  price_usd: number;
  raw_description: string;
  property_code?: string;
  similarity: number;
  accepts_social_housing?: boolean;
}

async function searchProperties(userText: string): Promise<MatchedProperty[]> {
  try {
    const queryEmbedding = await generateEmbedding(userText);
    const { data: matches, error: rpcError } = await supabase.rpc("match_properties", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.2,
      match_count: 3,
    });
    if (rpcError || !matches || matches.length === 0) {
      // Fallback: Si no hay match semántico estricto, traer 2 propiedades destacadas activas
      const { data: fallbackProps } = await supabase
        .from("properties")
        .select("id, title, zone, city, price_usd, raw_description, property_code, accepts_social_housing")
        .limit(2);
      return (fallbackProps || []) as MatchedProperty[];
    }
    return (matches || []) as MatchedProperty[];
  } catch (err) {
    console.error("[RAG] Fallo:", err);
    return [];
  }
}

// ── 4. PARSER EVOLUTION API ──
interface ParsedIncomingMessage {
  rawPhoneNumber: string;
  senderName: string;
  userMessageText: string;
  messageId: string;
  fromMe: boolean;
  rawRemoteJid: string;
  payloadApiKey?: string;
}

function parseEvolutionPayload(body: Record<string, unknown>): ParsedIncomingMessage {
  const payloadApiKey = (body.apikey as string) || (body.data && (body.data as Record<string, unknown>).apikey as string) || undefined;
  const msgData = (body.data as Record<string, unknown>) || body;
  const keyData = (msgData.key as Record<string, unknown>) || {};

  const rawRemoteJid = (keyData.remoteJid as string) || (msgData.sender as string) || (body.remoteJid as string) || "";
  const rawPhoneNumber = rawRemoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "").replace(/\D/g, "");

  const messageId = (keyData.id as string) || (body.id as string) || "";
  const fromMe = (keyData.fromMe as boolean) ?? (body.fromMe as boolean) ?? false;

  const messageContent = msgData.message as Record<string, unknown> | undefined;
  const extText = messageContent?.extendedTextMessage as Record<string, unknown> | undefined;
  const userMessageText = (messageContent?.conversation as string) || (extText?.text as string) || (body.message as string) || "";

  const senderName = (msgData.pushName as string) || (body.pushName as string) || "Cliente";

  return { rawPhoneNumber, senderName, userMessageText, messageId, fromMe, rawRemoteJid, payloadApiKey };
}

// ── 5. ENVÍO DE MENSAJES WHATSAPP ──
async function sendWhatsAppMessage(
  phone: string,
  text: string,
  instanceName: string,
  apiUrl: string,
  apiKey: string
): Promise<boolean> {
  const recipientNumber = phone.replace(/\D/g, "");
  try {
    const rawBaseUrl = apiUrl || process.env.EVOLUTION_API_URL || "https://evolution-api-production-a3a5.up.railway.app";
    const cleanBaseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
    const instance = instanceName || process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main";
    const targetUrl = `${cleanBaseUrl}/message/sendText/${instance}`;
    const activeApiKey = apiKey || process.env.EVOLUTION_API_KEY || "";

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: activeApiKey,
      },
      body: JSON.stringify({
        number: String(recipientNumber),
        text,
        delay: Math.floor(Math.random() * (1500 - 800 + 1) + 800),
        presence: "composing",
      }),
    });

    console.log(`[Evolution API] Envío a ${recipientNumber} - Status:`, response.status);
    return response.ok;
  } catch (err) {
    console.error("[Evolution API] Fallo de red:", err);
    return false;
  }
}

// ── 6. PROCESAMIENTO PRINCIPAL CON IA CONSULTIVA DE ÉLITE ──
export async function processWebhookMessage(
  body: Record<string, unknown>,
  options: { evolutionApiUrl?: string; evolutionApiKey?: string; evolutionInstance?: string }
): Promise<{ status: string; error?: string; leadId?: string; reason?: string }> {
  console.log("📥 [WEBHOOK_PAYLOAD]:", JSON.stringify(body).substring(0, 400) + "...");

  const msg = parseEvolutionPayload(body);
  if (msg.fromMe) return { status: "IGNORED", reason: "fromMe" };
  if (!msg.rawRemoteJid || msg.rawRemoteJid.includes("@g.us")) return { status: "IGNORED", reason: "Group or missing JID" };
  if (!msg.userMessageText) return { status: "IGNORED", reason: "Empty message" };

  if (msg.messageId) {
    const now = Date.now();
    if (processedMessages.has(msg.messageId) && now - processedMessages.get(msg.messageId)! < DEDUP_WINDOW_MS) {
      return { status: "DUPLICATE_IGNORED" };
    }
    processedMessages.set(msg.messageId, now);
    for (const [id, ts] of processedMessages) {
      if (now - ts > DEDUP_WINDOW_MS) processedMessages.delete(id);
    }
  }

  // Lead Lookup
  const { data: existingLead } = await supabase
    .from("leads")
    .select("id, pipeline_stage, ai_paused, full_name, budget_max_usd, assigned_agent_id")
    .eq("phone_number", msg.rawPhoneNumber)
    .single();

  if (existingLead?.ai_paused) return { status: "AI_PAUSED", leadId: existingLead.id };

  const lowerMsg = msg.userMessageText.toLowerCase();
  const hasKeyword = DEFAULT_KEYWORDS.some((kw) => lowerMsg.includes(kw));
  if (!existingLead && !hasKeyword) return { status: "IGNORED", reason: "No matching keywords" };

  // Org Config
  const { data: orgData } = await supabase.from("organizations").select("id, ai_config").limit(1).single();
  const orgId = orgData?.id || "org-1";
  const aiConfig = (orgData?.ai_config as typeof DEFAULT_AI_CONFIG) || DEFAULT_AI_CONFIG;

  // Historial Estructurado
  const conversationHistory: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  if (existingLead?.id) {
    const { data: historyMsgs } = await supabase
      .from("messages")
      .select("sender, content, created_at")
      .eq("lead_id", existingLead.id)
      .order("created_at", { ascending: false })
      .limit(8);

    if (historyMsgs && historyMsgs.length > 0) {
      historyMsgs.reverse().forEach((m) => {
        conversationHistory.push({
          role: m.sender === "USER" ? "user" : "assistant",
          content: m.content,
        });
      });
    }
  }

  // RAG Search
  const matchedProperties = await searchProperties(msg.userMessageText);
  const bestMatch = matchedProperties[0] || null;
  const secondaryMatch = matchedProperties[1] || null;

  // Catálogo Contextual
  let inventoryContext = "";
  if (bestMatch) {
    inventoryContext += `\n- INMUEBLE PRINCIPAL: "${bestMatch.title}" en ${bestMatch.zone}, ${bestMatch.city} | Precio: $${bestMatch.price_usd?.toLocaleString()} USD | Ref: ${bestMatch.property_code || "SCZ"} | Crédito VIS: ${bestMatch.accepts_social_housing ? "Sí (ASFI 5.5%)" : "Venta Bancaria"}`;
  }
  if (secondaryMatch) {
    inventoryContext += `\n- OTRA OPCIÓN DISPONIBLE: "${secondaryMatch.title}" en ${secondaryMatch.zone}, ${secondaryMatch.city} | Precio: $${secondaryMatch.price_usd?.toLocaleString()} USD`;
  }

  // System Prompt de Alta Conversión Inmobiliaria
  const systemPrompt = `Eres Sofía, Asesora Inmobiliaria Senior de Property OS.
Tu misión es asesorar al cliente de forma natural, cálida, consultiva y persuasiva, como una agente de bienes raíces de primer nivel en Bolivia.

REGLAS DE ORO OBLIGATORIAS:
1. PROHIBICIÓN TOTAL DE BUCLES Y ROBOTISMO: NUNCA uses frases de call center como "Para poder ayudarte mejor...", "Sería ideal conocer...", "Esto nos permitirá encontrar opciones que se ajusten...". Sé directa, empática y fresca.
2. MANEJO DE CLIENTES INDECISOS O SIN PRESUPUESTO CLARO:
   - Si el cliente dice que "no tiene idea", "no sabe" o que solo tiene un "aporte", ¡felicítalo y dale referencias concretas!
   - Ejemplo: "¡Excelente que cuentes con tu aporte inicial! Por ejemplo, para un departamento de $75,000 a $85,000 USD en Equipetrol o Sirari, con una inicial del 10% al 20% accedes a cuotas desde ~$480/mes con Crédito de Vivienda Social (VIS). ¿Te gustaría ver opciones en esas zonas o buscas otra ubicación?"
3. SI EL CLIENTE PREGUNTA POR ALQUILER Y VENTA A LA VEZ:
   - Responde a ambos puntos en un solo mensaje breve y ordenado.
4. PRESENTA SIEMPRE OPCIONES CONCRETAS (A o B):
   - Cita inmuebles de nuestro catálogo disponible cuando sea oportuno.
   - Termina siempre con una pregunta comercial clara y fácil de responder.
5. LONGITUD: Respuestas concisas (máximo 2 a 3 párrafos cortos), listas para leer rápidamente en WhatsApp con emojis elegantes (🏢, 🔑, 📍, ✨).

INVENTARIO DESTACADO DE PROPERTY OS:${inventoryContext || "\n- Smart Tower Equipetrol ($85,000 USD)\n- Loft Urbano Sirari ($68,000 USD)\n- Casa Familiar Urubó ($145,000 USD)"}`;

  // LLM Generation con Memoria Real de Turnos
  let aiReplyText = "";
  const openAiKey = process.env.OPENAI_API_KEY;

  if (openAiKey) {
    try {
      const openai = new OpenAI({ apiKey: openAiKey });
      
      const messagesForLlm = [
        { role: "system" as const, content: systemPrompt },
        ...conversationHistory.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: msg.userMessageText },
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messagesForLlm,
        temperature: 0.75,
        max_tokens: 300,
      });

      aiReplyText = response.choices[0]?.message?.content || "";
    } catch (err) {
      console.error("[Webhook] OpenAI Error:", err);
    }
  }

  // Fallback inteligente en caso de error de OpenAI
  if (!aiReplyText) {
    if (bestMatch) {
      aiReplyText = `¡Hola ${msg.senderName}! Claro que sí, tenemos opciones espectaculares en ${bestMatch.zone} como "${bestMatch.title}" por $${bestMatch.price_usd?.toLocaleString()} USD. Con tu aporte propio podemos simular financiamiento bancario o Crédito VIS. ¿Qué zona de la ciudad prefieres? 🏢`;
    } else {
      aiReplyText = `¡Hola ${msg.senderName}! Un gusto saludarte. Contamos con departamentos y casas en las mejores zonas (Equipetrol, Sirari, Urubó). Con tu aporte inicial podemos armar un plan a tu medida. ¿Buscas algo para entrega inmediata o en preventa? ✨`;
    }
  }

  // Upsert Lead
  const { data: upsertedLead } = await supabase
    .from("leads")
    .upsert({
      id: existingLead?.id || undefined,
      organization_id: orgId,
      phone_number: msg.rawPhoneNumber,
      full_name: existingLead?.full_name || msg.senderName,
      pipeline_stage: existingLead?.pipeline_stage || "EN_CALIFICACION",
      property_interest_id: bestMatch?.id || undefined,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const finalLeadId = upsertedLead?.id || existingLead?.id;

  // Guardar mensajes en Supabase
  if (finalLeadId) {
    await supabase.from("messages").insert([
      { lead_id: finalLeadId, sender: "USER", content: msg.userMessageText },
      { lead_id: finalLeadId, sender: "AI", content: aiReplyText },
    ]);
  }

  // Enviar WhatsApp
  const evoUrl = options.evolutionApiUrl || process.env.EVOLUTION_API_URL || "";
  const evoKey = options.evolutionApiKey || process.env.EVOLUTION_API_KEY || "";
  const evoInst = options.evolutionInstance || process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main";

  if (evoUrl && evoInst) {
    await sendWhatsAppMessage(msg.rawPhoneNumber, aiReplyText, evoInst, evoUrl, msg.payloadApiKey || evoKey);
  }

  return { status: "SUCCESS", leadId: finalLeadId };
}

// ── 7. HANDLER SERVERLESS VERCEL ──
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ status: "WEBHOOK_ACTIVE", system: "Property OS" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await processWebhookMessage(req.body || {}, {
      evolutionApiUrl: process.env.EVOLUTION_API_URL,
      evolutionApiKey: process.env.EVOLUTION_API_KEY,
      evolutionInstance: process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main",
    });
    return res.status(200).json({ status: "OK", result });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    console.error("ERROR_PROCESSING_WEBHOOK:", errorMsg);
    return res.status(500).json({ error: errorMsg });
  }
}
