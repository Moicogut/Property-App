/**
 * Servicio de gestión de Leads en Supabase.
 * Responsabilidad única: crear, actualizar y consultar leads y mensajes.
 */
import { supabaseServer } from "./shared";
import type { BantScore } from "./shared";

/** Busca un lead existente por número de teléfono. */
export async function findLeadByPhone(phoneNumber: string) {
  const { data } = await supabaseServer
    .from("leads")
    .select("id, ai_paused, pipeline_stage")
    .eq("phone_number", phoneNumber)
    .limit(1)
    .single();
  return data;
}

/** Recupera el historial de chat reciente de un lead (últimos N mensajes). */
export async function getChatHistory(leadId: string, limit = 6): Promise<{ text: string; count: number }> {
  const { data: historyData } = await supabaseServer
    .from("messages")
    .select("sender, text")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!historyData || historyData.length === 0) {
    return { text: "", count: 0 };
  }

  const sortedHistory = historyData.reverse();
  const text =
    "HISTORIAL DE CONVERSACIÓN RECIENTE:\n" +
    sortedHistory.map((msg) => `[${msg.sender === "lead" ? "Cliente" : "Sofía"}]: ${msg.text}`).join("\n");

  return { text, count: historyData.length };
}

/** Obtiene la organización y su configuración IA. */
export async function getOrganization() {
  const { data: orgs, error } = await supabaseServer.from("organizations").select("*").limit(1);
  if (error) console.error("[LeadManager] Error obteniendo Organization:", error);
  return orgs?.[0] || null;
}

interface UpsertLeadPayload {
  organizationId: string;
  phoneNumber: string;
  fullName: string;
  pipelineStage: string;
  userMessageText: string;
  propertyInterestId?: string | null;
  bantScore?: BantScore | null;
}

/** Crea o actualiza un lead en Supabase. Retorna el lead final. */
export async function upsertLead(existingLeadId: string | null, payload: UpsertLeadPayload) {
  const leadData: Record<string, unknown> = {
    organization_id: payload.organizationId,
    phone_number: payload.phoneNumber,
    full_name: payload.fullName,
    pipeline_stage: payload.pipelineStage,
    ai_summary: `[Último mensaje]: ${payload.userMessageText.substring(0, 100)}...`,
    property_interest_id: payload.propertyInterestId || null,
  };

  if (payload.bantScore) {
    leadData.bant_score = payload.bantScore;
    if (payload.bantScore.budget > 0) {
      leadData.budget_max_usd = payload.bantScore.budget;
    }
    if (payload.bantScore.preferred_zone) {
      leadData.preferred_zone = payload.bantScore.preferred_zone;
    }
  }

  if (existingLeadId) {
    const { data } = await supabaseServer
      .from("leads")
      .update(leadData)
      .eq("id", existingLeadId)
      .select()
      .single();
    return data;
  }

  const { data } = await supabaseServer.from("leads").insert(leadData).select().single();
  return data;
}

/** Guarda los mensajes del cliente y de Sofía en la tabla messages. */
export async function saveMessages(leadId: string, userText: string, aiReply: string) {
  try {
    await supabaseServer.from("messages").insert([
      { lead_id: leadId, sender: "lead", text: userText },
      { lead_id: leadId, sender: "ai_sofia", text: aiReply },
    ]);
  } catch (err) {
    console.error("[LeadManager] Error guardando historial:", err);
  }
}

/** Crea una cita (appointment) en Supabase. */
export async function createAppointment(
  organizationId: string,
  leadId: string,
  propertyId: string | null,
  appointmentDateString: string
) {
  try {
    const aptDate = new Date();
    aptDate.setDate(aptDate.getDate() + 1);

    await supabaseServer.from("appointments").insert([
      {
        organization_id: organizationId,
        lead_id: leadId,
        property_id: propertyId,
        appointment_date: aptDate.toISOString(),
        status: "SCHEDULED",
      },
    ]);
  } catch (err) {
    console.error("[LeadManager] Error creando cita:", err);
  }
}
