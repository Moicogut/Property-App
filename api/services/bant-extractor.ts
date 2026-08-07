/**
 * Servicio de extracción BANT (Budget, Authority, Need, Timeline) usando LLM.
 * Responsabilidad única: analizar el historial de chat y extraer métricas de calificación.
 */
import OpenAI from "openai";
import type { BantScore } from "./shared";

const BANT_PROMPT = `Eres un sistema experto en Scoring Inmobiliario BANT (Budget, Authority, Need, Timeline). 
Extrae o deduce estos atributos basados en el historial y el último mensaje del lead.
Responde ÚNICAMENTE en JSON con la siguiente estructura estricta:
{
  "budget": 0,
  "authority": false,
  "need": "",
  "timeline": "",
  "preferred_zone": "",
  "score": 0
}

Reglas:
- budget: número (USD). Extrae el presupuesto máximo declarado por el cliente. 0 si es desconocido.
- authority: booleano. ¿Es el tomador de decisión? (asume true a menos que diga que debe consultar a un familiar/pareja).
- need: string corto de 5 palabras máximo resumiendo lo que busca.
- timeline: string corto (ej. "En 3 meses", "Inmediato"). "" si es desconocido.
- preferred_zone: string. La zona o barrio que el cliente mencionó explícitamente (ej. "Sopocachi", "Equipetrol Norte"). "" si no se mencionó.
- score: número de 0 a 100 (100 = listo para comprar, 50 = tibio, 0 = no calificado).`;

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
