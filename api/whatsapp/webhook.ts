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

// ── 3. EMBEDDINGS, ENTITY EXTRACTION Y BÚSQUEDA RAG GEOGRÁFICA ──
interface GeoIntent {
  city?: string;
  zone?: string;
  isRent: boolean;
  isSale: boolean;
  isMixed: boolean;
  isOwner: boolean;
  paymentMethodHint?: "CREDITO_VIS" | "CREDITO_BANCARIO" | "CONTADO";
}

function extractGeoAndIntent(text: string): GeoIntent {
  const lower = text.toLowerCase();

  let city: string | undefined = undefined;
  if (lower.includes("la paz")) city = "La Paz";
  else if (lower.includes("santa cruz") || lower.includes("scz")) city = "Santa Cruz";
  else if (lower.includes("cochabamba") || lower.includes("cocha")) city = "Cochabamba";
  else if (lower.includes("tarija")) city = "Tarija";

  let zone: string | undefined = undefined;
  // La Paz
  if (lower.includes("calacoto")) { zone = "Calacoto"; city = city || "La Paz"; }
  else if (lower.includes("sopocachi")) { zone = "Sopocachi"; city = city || "La Paz"; }
  else if (lower.includes("achumani")) { zone = "Achumani"; city = city || "La Paz"; }
  else if (lower.includes("san miguel")) { zone = "San Miguel"; city = city || "La Paz"; }
  else if (lower.includes("miraflores")) { zone = "Miraflores"; city = city || "La Paz"; }
  else if (lower.includes("obrajes")) { zone = "Obrajes"; city = city || "La Paz"; }
  else if (lower.includes("cota cota")) { zone = "Cota Cota"; city = city || "La Paz"; }
  else if (lower.includes("irpavi")) { zone = "Irpavi"; city = city || "La Paz"; }
  
  // Santa Cruz
  else if (lower.includes("equipetrol")) { zone = "Equipetrol"; city = city || "Santa Cruz"; }
  else if (lower.includes("sirari")) { zone = "Sirari"; city = city || "Santa Cruz"; }
  else if (lower.includes("urubo") || lower.includes("urubó")) { zone = "Urubó"; city = city || "Santa Cruz"; }
  else if (lower.includes("las palmas")) { zone = "Las Palmas"; city = city || "Santa Cruz"; }
  else if (lower.includes("zona norte") || lower.includes("banzer")) { zone = "Zona Norte"; city = city || "Santa Cruz"; }

  // Modalidades
  const isRent = lower.includes("alquiler") || lower.includes("alquilar") || lower.includes("renta") || lower.includes("alquilo") || lower.includes("arriendo") || lower.includes("anticretico");
  const isSale = lower.includes("compra") || lower.includes("comprar") || lower.includes("venta") || lower.includes("compro") || lower.includes("financiamiento") || lower.includes("vis") || lower.includes("credito") || lower.includes("banco");
  const isMixed = isRent && isSale;
  const isOwner = lower.includes("propietario") || lower.includes("vender mi") || lower.includes("consignar") || lower.includes("poner en venta");

  // Tipo de pago
  let paymentMethodHint: "CREDITO_VIS" | "CREDITO_BANCARIO" | "CONTADO" | undefined = undefined;
  if (lower.includes("vis") || lower.includes("vivienda social") || lower.includes("asfi") || lower.includes("5.5")) {
    paymentMethodHint = "CREDITO_VIS";
  } else if (lower.includes("credito") || lower.includes("banco") || lower.includes("bancario") || lower.includes("financiar")) {
    paymentMethodHint = "CREDITO_BANCARIO";
  } else if (lower.includes("contado") || lower.includes("efectivo") || lower.includes("cash")) {
    paymentMethodHint = "CONTADO";
  }

  return { city, zone, isRent, isSale, isMixed, isOwner, paymentMethodHint };
}

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

