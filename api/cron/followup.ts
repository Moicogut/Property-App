import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";

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
  // Check Vercel Cron header if needed (optional security check for production)
  // const authHeader = req.headers.authorization;
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).send('Unauthorized');
  // }

  try {
    const now = new Date();
    console.log(`[Cron Followup] Ejecutando a las ${now.toISOString()}`);
    let sentCount = 0;

    // ---------------------------------------------------------
    // 1. Recordatorio 2h antes de la visita
    // ---------------------------------------------------------
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const startRange = new Date(twoHoursFromNow.getTime() - 15 * 60 * 1000); // 2h minus 15 min tolerance
    const endRange = new Date(twoHoursFromNow.getTime() + 15 * 60 * 1000);   // 2h plus 15 min tolerance

    const { data: upcomingApts } = await supabaseServer
      .from("appointments")
      .select(`
        id, 
        appointment_date, 
        leads ( phone_number, full_name ),
        properties ( title )
      `)
      .eq("status", "SCHEDULED")
      .eq("reminder_sent", false)
      .gte("appointment_date", startRange.toISOString())
      .lte("appointment_date", endRange.toISOString());

    if (upcomingApts && upcomingApts.length > 0) {
      for (const apt of upcomingApts) {
        const lead = apt.leads as any;
        const property = apt.properties as any;
        if (lead && lead.phone_number) {
          const propertyTitle = property ? property.title : "la propiedad";
          const msg = `¡Hola ${lead.full_name}! 👋 Te recordamos que tienes una visita programada para ${propertyTitle} en aproximadamente 2 horas. ¡Te esperamos!`;
          await sendWhatsAppMessage(lead.phone_number, msg);
          
          await supabaseServer
            .from("appointments")
            .update({ reminder_sent: true })
            .eq("id", apt.id);
            
          sentCount++;
        }
      }
    }

    // ---------------------------------------------------------
    // 2. Solicitud de Feedback 2h post-visita
    // ---------------------------------------------------------
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const startRangePast = new Date(twoHoursAgo.getTime() - 15 * 60 * 1000);
    const endRangePast = new Date(twoHoursAgo.getTime() + 15 * 60 * 1000);

    const { data: pastApts } = await supabaseServer
      .from("appointments")
      .select(`
        id, 
        appointment_date, 
        leads ( phone_number, full_name ),
        properties ( title )
      `)
      .in("status", ["SCHEDULED", "COMPLETED"]) // Assuming SCHEDULED hasn't been manually marked COMPLETED yet
      .eq("feedback_requested", false)
      .gte("appointment_date", startRangePast.toISOString())
      .lte("appointment_date", endRangePast.toISOString());

    if (pastApts && pastApts.length > 0) {
      for (const apt of pastApts) {
        const lead = apt.leads as any;
        const property = apt.properties as any;
        if (lead && lead.phone_number) {
          const propertyTitle = property ? property.title : "la propiedad";
          const msg = `¡Hola ${lead.full_name}! Esperamos que te haya gustado la visita a ${propertyTitle}. 🏠\n\n¿Podrías calificarnos del 1 al 5 respondiendo a este mensaje? (Siendo 5 excelente). ¡Tu opinión es muy valiosa para nosotros!`;
          await sendWhatsAppMessage(lead.phone_number, msg);
          
          await supabaseServer
            .from("appointments")
            .update({ 
              feedback_requested: true,
              status: "COMPLETED" // Auto-complete it after feedback request
            })
            .eq("id", apt.id);
            
          sentCount++;
        }
      }
    }

    // ---------------------------------------------------------
    // 3. Re-enganche 24h a leads fríos
    // ---------------------------------------------------------
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Find leads in EN_CALIFICACION or NUEVO who haven't been updated in 24h and are not paused
    const { data: coldLeads } = await supabaseServer
      .from("leads")
      .select("id, phone_number, full_name, ai_paused")
      .in("pipeline_stage", ["NUEVO", "EN_CALIFICACION"])
      .eq("ai_paused", false)
      .lte("updated_at", twentyFourHoursAgo.toISOString())
      // Limit to 50 to avoid blasting API
      .limit(50);

    if (coldLeads && coldLeads.length > 0) {
      for (const lead of coldLeads) {
        // Double check they don't have recent messages
        const { data: recentMsgs } = await supabaseServer
          .from("messages")
          .select("id")
          .eq("lead_id", lead.id)
          .gte("created_at", twentyFourHoursAgo.toISOString())
          .limit(1);

        if (!recentMsgs || recentMsgs.length === 0) {
          const msg = `¡Hola ${lead.full_name}! Seguimos buscando tu hogar ideal 🏡. ¿Tienes alguna duda o te gustaría que te enviemos más opciones?`;
          await sendWhatsAppMessage(lead.phone_number, msg);
          
          // "Touch" the lead so we don't message them again tomorrow
          await supabaseServer
            .from("leads")
            .update({ updated_at: now.toISOString() })
            .eq("id", lead.id);
            
          sentCount++;
        }
      }
    }

    return res.status(200).json({ success: true, sentCount });
  } catch (err: any) {
    console.error("[Cron] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
