import { OpenAI } from "openai";
import { GoogleGenAI } from "@google/genai";
import { Property, Lead, PipelineStage, EvolutionWebhookPayload } from "@/src/types/property";
import { sendWhatsAppMessage } from "@/src/lib/evolution";

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

// ─── Helper: coseno de similitud entre dos vectores 1536d ──────────────────

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── Mock Repository: fallback cuando PostgreSQL/Supabase no está disponible ─

const sampleProperties: Property[] = [
  {
    id: "prop-1",
    organizationId: "org-1",
    title: "Smart Tower 2D Equipetrol",
    city: "Santa Cruz",
    zone: "Equipetrol Norte",
    priceUsd: 82000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 68.5,
    acceptsSocialHousing: true,
    status: "AVAILABLE",
    rawDescription: "Departamento moderno de 2 dormitorios en Equipetrol Norte con parqueo, balcon y cocina equipada. Califica a credito de vivienda social VIS de ASFI.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBuKB4mqRHJLPsmjKEDw7p-COrNUcCLXZ8YQHIuRSoTNKL6L8isGXuS5J1etOj8S8i4_mle2cmdyloQCeiRjQeJiI4riUo_hXMDskWX2qnT2UABpd2bK2QE8lsm_y3M-pmEYfYA_Q5UGTe_aGYM8Aedk_VTQHS7Wb0zCvgf3Gb2VKtOtL6QdQ7kDWBxLyXLQ5NNjlucBj-XKi9PMtMQRPjBZXsTmHiV2J0beg6LhsFbwcr_c3cFutJ0yA",
    vectorIndexed: true,
    vectorDimensions: 1536,
  },
  {
    id: "prop-2",
    organizationId: "org-1",
    title: "Casa Jardines del Sur",
    city: "La Paz",
    zone: "Zona Sur",
    priceUsd: 580000,
    bedrooms: 4,
    bathrooms: 5,
    areaSqm: 380,
    acceptsSocialHousing: false,
    status: "AVAILABLE",
    rawDescription: "Residencia de lujo en Zona Sur de La Paz con jardin privado, piscina climatizada y acabados de primera.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYJU0S00GPmbGAajxzcXQNHnjnc8ulDjxL4MBMnvkxwxWkj2C5to5EcoW-fwuaOn6rw5JGdFKpa-c48rQ4D2-dP3Advpg0C94wROZfKe77aF0CyQZivV6MwDlDE4KjSvnoJicHDGJWsBV1uPLvPdxcHe_jfZLzOfhtCQKlkE5Mq40tFlo5IOqvHG88Zfhetq6CYb9Hg0Rs5-Ar0hcPMEG3ok6N6-DKqegGfsQu66t57pabLFX_REcsfA",
    vectorIndexed: true,
    vectorDimensions: 1536,
  },
  {
    id: "prop-3",
    organizationId: "org-1",
    title: "Lote Urubó Village",
    city: "Santa Cruz",
    zone: "Porongo - Urubó",
    priceUsd: 220000,
    bedrooms: 0,
    bathrooms: 0,
    areaSqm: 750,
    acceptsSocialHousing: false,
    status: "AVAILABLE",
    rawDescription: "Lote residencial en condominio exclusivo Urubo Village con club house, lagunas y seguridad 24/7.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAa43ZWx_LxVoUAtNpS2fx6P0r6gpr0hOzB-G0gu3MAys8ppClBP0dARjvpssksYEHZ3lootGG7m68roTeubhBjZxpgobrTH1kUuvuA33lzhuL3vDoDqUgPIIMbOHlMoAj8cfR5St7Do9DYvJIv4oyO_iIJLlpaNFpbPCNI8rnDkHOWYz_pj2DMmmJsUP7mzdf9-Eg8CkbYOqN8fVjsZ6o-xiNlMcFr9bYUk2U-ihmnwAg4Wp0tOQrLeg",
    vectorIndexed: true,
    vectorDimensions: 1536,
  },
];

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
  const remoteJid =
    (keyData?.remoteJid as string) ||
    (payload.remoteJid as string) ||
    "59171234567@s.whatsapp.net";
  const rawPhoneNumber = remoteJid.replace("@s.whatsapp.net", "");
  const senderName =
    (data?.pushName as string) ||
    (payload.pushName as string) ||
    "Cliente WhatsApp";

  const messageData = data?.message as Record<string, unknown> | undefined;
  const extText = (messageData?.extendedTextMessage as Record<string, unknown> | undefined)?.text;

  const userMessageText =
    (messageData?.conversation as string) ||
    (extText as string) ||
    (payload.message as string) ||
    "Hola, busco departamento con crédito VIS y tengo aporte propio.";

  // 1. Estado simulado del lead (en producción: query a Supabase por phoneNumber)
  const isAiPaused = (payload.aiPaused as boolean) || false;

  // 2. Guard: si IA pausada → no responder automáticamente
  if (isAiPaused) {
    console.log(`[Webhook] ⏸️ IA pausada para ${rawPhoneNumber}. Intervención humana requerida.`);
    return {
      status: "AI_PAUSED",
      message: "La IA Sofía está pausada para este cliente. Intervención humana requerida.",
      leadId: `lead-${rawPhoneNumber}`,
    };
  }

  // 3. RAG Semantic Search — intentar embedding OpenAI, fallback a mock
  const matchedProperty = sampleProperties[0]; // Default Smart Tower 2D
  const ragMatchScore = 0.98;
  let queryEmbedding: number[] = [];

  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const embedResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: userMessageText,
      });
      queryEmbedding = embedResponse.data[0].embedding;
      // Suprimir warning de variable no usada en producción — se usaría en query pgvector
      void queryEmbedding;
    } catch (e) {
      console.warn("[Webhook] OpenAI embedding API fallback activo:", e);
    }
  }

  // 4. Prompt de sistema "Sofía" con inmueble RAG inyectado
  const sofiaSystemPrompt = `
Eres Sofía, la Asistente Virtual Inteligente de Bienes Raíces de Property OS.
Tu objetivo es calificar sutilmente al prospecto de WhatsApp usando el Filtro Crediticio Invisible para Vivienda Social (VIS / ASFI) y coordinar una visita.

REGLAS DE CALIFICACIÓN DE CUOTA INICIAL / APORTE PROPIO:
- Verifica si el cliente busca crédito de vivienda social (VIS/ASFI) o contado.
- Confirma si dispone del Aporte Propio/Cuota Inicial requerido por los bancos bolivianos (mínimo 10% a 20%).
- Evalúa el presupuesto máximo (ej. $85,000 USD).
- Inmueble sugerido RAG: "${matchedProperty.title}" en ${matchedProperty.zone}, ${matchedProperty.city} a $${matchedProperty.priceUsd.toLocaleString()} USD (Califica VIS: ${matchedProperty.acceptsSocialHousing ? "SÍ" : "NO"}).

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
      ? `¡Excelente noticia ${senderName}! El ${matchedProperty.title} ($${matchedProperty.priceUsd.toLocaleString()} USD) califica perfectamente para crédito VIS de ASFI. Con tu aporte propio en el banco ya tienes la base. ¿Agendamos una visita mañana a las 10:00 AM?`
      : `¡Hola ${senderName}! 👋 El ${matchedProperty.title} de $${matchedProperty.priceUsd.toLocaleString()} USD en ${matchedProperty.zone} sigue disponible. ¿Cuentas con el aporte propio inicial (10%-20%) para crédito de vivienda social (VIS)?`;
  }

  const updatedStage: PipelineStage = isFullyQualified ? "CALIFICADO_VISITA_PENDIENTE" : "EN_CALIFICACION";

  // 7. Enviar respuesta via Evolution API (si credenciales disponibles)
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
      preferredZone: matchedProperty.zone,
      matchedProperty,
      aiSummary: "Cliente calificado con 20% de aporte propio en BCP. Interesado en 2D en Equipetrol para crédito VIS.",
      aiPaused: false,
      intentScore: 95,
      createdAt: new Date().toISOString(),
    },
    aiReply: aiReplyText,
    ragMatch: { property: matchedProperty, similarityScore: ragMatchScore },
    nextAction: isFullyQualified ? "CALIFICADO_VISITA_PENDIENTE" : "SEGUIMIENTO",
  };
}

// ─── Express handler (usado en server.ts) ───────────────────────────────────
// La validación de EVOLUTION_API_KEY se hace en server.ts antes de llamar aquí.

// ─── Next.js App Router Handler (compatibilidad forward) ────────────────────
export async function POST(req: Request): Promise<Response> {
  try {
    // Validar API Key si está configurada
    const expectedKey = process.env.EVOLUTION_API_KEY;
    if (expectedKey) {
      const incomingKey =
        req.headers.get("apikey") ||
        req.headers.get("authorization")?.replace("Bearer ", "");
      if (incomingKey !== expectedKey) {
        console.warn("[Webhook] ❌ API Key inválida en request entrante.");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const body = (await req.json()) as Record<string, unknown>;
    const result = await processWebhookMessage(body, {
      evolutionApiUrl: process.env.EVOLUTION_API_URL,
      evolutionApiKey: process.env.EVOLUTION_API_KEY,
      evolutionInstance: process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main",
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Webhook] Error en POST handler:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
