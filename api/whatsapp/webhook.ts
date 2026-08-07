/**
 * Webhook Principal de Property OS — Orquestador.
 * 
 * Este archivo ya NO contiene lógica de negocio directa.
 * Toda la lógica está delegada a servicios independientes en /api/services/.
 * 
 * Flujo: Parse → Dedup → Lead Lookup → RAG → LLM → BANT → Upsert → Enviar
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { waitUntil } from "@vercel/functions";
import OpenAI from "openai";

// ── Servicios ──
// ── Servicios ──
import { sendWhatsAppMessage } from "../../src/services/evolution-api";
import { searchProperties } from "../../src/services/rag-search";
import { buildSofiaPrompt, buildSofiaTools, buildFallbackReply } from "../../src/services/sofia-prompt";
import { extractBantScore } from "../../src/services/bant-extractor";
import {
  findLeadByPhone,
  getChatHistory,
  getOrganization,
  upsertLead,
  saveMessages,
  createAppointment,
} from "../../src/services/lead-manager";
import {
  supabaseServer,
  DEFAULT_AI_CONFIG,
  DEFAULT_KEYWORDS,
  type WebhookProcessOptions,
  type ParsedIncomingMessage,
} from "../../src/services/shared";

// ── Deduplicación en memoria ──
const processedMessages = new Map<string, number>();
const DEDUP_WINDOW_MS = 60_000;

// ════════════════════════════════════════════════════════════════
// 1. PARSER: Extrae datos del payload de Evolution API
// ════════════════════════════════════════════════════════════════
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

  const senderName = (msgData.pushName as string) || (body.pushName as string) || "Cliente WhatsApp";

  return { rawPhoneNumber, senderName, userMessageText, messageId, fromMe, rawRemoteJid, payloadApiKey };
}

// ════════════════════════════════════════════════════════════════
// 2. PROCESADOR PRINCIPAL
// ════════════════════════════════════════════════════════════════
export async function processWebhookMessage(
  body: Record<string, unknown>,
  options: WebhookProcessOptions
): Promise<{ status: string; error?: string; leadId?: string }> {
  console.log("📥 [WEBHOOK_PAYLOAD]:", JSON.stringify(body).substring(0, 500) + "...");

  // ── Parse ──
  const msg = parseEvolutionPayload(body);

  // ── Guards rápidos ──
  if (msg.fromMe) return { status: "IGNORED", reason: "fromMe" };
  if (!msg.rawRemoteJid || msg.rawRemoteJid.includes("@g.us")) return { status: "IGNORED", reason: "Group or missing JID" };
  if (!msg.userMessageText) return { status: "IGNORED", reason: "Empty message" };

  // ── Deduplicación ──
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

  // ── Lead existente ──
  const existingLead = await findLeadByPhone(msg.rawPhoneNumber);
  if (existingLead?.ai_paused) return { status: "AI_PAUSED", leadId: existingLead.id };

  // ── Keywords (solo para leads nuevos) ──
  const lowerMsg = msg.userMessageText.toLowerCase();
  const hasKeyword = DEFAULT_KEYWORDS.some((kw) => lowerMsg.includes(kw));
  if (!existingLead && !hasKeyword) return { status: "IGNORED", reason: "No matching keywords" };

  // ── Organización + Config IA ──
  const org = await getOrganization();
  const orgId = org?.id || "org-1";
  const aiConfig = org?.ai_config || DEFAULT_AI_CONFIG;

  // ── Historial de chat ──
  let chatHistoryText = "";
  let historyCount = 0;
  if (existingLead) {
    const history = await getChatHistory(existingLead.id);
    chatHistoryText = history.text;
    historyCount = history.count;
  }

  // ── Freno lógico (mensaje corto sin contexto) ──
  const wordCount = msg.userMessageText.trim().split(/\s+/).length;
  if (wordCount < 3 && historyCount === 0) {
    const fallbackReply = `¡Hola ${msg.senderName}! Soy Sofía de Property OS. Para ayudarte mejor, ¿podrías darme un poco más de detalles sobre qué tipo de inmueble buscas o en qué zona?`;

    let fastLead = existingLead;
    if (!existingLead) {
      fastLead = await upsertLead(null, {
        organizationId: orgId,
        phoneNumber: msg.rawPhoneNumber,
        fullName: msg.senderName,
        pipelineStage: "EN_CALIFICACION",
        userMessageText: msg.userMessageText,
      });
    }

    if (fastLead?.id) await saveMessages(fastLead.id, msg.userMessageText, fallbackReply);

    const { evolutionApiUrl, evolutionApiKey, evolutionInstance } = options;
    if (evolutionApiUrl && evolutionInstance) {
      await sendWhatsAppMessage(msg.rawPhoneNumber, fallbackReply, evolutionInstance, evolutionApiUrl, msg.payloadApiKey || evolutionApiKey || "");
    }

    return { status: "SHORT_CIRCUIT", leadId: fastLead?.id };
  }

  // ── Búsqueda RAG ──
  const matchedProperties = await searchProperties(msg.userMessageText);
  const bestMatch = matchedProperties[0] || null;

  // ── Generar respuesta LLM ──
  let aiReplyText = "";
  let isAppointmentCreated = false;
  let appointmentDateString = "";

  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const sofiaPrompt = buildSofiaPrompt(aiConfig, bestMatch, chatHistoryText);
      const tools = buildSofiaTools(existingLead?.pipeline_stage);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: sofiaPrompt },
          { role: "user", content: `[Cliente]: "${msg.userMessageText}"` },
        ],
        tools: tools.length > 0 ? (tools as any) : undefined,
        temperature: 0.7,
        max_tokens: 250,
      });

      const message = response.choices[0].message;
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        if ('function' in toolCall && toolCall.function?.name === "agendar_visita") {
          const args = JSON.parse(toolCall.function.arguments);
          aiReplyText = `¡Perfecto! He agendado formalmente la visita para el ${args.fecha} a las ${args.hora}. Un asesor se pondrá en contacto para afinar detalles.`;
          isAppointmentCreated = true;
          appointmentDateString = `${args.fecha} ${args.hora}`;
        }
      } else {
        aiReplyText = message.content || "";
      }
    } catch (err) {
      console.error("[Webhook] LLM Error:", err);
    }
  }

  // ── Fallback si LLM falló ──
  if (!aiReplyText) {
    aiReplyText = buildFallbackReply(msg.senderName, msg.userMessageText, bestMatch);
  }

  // ── Extracción BANT ──
  const extractedBant = await extractBantScore(chatHistoryText, msg.userMessageText);

  // ── Pipeline stage ──
  const isFullyQualified = lowerMsg.includes("aporte") || lowerMsg.includes("cuota inicial") || lowerMsg.includes("banco");
  const stage = isAppointmentCreated
    ? "VISITA_AGENDADA"
    : isFullyQualified
      ? "CALIFICADO_VISITA_PENDIENTE"
      : "EN_CALIFICACION";

  // ── Upsert Lead ──
  const finalLead = await upsertLead(existingLead?.id || null, {
    organizationId: orgId,
    phoneNumber: msg.rawPhoneNumber,
    fullName: msg.senderName,
    pipelineStage: existingLead ? existingLead.pipeline_stage : stage,
    userMessageText: msg.userMessageText,
    propertyInterestId: bestMatch?.id,
    bantScore: extractedBant,
  });

  // ── Guardar mensajes ──
  if (finalLead?.id) {
    await saveMessages(finalLead.id, msg.userMessageText, aiReplyText);
    if (isAppointmentCreated) {
      await createAppointment(orgId, finalLead.id, bestMatch?.id || null, appointmentDateString);
    }
  }

  // ── Enviar WhatsApp + Alertas Push ──
  const { evolutionApiUrl, evolutionApiKey, evolutionInstance } = options;
  if (evolutionApiUrl && evolutionApiKey && evolutionInstance) {
    try {
      const humanDelayMs = Math.min(Math.floor(aiReplyText.length * 15), 1500);
      await new Promise((resolve) => setTimeout(resolve, humanDelayMs));
      await sendWhatsAppMessage(msg.rawPhoneNumber, aiReplyText, evolutionInstance, evolutionApiUrl, msg.payloadApiKey || evolutionApiKey || "");

      // ── Motor de Alertas Push ──
      if (isAppointmentCreated) {
        let agentPhone = "";
        if (finalLead?.assigned_agent_id) {
          const { data: agentData } = await supabaseServer.from("users").select("phone_number").eq("id", finalLead.assigned_agent_id).single();
          if (agentData?.phone_number) agentPhone = agentData.phone_number;
        }
        if (!agentPhone && aiConfig?.defaultAgentPhone) agentPhone = aiConfig.defaultAgentPhone;
        if (!agentPhone && process.env.AGENT_PHONE_NUMBER) agentPhone = process.env.AGENT_PHONE_NUMBER;

        if (agentPhone) {
          const pushText = `*NUEVA VISITA AGENDADA* 🚨\n\n*Lead:* ${msg.senderName}\n*Teléfono:* ${msg.rawPhoneNumber}\n*Fecha/Hora:* ${appointmentDateString}\n*Inmueble:* ${bestMatch?.title || "Por definir"}\n*Presupuesto (BANT):* $${extractedBant?.budget || 0}\n\n👉 Accede al Kanban para más detalles.`;
          await sendWhatsAppMessage(agentPhone, pushText, evolutionInstance, evolutionApiUrl, msg.payloadApiKey || evolutionApiKey || "");
          console.log(`[Webhook] 📱 Push Alert enviado al agente (${agentPhone})`);
        }
      }
    } catch (sendErr) {
      console.error("[Webhook] Error enviando mensaje:", sendErr);
    }
  }

  return { status: "SUCCESS", leadId: finalLead?.id };
}

// ════════════════════════════════════════════════════════════════
// 3. HANDLER HTTP (Vercel Serverless)
// ════════════════════════════════════════════════════════════════
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") return res.status(200).json({ status: "WEBHOOK_ACTIVE", system: "Property OS" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  console.log("WEBHOOK_HIT:", JSON.stringify(req.body).substring(0, 300) + "...");

  // Responder inmediatamente para evitar timeout
  res.status(200).json({ status: "OK" });

  // Procesar en background
  waitUntil(
    processWebhookMessage(req.body || {}, {
      evolutionApiUrl: process.env.EVOLUTION_API_URL,
      evolutionApiKey: process.env.EVOLUTION_API_KEY,
      evolutionInstance: process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main",
    }).catch((err) => console.error("ERROR_PROCESSING_WEBHOOK:", err))
  );
}
