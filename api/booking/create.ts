import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

// Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServer = createClient(supabaseUrl, supabaseKey);

// Evolution API helper
async function sendWhatsAppMessage(phone: string, text: string) {
  const recipientNumber = phone.replace('@s.whatsapp.net', '').replace('@g.us', '').replace(/\D/g, '');
  const rawBaseUrl = process.env.EVOLUTION_API_URL || "";
  const cleanBaseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
  const instance = process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main";
  const targetUrl = `${cleanBaseUrl}/message/sendText/${instance}`;

  const GLOBAL_API_KEY = "a2bf8aaaec21a9806766c4a536c75e716d1480feff6f9705697bf626e8fab135";
  const activeApiKey = process.env.EVOLUTION_API_KEY || GLOBAL_API_KEY;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": activeApiKey
      },
      body: JSON.stringify({
        number: String(recipientNumber),
        text: text,
        delay: 2000,
        presence: "composing"
      })
    });
    return response.ok;
  } catch (err) {
    console.error("[Evolution API] Fallo de red:", err);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lead_phone, property_id, datetime, notes } = req.body;

    if (!lead_phone || !datetime) {
      return res.status(400).json({ error: "lead_phone and datetime are required" });
    }

    // 1. Get Lead ID from Phone
    const cleanPhone = lead_phone.replace(/\D/g, '');
    const { data: lead, error: leadErr } = await supabaseServer
      .from("leads")
      .select("id, full_name, organization_id")
      .eq("phone_number", cleanPhone)
      .single();

    if (leadErr || !lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const orgId = lead.organization_id;

    // 2. Get Property info
    let propertyTitle = "Propiedad";
    if (property_id) {
      const { data: property } = await supabaseServer
        .from("properties")
        .select("title")
        .eq("id", property_id)
        .single();
      if (property) propertyTitle = property.title;
    }

    // 3. Create Event in Google Calendar
    let eventLink = "";
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        const auth = new google.auth.JWT({
          email: credentials.client_email,
          key: credentials.private_key,
          scopes: ['https://www.googleapis.com/auth/calendar.events']
        });
        const calendar = google.calendar({ version: 'v3', auth });

        const start = new Date(datetime);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

        const event = await calendar.events.insert({
          calendarId: 'primary', // Or a specific calendar ID from env
          requestBody: {
            summary: `Visita: ${propertyTitle} - ${lead.full_name}`,
            description: `Visita agendada vía Property OS.\nTeléfono: ${lead_phone}\nNotas: ${notes || ''}`,
            start: { dateTime: start.toISOString() },
            end: { dateTime: end.toISOString() },
          }
        });
        
        eventLink = event.data.htmlLink || "";
      } catch (calErr) {
        console.error("Google Calendar Error:", calErr);
      }
    } else {
      console.warn("GOOGLE_SERVICE_ACCOUNT_KEY not set. Skipping calendar event creation.");
    }

    // 4. Save to Supabase `appointments`
    const { data: appointment, error: aptError } = await supabaseServer
      .from("appointments")
      .insert([{
        organization_id: orgId,
        lead_id: lead.id,
        property_id: property_id || null,
        appointment_date: new Date(datetime).toISOString(),
        status: "SCHEDULED",
        notes: notes || ""
      }])
      .select()
      .single();

    if (aptError) {
      console.error("Supabase Error saving appointment:", aptError);
      return res.status(500).json({ error: "Error saving appointment" });
    }

    // 5. Update lead pipeline stage
    await supabaseServer
      .from("leads")
      .update({ pipeline_stage: "VISITA_AGENDADA" })
      .eq("id", lead.id);

    // 6. Send WhatsApp confirmation
    const formattedDate = new Date(datetime).toLocaleString("es-BO", {
      weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
    });
    
    const wsText = `¡Perfecto ${lead.full_name}! Hemos agendado tu visita para ${propertyTitle}.\n\n📅 *Fecha y Hora:* ${formattedDate}\n📍 Un asesor te contactará pronto con la ubicación exacta.\n\n${eventLink ? `🔗 Puedes añadirlo a tu calendario aquí: ${eventLink}` : ''}\n\n¡Te esperamos!`;
    
    await sendWhatsAppMessage(cleanPhone, wsText);

    return res.status(200).json({ 
      success: true, 
      appointment,
      calendarLink: eventLink 
    });

  } catch (err: any) {
    console.error("Error creating booking:", err);
    return res.status(500).json({ error: err.message });
  }
}
