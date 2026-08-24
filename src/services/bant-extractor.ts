/**
 * Servicio de extracción BANT (Budget, Authority, Need, Timeline) usando LLM.
 * Responsabilidad única: analizar el historial de chat y extraer métricas de calificación.
 */
import OpenAI from "openai";
import type { BantScore } from "./shared";

const BANT_PROMPT = `Eres un sistema experto en Scoring Inmobiliario BANT (Budget, Authority, Need, Timeline) para Property OS en Bolivia. 
Analiza objetivamente el historial y el último mensaje del lead.
Responde ÚNICAMENTE en JSON con la siguiente estructura estricta:
{
  "budget": 0,
  "authority": false,
  "need": "",
  "timeline": "",
  "preferred_zone": "",
  "payment_method": "POR_DEFINIR",
  "bank_declared": "",
  "score": 0
}

Reglas estrictas de veracidad del dato:
- budget: número (USD). Extrae ÚNICAMENTE el monto explícitamente declarado por el cliente. Si no declaró monto numérico, devuelve 0.
- authority: booleano. true si es el tomador de decisión, false si dice consultar con otros.
- need: string corto de máximo 6 palabras resumiendo el requerimiento real.
- timeline: string corto (ej. "Inmediata", "1 a 3 meses", "Por definir").
- preferred_zone: string. La zona/barrio/ciudad mencionada por el cliente. "" si no se mencionó. NUNCA inventes una zona.
- payment_method: "CREDITO_VIS" | "CREDITO_BANCARIO" | "CONTADO" | "POR_DEFINIR".
- bank_declared: string con el nombre del banco si y solo si el cliente lo mencionó (ej. "Banco BCP", "BNB"). "" si no mencionó ningún banco. PROHIBIDO inferir bancos por defecto.
- score: número de 0 a 100 calculado objetivamente según datos verificados.`;

/**
 * Extrae el BANT Score del historial de conversación usando gpt-4o-mini en JSON mode.
 * @returns BantScore si la extracción fue exitosa, null si falló.
 */
export async function extractBantScore(
  chatHistoryText: string,
  userMessageText: string
): Promise<BantScore | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const bantResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: BANT_PROMPT },
        { role: "user", content: `HISTORIAL:\n${chatHistoryText}\nULTIMO MENSAJE: "${userMessageText}"` },
      ],
      temperature: 0.1,
    });

    const parsed = JSON.parse(bantResponse.choices[0].message.content || "{}");

    if (typeof parsed.budget === "number" && typeof parsed.score === "number") {
      return parsed as BantScore;
    }

    return null;
  } catch (err) {
    console.error("[BANT] Error extrayendo BANT:", err);
    return null;
  }
}
