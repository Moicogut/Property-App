import "dotenv/config";
import OpenAI from "openai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ── Supabase singleton resiliente con Lazy Init Proxy ──
const FALLBACK_SUPABASE_URL = "https://lqagnlbygzurddkzbbwn.supabase.co";

let _supabaseServer: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (!_supabaseServer) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || FALLBACK_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
    if (!supabaseKey) {
      console.warn("[Shared] Advertencia: SUPABASE_SERVICE_ROLE_KEY o VITE_SUPABASE_ANON_KEY no están definidos en variables de entorno.");
    }
    _supabaseServer = createClient(supabaseUrl, supabaseKey || "dummy-key-for-init");
  }
  return _supabaseServer;
}

export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseServer();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? (val as (...args: unknown[]) => unknown).bind(client) : val;
  },
});

// ── OpenAI Embeddings (text-embedding-3-small 768d) ──
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[OpenAI] OPENAI_API_KEY no definida, usando fallback de embedding.");
    return Array.from({ length: 768 }, () => (Math.random() - 0.5) * 0.1);
  }

  const openai = new OpenAI({ apiKey });
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
