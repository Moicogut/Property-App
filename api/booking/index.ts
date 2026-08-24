/**
 * api/booking/index.ts
 * Handler unificado para el módulo de Reservas de Visitas.
 * Consolidado de booking/create.ts + booking/feedback.ts para respetar
 * el límite de 12 Serverless Functions del plan Hobby de Vercel.
 *
 * Actions:
 *   - "create"   → Crea cita, evento en Google Calendar, actualiza pipeline y envía WhatsApp
 *   - "feedback" → Registra rating post-visita y actualiza etapa del lead
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServer = createClient(supabaseUrl, supabaseKey);

// ─── MAIN ROUTER ─────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action } = req.body as { action?: string };

  if (!action) {
    return res.status(400).json({ error: "Campo 'action' requerido: 'create' | 'feedback'" });
  }

  try {
    switch (action) {
      case "create":
        return await handleCreate(req, res);
      case "feedback":
        return await handleFeedback(req, res);
      default:
        return res.status(400).json({ error: `Action '${action}' no reconocida. Usa: 'create' | 'feedback'` });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error(`[api/booking] Error en action='${action}':`, err);
    return res.status(500).json({ error: msg });
  }
}

// ─── ACTION: CREATE BOOKING ───────────────────────────────────────────────────

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  const { lead_phone, property_id, datetime, notes } = req.body as {
    lead_phone: string;
    property_id?: string;
    datetime: string;
    notes?: string;
  };

  if (!lead_phone || !datetime) {
    return res.status(400).json({ error: "lead_phone and datetime are required" });
  }

  // Validación temporal estricta: Rechazar fechas pasadas (IA-03)
  const appointmentTarget = new Date(datetime);
  if (isNaN(appointmentTarget.getTime())) {
    return res.status(400).json({ error: "Formato de fecha u hora inválido." });
  }
  if (appointmentTarget.getTime() < Date.now()) {
    return res.status(400).json({ error: "No se pueden agendar visitas en fechas u horarios pasados (IA-03)." });
  }

  // 1. Obtener Lead por teléfono
  const cleanPhone = lead_phone.replace(/\D/g, "");
  const { data: lead, error: leadErr } = await supabaseServer
    .from("leads")
    .select("id, full_name, organization_id")
    .eq("phone_number", cleanPhone)
    .single();

  if (leadErr || !lead) {
    return res.status(404).json({ error: "Lead not found" });
  }

  // 2. Obtener info de propiedad
  let propertyTitle = "Propiedad";
  if (property_id) {
    const { data: property } = await supabaseServer
      .from("properties")
      .select("title")
      .eq("id", property_id)
      .single();
    if (property) propertyTitle = property.title;
  }

  // 3. Crear evento en Google Calendar (si está configurado)
  let eventLink = "";
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ["https://www.googleapis.com/auth/calendar.events"],
      });
      const calendar = google.calendar({ version: "v3", auth });
      const start = appointmentTarget;
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const event = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: `Visita: ${propertyTitle} - ${lead.full_name}`,
          description: `Visita agendada vía Property OS.\nTeléfono: ${lead_phone}\nNotas: ${notes || ""}`,
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
        },
      });
      eventLink = event.data.htmlLink || "";
    } catch (calErr) {
      console.error("[booking/create] Google Calendar Error:", calErr);
    }
  }

  // 4. Guardar en tabla `appointments`
  const { data: appointment, error: aptError } = await supabaseServer
    .from("appointments")
    .insert([{
      organization_id: lead.organization_id,
      lead_id: lead.id,
      property_id: property_id || null,
      appointment_date: appointmentTarget.toISOString(),
      status: "SCHEDULED",
      notes: notes || "",
    }])
    .select()
    .single();

  if (aptError) {
    console.error("[booking/create] Supabase error:", aptError);
    return res.status(500).json({ error: "Error saving appointment" });
  }

  // 5. Actualizar etapa del pipeline y fecha de cita del lead
  await supabaseServer
    .from("leads")
    .update({ 
      pipeline_stage: "VISITA_AGENDADA",
      appointment_date: appointmentTarget.toISOString(),
    })
    .eq("id", lead.id);

  // 6. Enviar confirmación por WhatsApp
  const formattedDate = appointmentTarget.toLocaleString("es-BO", {
    timeZone: "America/La_Paz",
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });
  const wsText = `¡Perfecto ${lead.full_name}! Hemos agendado tu visita para ${propertyTitle}.\n\n📅 *Fecha y Hora:* ${formattedDate} (Bolivia)\n📍 Un asesor te contactará pronto con la ubicación exacta.\n\n${eventLink ? `🔗 Puedes añadirlo a tu calendario aquí: ${eventLink}` : ""}\n\n¡Te esperamos!`;
  await sendWhatsAppMessage(cleanPhone, wsText);

  return res.status(200).json({ success: true, appointment, calendarLink: eventLink });
}

// ─── ACTION: FEEDBACK ────────────────────────────────────────────────────────

async function handleFeedback(req: VercelRequest, res: VercelResponse) {
  const { appointment_id, rating, notes } = req.body as {
    appointment_id: string;
    rating: number;
    notes?: string;
  };

  if (!appointment_id || rating === undefined) {
    return res.status(400).json({ error: "appointment_id and rating are required" });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be between 1 and 5" });
  }

  const { data: appointment, error: aptError } = await supabaseServer
    .from("appointments")
    .update({ rating, notes: notes || null })
    .eq("id", appointment_id)
    .select()
    .single();

  if (aptError) {
    console.error("[booking/feedback] Supabase error:", aptError);
    return res.status(500).json({ error: "Error saving feedback" });
  }

  if (appointment?.lead_id) {
    const newStage = rating >= 4 ? "EN_NEGOCIACION" : "VISITA_REALIZADA";
    await supabaseServer
      .from("leads")
      .update({ pipeline_stage: newStage })
      .eq("id", appointment.lead_id);
  }

  return res.status(200).json({ success: true, appointment });
}

// ─── HELPER: WHATSAPP ─────────────────────────────────────────────────────────

async function sendWhatsAppMessage(phone: string, text: string): Promise<boolean> {
  const recipientNumber = phone.replace(/@s\.whatsapp\.net|@g\.us/g, "").replace(/\D/g, "");
  const rawBaseUrl = process.env.EVOLUTION_API_URL || "";
  const cleanBaseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
  const instance = process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main";
  const activeApiKey = process.env.EVOLUTION_API_KEY || "a2bf8aaaec21a9806766c4a536c75e716d1480feff6f9705697bf626e8fab135";

  try {
    const response = await fetch(`${cleanBaseUrl}/message/sendText/${instance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: activeApiKey },
      body: JSON.stringify({ number: recipientNumber, text, delay: 2000, presence: "composing" }),
    });
    return response.ok;
  } catch (err) {
    console.error("[Evolution API] Fallo de red:", err);
    return false;
  }
}
