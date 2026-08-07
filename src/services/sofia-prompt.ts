/**
 * Servicio de construcción del System Prompt para Sofía IA.
 * Responsabilidad única: armar el prompt XML estructurado con RAG, historial y reglas.
 */
import type { AiConfig } from "./shared";
import type { MatchedProperty } from "./rag-search";

/**
 * Construye el System Prompt completo para la llamada al LLM.
 */
export function buildSofiaPrompt(
  aiConfig: AiConfig,
  bestMatch: MatchedProperty | null,
  chatHistoryText: string
): string {
  return `
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
    ? `- Código de Referencia: ${bestMatch.property_code || bestMatch.id.substring(0, 6)}\n- Título: ${bestMatch.title}\n- Zona: ${bestMatch.zone}\n- Precio: $${bestMatch.price_usd} USD\n- Auditoría Legal: ${bestMatch.global_legal_score === 'VERDE' ? 'Apto para Crédito Bancario' : (bestMatch.global_legal_score === 'ROJO' || bestMatch.global_legal_score === 'AMARILLO' ? 'Solo Pago al Contado (Tiene trámites pendientes)' : 'Estado Legal Pendiente')}\n- Descripción: ${bestMatch.raw_description}`
    : "- No se encontraron inmuebles exactos. Ofrece ayuda genérica o pregunta detalles."}

${chatHistoryText}
`;
}

/**
 * Construye las herramientas (tools) disponibles para el LLM condicionadas al estado del lead.
 */
export function buildSofiaTools(pipelineStage?: string): Record<string, unknown>[] {
  const tools: Record<string, unknown>[] = [];
  const currentYear = new Date().getFullYear();

  if (pipelineStage !== "VISITA_AGENDADA") {
    tools.push({
      type: "function",
      function: {
        name: "agendar_visita",
        description: `Programa una cita o visita al inmueble. Usa esto SOLO LA PRIMERA VEZ que el cliente acepta agendar explícitamente una fecha/hora. NO lo uses si el cliente solo agradece o si pide la ubicación de una cita ya agendada. Usa SIEMPRE el año actual (${currentYear}).`,
        parameters: {
          type: "object",
          properties: {
            fecha: { type: "string", description: `Fecha de la cita (ej. ${currentYear}-08-07)` },
            hora: { type: "string", description: "Hora de la cita (ej. 10:00 AM)" },
          },
          required: ["fecha", "hora"],
        },
      },
    });
  }

  return tools;
}

/**
 * Genera una respuesta de fallback (sin LLM) basada en keywords.
 */
export function buildFallbackReply(
  senderName: string,
  userMessageText: string,
  bestMatch: MatchedProperty | null
): string {
  const lowerMsg = userMessageText.toLowerCase();
  const wantsDepartment = lowerMsg.includes("departamento") || lowerMsg.includes("dormitorio");
  const isGreeting = lowerMsg === "hola" || lowerMsg.includes("buen dia") || lowerMsg.includes("buenas tardes");

  if (isGreeting && !wantsDepartment) {
    return `¡Hola ${senderName}! Soy Sofía, asistente virtual de Property OS. ¿En qué tipo de inmueble estás interesado hoy?`;
  }
  if (wantsDepartment && bestMatch?.title.toLowerCase().includes("departamento")) {
    return `¡Hola ${senderName}! Tengo este departamento ideal para ti: "${bestMatch.title}" en ${bestMatch.zone} por $${bestMatch.price_usd}. ¿Te interesaría agendar una visita?`;
  }
  if (wantsDepartment) {
    return `¡Hola ${senderName}! Contamos con departamentos de diferentes dormitorios en las mejores zonas. Un asesor te enviará nuestro catálogo en breve.`;
  }
  if ((lowerMsg.includes("precio") || lowerMsg.includes("cuanto")) && bestMatch) {
    return `El inmueble más cercano a tu búsqueda es "${bestMatch.title}" y tiene un valor de $${bestMatch.price_usd}. ¿Quisieras detalles del financiamiento?`;
  }
  if (bestMatch) {
    return `¡Hola ${senderName}! Basado en tu búsqueda, te sugiero el inmueble "${bestMatch.title}" en ${bestMatch.zone} por $${bestMatch.price_usd}. ¿Te gustaría visitarlo?`;
  }
  return `¡Hola ${senderName}! Un agente se comunicará contigo en breve para asesorarte detalladamente en tu búsqueda.`;
}
