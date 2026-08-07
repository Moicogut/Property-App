import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// ── Supabase singleton ──
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
export const supabaseServer = createClient(supabaseUrl, supabaseKey);

// ── OpenAI Embeddings (text-embedding-3-small 768d) ──
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 768,
    });
    const embedding = response.data[0]?.embedding;
    return embedding && embedding.length === 768 ? embedding : Array(768).fill(0);
  } catch (err) {
    console.warn("[OpenAI] Embeddings API Error (fallback to dummy):", err);
    return Array.from({ length: 768 }, () => (Math.random() - 0.5) * 0.1);
  }
}

// ── Tipos compartidos ──
export interface AiConfig {
  systemRules: string;
  tone: string;
  fallbacks: string;
  defaultAgentPhone?: string;
}

export interface WebhookProcessOptions {
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  evolutionInstance?: string;
}

export interface ParsedIncomingMessage {
  rawPhoneNumber: string;
  senderName: string;
  userMessageText: string;
  messageId: string;
  fromMe: boolean;
  rawRemoteJid: string;
  payloadApiKey?: string;
}

export interface BantScore {
  budget: number;
  authority: boolean;
  need: string;
  timeline: string;
  preferred_zone: string;
  score: number;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  systemRules: "Eres Sofía, Asesora Inmobiliaria de Property OS. Califica al prospecto (Cuota inicial, presupuesto).",
  tone: "Cálida, profesional y ejecutiva. Máximo 2 oraciones.",
  fallbacks: "Si pregunta por temas no inmobiliarios, deniega amablemente.",
};

export const DEFAULT_KEYWORDS = [
  "departamento", "casa", "garsonier", "garaje", "tienda", "almacen",
  "property", "informacion", "precio", "venta", "hola", "buen dia",
  "buenas", "info", "ubicacion", "agente",
];