async function searchProperties(
  userText: string,
  geo?: GeoIntent
): Promise<{ matches: MatchedProperty[]; geoNotice?: string }> {
  try {
    const queryEmbedding = await generateEmbedding(userText);
    const { data: vectorMatches } = await supabase.rpc("match_properties", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.15,
      match_count: 5,
    });

    let rawList: MatchedProperty[] = (vectorMatches || []) as MatchedProperty[];

    // Si no hay vector matches o son insuficientes, consultar DB directa con filtros
    if (rawList.length === 0) {
      let query = supabase
        .from("properties")
        .select("id, title, zone, city, price_usd, raw_description, property_code, accepts_social_housing");
      
      if (geo?.city) {
        query = query.ilike("city", `%${geo.city}%`);
      }
      if (geo?.zone) {
        query = query.ilike("zone", `%${geo.zone}%`);
      }
      const { data: fallbackProps } = await query.limit(3);
      rawList = (fallbackProps || []) as MatchedProperty[];
    }

    // Filtrado y Priorización Geográfica Estricta
    let prioritizedMatches: MatchedProperty[] = [];
    let geoNotice: string | undefined = undefined;

    if (geo?.zone) {
      const zoneExact = rawList.filter(p => p.zone?.toLowerCase().includes(geo.zone!.toLowerCase()));
      if (zoneExact.length > 0) {
        prioritizedMatches = zoneExact;
      } else {
        // Buscar directamente en base de datos propiedades de esa zona
        const { data: directZoneProps } = await supabase
          .from("properties")
          .select("id, title, zone, city, price_usd, raw_description, property_code, accepts_social_housing")
          .ilike("zone", `%${geo.zone}%`)
          .limit(3);

        if (directZoneProps && directZoneProps.length > 0) {
          prioritizedMatches = directZoneProps as MatchedProperty[];
        } else if (geo?.city) {
          // Si no hay en esa zona exacta, traer de la misma ciudad pero dar nota explicativa a Sofía
          const sameCity = rawList.filter(p => p.city?.toLowerCase().includes(geo.city!.toLowerCase()));
          if (sameCity.length > 0) {
            prioritizedMatches = sameCity;
            geoNotice = `El cliente solicitó específicamente zona "${geo.zone}" en ${geo.city}. En este instante no disponemos de un inmueble en esa zona exacta, pero contamos con opciones destacadas en la misma ciudad (${sameCity.map(p => p.zone).join(", ")}). Acláraselo amablemente con honestidad antes de presentarle la alternativa.`;
          }
        }
      }
    } else if (geo?.city) {
      const cityExact = rawList.filter(p => p.city?.toLowerCase().includes(geo.city!.toLowerCase()));
      if (cityExact.length > 0) {
        prioritizedMatches = cityExact;
      }
    }

    if (prioritizedMatches.length === 0) {
      prioritizedMatches = rawList.slice(0, 3);
    }

    // Fallback absoluto si la DB está vacía
    if (prioritizedMatches.length === 0) {
      const { data: fallbackAll } = await supabase
        .from("properties")
        .select("id, title, zone, city, price_usd, raw_description, property_code, accepts_social_housing")
        .limit(2);
      prioritizedMatches = (fallbackAll || []) as MatchedProperty[];
    }

    return {
      matches: prioritizedMatches,
      geoNotice,
    };
  } catch (err) {
    console.error("[RAG] Fallo:", err);
    return { matches: [] };
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
    .select("id, pipeline_stage, pipeline_type, lead_type, ai_paused, full_name, budget_max_usd, preferred_zone, payment_method, has_down_payment, down_payment_percent, bant_score, assigned_agent_id")
    .eq("phone_number", msg.rawPhoneNumber)
    .single();

  if (existingLead?.ai_paused) return { status: "AI_PAUSED", leadId: existingLead.id };

  const lowerMsg = msg.userMessageText.toLowerCase();
  const hasKeyword = DEFAULT_KEYWORDS.some((kw) => lowerMsg.includes(kw));
  if (!existingLead && !hasKeyword) return { status: "IGNORED", reason: "No matching keywords" };

  // Org Config
  const { data: orgData } = await supabase.from("organizations").select("id, ai_config").limit(1).single();
  const orgId = orgData?.id || "org-1";

  // Extracción de intenciones y geografía
  const geoIntent = extractGeoAndIntent(msg.userMessageText);

  // Historial Estructurado
  const conversationHistory: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  if (existingLead?.id) {
    const { data: historyMsgs } = await supabase
      .from("messages")
      .select("sender, text, content, created_at")
      .eq("lead_id", existingLead.id)
      .order("created_at", { ascending: false })
      .limit(8);

    if (historyMsgs && historyMsgs.length > 0) {
      historyMsgs.reverse().forEach((m) => {
        conversationHistory.push({
          role: m.sender === "lead" || m.sender === "USER" ? "user" : "assistant",
          content: m.text || m.content || "",
        });
      });
    }
  }

  // RAG Search Geográfico y Semántico
  const { matches: matchedProperties, geoNotice } = await searchProperties(msg.userMessageText, geoIntent);
  const bestMatch = matchedProperties[0] || null;
  const secondaryMatch = matchedProperties[1] || null;

  // Catálogo Contextual
  let inventoryContext = "";
  if (bestMatch) {
    inventoryContext += `\n- INMUEBLE PRINCIPAL: "${bestMatch.title}" en ${bestMatch.zone}, ${bestMatch.city} | Precio: $${bestMatch.price_usd?.toLocaleString()} USD | Ref: ${bestMatch.property_code || "SCZ"} | Crédito VIS: ${bestMatch.accepts_social_housing ? "Sí (ASFI 5.5% interés regulado)" : "Venta Bancaria Tradicional / Contado"}`;
  }
  if (secondaryMatch) {
    inventoryContext += `\n- OTRA OPCIÓN DISPONIBLE: "${secondaryMatch.title}" en ${secondaryMatch.zone}, ${secondaryMatch.city} | Precio: $${secondaryMatch.price_usd?.toLocaleString()} USD`;
  }

  // System Prompt de Alta Conversión Inmobiliaria Calibrado
  const systemPrompt = `Eres Sofía, Asesora Inmobiliaria Senior de Property OS.
Tu misión es asesorar al cliente de forma natural, empática, consultiva y con alta persuasión comercial, como una agente de bienes raíces de primer nivel en Bolivia.

REGLAS DE ORO OBLIGATORIAS:
1. PROHIBICIÓN TOTAL DE BUCLES Y ROBOTISMO:
   - NUNCA uses frases acartonadas ("Para poder ayudarte mejor...", "Sería ideal conocer...", "Esto nos permitirá encontrar opciones...").
   - Habla con frescura, profesionalismo y cercanía.

2. MANEJO DE CLIENTES CON CONSULTAS MIXTAS (VENTA Y ALQUILER EN LA MISMA FRASE):
   ${geoIntent.isMixed ? `⚠️ ATENCIÓN: El cliente preguntó por COMPRA y ALQUILER a la vez. Responde a ambos puntos de forma limpia y ordenada:
     - 🏢 Opción en Venta: Presenta 1 opción con precio en USD y cuota referencial (ej. VIS o bancaria).
     - 🔑 Opción en Alquiler: Menciona el canon mensual referencial en la zona deseada.
     - Cierra preguntándole cuál de las dos alternativas se adapta mejor a su plan actual.` : `Si el usuario pregunta por compra y alquiler, presenta 1 opción de cada modalidad de manera ordenada.`}

3. PRECISIÓN Y HONESTIDAD GEOGRÁFICA:
   - Respeta estrictamente la ciudad y zona consultada por el cliente.
   ${geoNotice ? `\n   - NOTA GEOGRÁFICA IMPORTANTE: ${geoNotice}\n` : ""}

4. PROACTIVIDAD COMERCIAL HACIA VISITAS PRESENCIALES:
   - En cuanto el cliente muestre interés (presupuesto, zonas, fotos, cuotas o consultas concretas), sé proactiva e invítalo a coordinar una visita presencial:
     "¿Te gustaría que coordinemos una visita presencial para conocer el departamento en persona? 📅"
   - Si el cliente acepta o consulta disponibilidad, propón turnos claros (ej. "mañana por la mañana a las 10:00 o por la tarde a las 16:00").

5. CLIENTES SIN PRESUPUESTO CLARO O CON APORTE INICIAL:
   - Si el cliente dice que "no sabe su presupuesto" o solo menciona su aporte inicial, ¡felicítalo y dale rangos reales!
   - Ejemplo: "¡Excelente que cuentes con tu aporte inicial! Para un departamento de $75,000 a $85,000 USD en Equipetrol o Sirari, con una inicial del 10% al 20% accedes a cuotas desde ~$480/mes con Crédito de Vivienda Social (VIS)."

6. FORMATO Y EXTENSIÓN:
   - Máximo 2 a 3 párrafos concisos y listos para leer rápido en WhatsApp.
   - Usa emojis elegantes con criterio (🏢, 🔑, 📍, 📅, ✨).
   - Termina siempre con una sola pregunta comercial clara.

7. PRIVACIDAD ESTRICTA Y CONFIDENCIALIDAD INMOBILIARIA:
   - NUNCA reveles teléfonos, correos ni identidades privadas de los propietarios vendedores.
   - NUNCA discutas comisiones inmobiliarias internas ni datos confidenciales del expediente notarial.
   - Todas las visitas, reservas y negociaciones se gestionan exclusivamente a través del equipo autorizado de Property OS.

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
        temperature: 0.72,
        max_tokens: 350,
      });

      aiReplyText = response.choices[0]?.message?.content || "";
    } catch (err) {
      console.error("[Webhook] OpenAI Error:", err);
    }
  }

  // Fallback inteligente en caso de error de OpenAI
  if (!aiReplyText) {
    if (bestMatch) {
      aiReplyText = `¡Hola ${msg.senderName}! Claro que sí, tenemos opciones ideales en ${bestMatch.zone} como "${bestMatch.title}" por $${bestMatch.price_usd?.toLocaleString()} USD (${bestMatch.accepts_social_housing ? "Apto para Crédito VIS ASFI" : "Venta Bancaria"}). Con tu aporte inicial podemos armar un plan de financiamiento. ¿Te gustaría que agendemos una visita para conocerlo? 🏢📅`;
    } else {
      aiReplyText = `¡Hola ${msg.senderName}! Un gusto saludarte. Contamos con propiedades destacadas en las mejores zonas. Con tu aporte inicial podemos simular un plan a tu medida. ¿Buscas entrega inmediata o en preventa? ✨`;
    }
  }

  const aiSummary = `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]: ${msg.userMessageText.substring(0, 90)}...`;

  // Detección de presupuesto
  let budget = existingLead?.budget_max_usd || null;
  const budgetMatch = msg.userMessageText.match(/\$?\s*(\d{2,6})\s*(usd|dolares|k)?/i);
  if (budgetMatch) {
    let parsed = parseInt(budgetMatch[1]);
    if (parsed < 1000) parsed *= 1000;
    budget = parsed;
  } else if (bestMatch?.price_usd && !budget) {
    budget = bestMatch.price_usd;
  }

  // Detección de zona preferida
  let zone = geoIntent.zone || existingLead?.preferred_zone || null;
  if (!zone && bestMatch?.zone) {
    zone = bestMatch.zone;
  }

  // Detección de método de pago
  const paymentMethod = geoIntent.paymentMethodHint || existingLead?.payment_method || "POR_DEFINIR";

  // Detección de aporte propio
  const hasDownPayment = lowerMsg.includes("inicial") || lowerMsg.includes("aporte") || existingLead?.has_down_payment || false;

  // Detección de etapa y tipo de lead
  const isAskingVisit = lowerMsg.includes("visita") || lowerMsg.includes("agendar") || lowerMsg.includes("cuando se puede") || lowerMsg.includes("verlo") || lowerMsg.includes("mañana") || lowerMsg.includes("hora");
  
  let stage = existingLead?.pipeline_stage || "EN_CALIFICACION";
  if (isAskingVisit) {
    stage = "VISITA_AGENDADA";
  } else if (budget && zone) {
    stage = "CALIFICADO_VISITA_PENDIENTE";
  }

  // Tipología de Pipeline y Lead
  let pipelineType = existingLead?.pipeline_type || "VENTAS";
  let leadType = existingLead?.lead_type || "BUYER";

  if (geoIntent.isOwner) {
    pipelineType = "CAPTACIONES";
    leadType = "SELLER_OWNER";
  } else if (geoIntent.isRent && !geoIntent.isSale) {
    pipelineType = "ALQUILERES";
    leadType = "TENANT";
  } else if (geoIntent.isSale) {
    pipelineType = "VENTAS";
    leadType = "BUYER";
  }

  // Cálculo de Intent Score BANT Dinámico (60 - 98)
  let intentScore = 65;
  if (zone) intentScore += 10;
  if (budget) intentScore += 10;
  if (hasDownPayment || paymentMethod !== "POR_DEFINIR") intentScore += 8;
  if (isAskingVisit) intentScore += 12;
  intentScore = Math.min(intentScore, 98);

  // Upsert Lead con todos los campos calculados en tiempo real
  const { data: upsertedLead } = await supabase
    .from("leads")
    .upsert({
      id: existingLead?.id || undefined,
      organization_id: orgId,
      phone_number: msg.rawPhoneNumber,
      full_name: existingLead?.full_name || msg.senderName,
      pipeline_stage: stage,
      pipeline_type: pipelineType,
      lead_type: leadType,
      budget_max_usd: budget,
      preferred_zone: zone,
      payment_method: paymentMethod,
      has_down_payment: hasDownPayment,
      down_payment_percent: existingLead?.down_payment_percent || 20,
      property_interest_id: bestMatch?.id || undefined,
      ai_summary: aiSummary,
      intent_score: intentScore,
      bant_score: {
        budget: budget || 0,
        preferred_zone: zone || "Por definir",
        authority: true,
        need: msg.userMessageText.substring(0, 60),
        timeline: isAskingVisit ? "Inmediata" : "1 a 3 meses",
        score: intentScore,
      },
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const finalLeadId = upsertedLead?.id || existingLead?.id;

  // Guardar mensajes en Supabase
  if (finalLeadId) {
    await supabase.from("messages").insert([
      { lead_id: finalLeadId, sender: "lead", text: msg.userMessageText },
      { lead_id: finalLeadId, sender: "ai_sofia", text: aiReplyText },
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
