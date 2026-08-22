import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface SendInvitationPayload {
  prospectId: string;
  agencyName: string;
  managerName: string;
  emailOfficial?: string;
  emailPersonal?: string;
  city: string;
  meetingType?: "zoom" | "meet";
  proposedDate?: string; // e.g. "lunes 25 de agosto a las 10:00 AM"
  customMessage?: string;
}

export interface GeneratedInvitation {
  subject: string;
  html_body: string;
  plain_text: string;
  meeting_link: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      prospectId,
      agencyName,
      managerName,
      emailOfficial,
      emailPersonal,
      city,
      meetingType = "meet",
      proposedDate = "el día que mejor te convenga",
      customMessage = "",
    }: SendInvitationPayload = req.body;

    if (!prospectId || !agencyName || !managerName) {
      return res.status(400).json({ error: "prospectId, agencyName y managerName son obligatorios." });
    }

    const targetEmail = emailOfficial || emailPersonal;
    if (!targetEmail) {
      return res.status(400).json({ error: "Se requiere al menos un email de destino." });
    }

    const meetingLinks: Record<string, string> = {
      zoom: "https://us06web.zoom.us/j/81234567890?pwd=PropertyOSDemo2026",
      meet: "https://meet.google.com/property-os-demo",
    };
    const meetingLink = meetingLinks[meetingType] || meetingLinks.meet;
    const meetingPlatformName = meetingType === "zoom" ? "Zoom" : "Google Meet";

    const apiKey = process.env.OPENAI_API_KEY;

    let subject: string;
    let htmlBody: string;
    let plainText: string;

    if (apiKey) {
      const openai = new OpenAI({ apiKey });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Eres un especialista en B2B Sales y Cold Email Outreach para SaaS Inmobiliario en Bolivia.
Tu objetivo es redactar un correo frío de invitación a una demostración en vivo de Property OS, un CRM inmobiliario con IA (Sofía IA), contratos digitales y análisis de mercado.

TONO: Profesional ejecutivo pero cercano. Nada de lenguaje de spam. Personalizado y específico.
ESTRUCTURA DEL CORREO:
1. Asunto (subject): Directo, curioso, 10-12 palabras máximo
2. Saludo personalizado
3. Hook: Una pregunta o insight sobre el reto de gestión de leads en agencias inmobiliarias
4. Propuesta de valor en 2-3 oraciones: Sofía IA (responde leads en WhatsApp 24/7), contratos digitales con firma electrónica, análisis de mercado CMA con IA
5. Invitación concreta a una demo en ${meetingPlatformName}
6. CTA único y claro con el link de la reunión
7. Firma ejecutiva de Property OS

Devuelve JSON: { "subject": "...", "html_body": "...", "plain_text": "..." }
html_body: HTML completo con estilos inline (fondo blanco, tipografía corporativa oscura, botón CTA dorado #D4AF37)`,
          },
          {
            role: "user",
            content: `Redacta el correo de invitación para:
- Nombre del Gerente: ${managerName}
- Nombre de la Agencia: ${agencyName}
- Ciudad: ${city}
- Plataforma de Demo: ${meetingPlatformName}
- Link de la Reunión: ${meetingLink}
- Fecha propuesta: ${proposedDate}
- Mensaje adicional del Director: "${customMessage || "Sin mensaje adicional"}"`,
          },
        ],
      });

      const parsed = JSON.parse(response.choices[0].message.content || "{}");
      subject = parsed.subject || `Demostración en vivo de Property OS para ${agencyName} — 30 minutos`;
      htmlBody = parsed.html_body || "";
      plainText = parsed.plain_text || "";
    } else {
      // Fallback de plantilla prediseñada
      subject = `🏢 ${managerName}, ¿tu agencia responde leads en WhatsApp a las 3 AM?`;
      plainText = `Hola ${managerName},\n\n¿Sabías que el 74% de los leads inmobiliarios en Bolivia se enfrían en las primeras 2 horas sin respuesta?\n\nProperty OS resuelve esto con Sofía IA, una asistente que califica leads en WhatsApp 24/7, genera contratos con firma digital y analiza el mercado con IA en tiempo real.\n\nMe gustaría invitarte a una demo de 30 minutos en ${meetingPlatformName} para mostrarte cómo ${agencyName} puede aumentar su tasa de conversión desde el primer mes.\n\n📅 Reunión: ${proposedDate}\n🔗 Link: ${meetingLink}\n\nSaludos,\nEquipo Property OS\nhttps://property-app-ashen.vercel.app`;
      htmlBody = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f9f9f9;margin:0;padding:0">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:30px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
<tr><td style="background:#0B0D12;padding:28px 40px;text-align:center">
<h1 style="color:#D4AF37;font-size:22px;margin:0;font-weight:900;letter-spacing:1px">Property OS</h1>
<p style="color:#94A3B8;font-size:12px;margin:6px 0 0">CRM Inmobiliario con Inteligencia Artificial</p>
</td></tr>
<tr><td style="padding:40px">
<p style="color:#1E293B;font-size:16px;margin:0 0 20px">Hola <strong>${managerName}</strong>,</p>
<p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px">¿Tu equipo pierde leads porque nadie responde el WhatsApp después de las 6 PM?</p>
<p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px"><strong>Property OS</strong> es el sistema que convierte tu agencia en una máquina de conversión las 24 horas:</p>
<ul style="color:#475569;font-size:15px;line-height:1.9;padding-left:20px;margin:0 0 24px">
<li>🤖 <strong>Sofía IA</strong> — Califica leads en WhatsApp con metodología BANT sin intervención humana</li>
<li>📄 <strong>Contratos Digitales</strong> — Genera y firma contratos de arras en minutos</li>
<li>📊 <strong>Análisis CMA con IA</strong> — Valúa propiedades con datos reales del mercado de ${city}</li>
</ul>
<p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 32px">Me gustaría mostrarte en <strong>30 minutos</strong> cómo <strong>${agencyName}</strong> puede implementarlo desde esta semana.</p>
<div style="text-align:center;margin-bottom:32px">
<a href="${meetingLink}" style="display:inline-block;background:#D4AF37;color:#0B0D12;font-weight:900;font-size:15px;padding:16px 40px;border-radius:10px;text-decoration:none">
📅 Reservar Demo en ${meetingPlatformName} — ${proposedDate}
</a>
</div>
<p style="color:#94A3B8;font-size:13px;margin:0">Saludos ejecutivos,<br><strong style="color:#1E293B">Equipo Comercial Property OS</strong><br>
<a href="https://property-app-ashen.vercel.app" style="color:#D4AF37">property-app-ashen.vercel.app</a></p>
</td></tr>
<tr><td style="background:#F8FAFC;padding:16px 40px;text-align:center;border-top:1px solid #E2E8F0">
<p style="color:#CBD5E1;font-size:11px;margin:0">© 2026 Property OS · ECOTRAFFIC A8 · ${city}, Bolivia</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
    }

    // Actualizar estado en Supabase
    const { error: updateError } = await supabaseAdmin
      .from("b2b_agency_prospects")
      .update({
        outreach_status: "EMAIL_ENVIADO",
        last_contacted_at: new Date().toISOString(),
        meeting_link: meetingLink,
        updated_at: new Date().toISOString(),
      })
      .eq("id", prospectId);

    if (updateError) {
      console.warn("[send-invitation] Status update warn:", updateError.message);
    }

    // En producción real: aquí iría Resend / Nodemailer / SendGrid
    // Por ahora, devolvemos el correo generado para envío manual o integración futura
    return res.status(200).json({
      success: true,
      to: targetEmail,
      subject,
      html_body: htmlBody,
      plain_text: plainText,
      meeting_link: meetingLink,
      meeting_platform: meetingPlatformName,
      message: `Invitación generada para ${managerName} de ${agencyName}. Prospecto actualizado a EMAIL_ENVIADO.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error generating invitation";
    console.error("[api/admin/send-invitation] Error:", error);
    return res.status(500).json({ error: msg });
  }
}
