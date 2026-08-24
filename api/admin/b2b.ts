/**
 * api/admin/b2b.ts
 * Handler unificado para el módulo B2B Agency Prospecting.
 * Routing por campo `action` en el body para respetar el límite de
 * 12 Serverless Functions del plan Hobby de Vercel.
 *
 * Actions disponibles:
 *   - "search"   → Escanea agencias inmobiliarias por ciudad con IA
 *   - "invite"   → Genera correo ejecutivo de invitación a demo
 *   - "convert"  → Convierte prospecto a organización activa (tenant)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── MAIN ROUTER ────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action } = req.body as { action?: string };

  if (!action) {
    return res.status(400).json({ error: "Campo 'action' requerido: 'search' | 'invite' | 'convert'" });
  }

  try {
    switch (action) {
      case "search":
        return await handleSearch(req, res);
      case "invite":
        return await handleInvite(req, res);
      case "convert":
        return await handleConvert(req, res);
      default:
        return res.status(400).json({ error: `Action '${action}' no reconocida. Usa: 'search' | 'invite' | 'convert'` });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error(`[api/admin/b2b] Error en action='${action}':`, error);
    return res.status(500).json({ error: msg });
  }
}

// ─── ACTION: SEARCH ─────────────────────────────────────────────────────────

async function handleSearch(req: VercelRequest, res: VercelResponse) {
  const { city = "Santa Cruz", country = "Bolivia", limit = 15 } = req.body as {
    city?: string;
    country?: string;
    limit?: number;
  };

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const sampleProspects = buildSampleProspects(city);
    return res.status(200).json({ success: true, prospects: sampleProspects, total: sampleProspects.length, source: "SAMPLE_FALLBACK" });
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a B2B Real Estate Agency Intelligence Researcher specializing in ${country}.
Generate a realistic, research-quality list of real estate agencies in ${city}, ${country}.
For each agency provide: agency_name, city ("${city}"), zone, address, website_url, phone_official (+591 format), whatsapp_contact, manager_name, manager_role, email_official, email_personal, linkedin_url, notes.
Respond ONLY with valid json. Return EXACTLY ${Math.min(Number(limit), 20)} agencies as: { "prospects": [...] }`,
      },
      {
        role: "user",
        content: `Generate ${Math.min(Number(limit), 20)} real estate agencies in ${city}, ${country} with manager contacts.`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content || "{}");
  const rawProspects = (parsed.prospects || []).map((p: Record<string, unknown>) => ({
    ...p,
    enrichment_status: "ENRICHED",
    outreach_status: "NUEVO",
  }));

  if (rawProspects.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from("b2b_agency_prospects")
      .insert(rawProspects);
    if (insertError) {
      console.warn("[b2b/search] Insert warn:", insertError.message);
    }
  }

  return res.status(200).json({ success: true, prospects: rawProspects, total: rawProspects.length, source: "AI_GENERATED" });
}

function buildSampleProspects(city: string) {
  return [
    { agency_name: "RE/MAX Bolivia", city, zone: "Equipetrol", website_url: "https://www.remax.com.bo", phone_official: "+591-3-3331234", whatsapp_contact: "+591-77712345", manager_name: "Marcelo Terán", manager_role: "Broker Owner", email_official: "mteran@remax.com.bo", enrichment_status: "ENRICHED", outreach_status: "NUEVO", notes: "Franquicia internacional líder en Bolivia" },
    { agency_name: "Century 21 Bolivia", city, zone: "Las Palmas", website_url: "https://www.century21.com.bo", phone_official: "+591-3-3442211", whatsapp_contact: "+591-76623456", manager_name: "Andrea Salazar", manager_role: "Gerente General", email_official: "a.salazar@century21.com.bo", enrichment_status: "ENRICHED", outreach_status: "NUEVO", notes: "Red internacional de propiedades de lujo" },
    { agency_name: "Coldwell Banker Bolivia", city, zone: "Zona Norte", website_url: "https://www.coldwellbanker.com.bo", phone_official: "+591-3-3556677", whatsapp_contact: "+591-71189000", manager_name: "Roberto Vásquez", manager_role: "Country Manager", email_official: "r.vasquez@coldwellbanker.com.bo", enrichment_status: "ENRICHED", outreach_status: "NUEVO", notes: "Especialistas en propiedades comerciales premium" },
    { agency_name: "Construmax Bienes Raíces", city, zone: "Barrio Lindo", website_url: "https://www.construmax.com.bo", phone_official: "+591-3-3678912", whatsapp_contact: "+591-76645678", manager_name: "Patricia Montero", manager_role: "Directora Comercial", email_official: "pmontero@construmax.com.bo", enrichment_status: "ENRICHED", outreach_status: "NUEVO", notes: "Líder en proyectos VIS y crédito social" },
    { agency_name: "Bienes Raíces del Oriente", city, zone: "Plan 3000", website_url: "https://www.broriente.bo", phone_official: "+591-3-3223344", whatsapp_contact: "+591-77934567", manager_name: "Fernando Aliaga", manager_role: "Gerente de Ventas", email_official: "faliaga@broriente.bo", enrichment_status: "ENRICHED", outreach_status: "NUEVO", notes: "Especialistas en crédito VIS y familias jóvenes" },
  ];
}

// ─── ACTION: INVITE ──────────────────────────────────────────────────────────

async function handleInvite(req: VercelRequest, res: VercelResponse) {
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
  } = req.body as {
    prospectId: string;
    agencyName: string;
    managerName: string;
    emailOfficial?: string;
    emailPersonal?: string;
    city: string;
    meetingType?: "zoom" | "meet";
    proposedDate?: string;
    customMessage?: string;
  };

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
Redacta un correo ejecutivo personalizado de invitación a una demo de Property OS (CRM inmobiliario con IA).
TONO: Profesional ejecutivo, cercano, sin lenguaje spam. Propuesta de valor: Sofía IA (WhatsApp 24/7), contratos digitales, análisis CMA con IA.
Responde ÚNICAMENTE con json válido con esta estructura: { "subject": "...", "html_body": "HTML completo con estilos inline y botón CTA dorado #D4AF37", "plain_text": "..." }`,
        },
        {
          role: "user",
          content: `Gerente: ${managerName} | Agencia: ${agencyName} | Ciudad: ${city} | Plataforma: ${meetingPlatformName} | Link: ${meetingLink} | Fecha: ${proposedDate} | Nota: "${customMessage}"`,
        },
      ],
    });
    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    subject = parsed.subject || `Demostración Property OS para ${agencyName} — 30 minutos`;
    htmlBody = parsed.html_body || buildFallbackHtml(managerName, agencyName, city, meetingLink, meetingPlatformName, proposedDate);
    plainText = parsed.plain_text || buildFallbackPlain(managerName, agencyName, city, meetingLink, meetingPlatformName, proposedDate);
  } else {
    subject = `🏢 ${managerName}, ¿tu agencia responde leads en WhatsApp a las 3 AM?`;
    htmlBody = buildFallbackHtml(managerName, agencyName, city, meetingLink, meetingPlatformName, proposedDate);
    plainText = buildFallbackPlain(managerName, agencyName, city, meetingLink, meetingPlatformName, proposedDate);
  }

  // Actualizar estado en Supabase (no-fail)
  if (prospectId !== "local") {
    try {
      await supabaseAdmin
        .from("b2b_agency_prospects")
        .update({ outreach_status: "EMAIL_ENVIADO", last_contacted_at: new Date().toISOString(), meeting_link: meetingLink })
        .eq("id", prospectId);
    } catch (e) {
      console.warn("[b2b/invite] update warn:", e);
    }
  }

  return res.status(200).json({
    success: true,
    to: targetEmail,
    subject,
    html_body: htmlBody,
    plain_text: plainText,
    meeting_link: meetingLink,
    meeting_platform: meetingPlatformName,
  });
}

function buildFallbackPlain(name: string, agency: string, city: string, link: string, platform: string, date: string) {
  return `Hola ${name},\n\n¿Tu equipo pierde leads porque nadie responde el WhatsApp después de las 6 PM?\n\nProperty OS resuelve esto con Sofía IA: califica leads en WhatsApp 24/7, genera contratos digitales y analiza el mercado de ${city} con IA.\n\nDemo en ${platform} — ${date}\n🔗 ${link}\n\nEquipo Property OS\nhttps://property-app-ashen.vercel.app`;
}

function buildFallbackHtml(name: string, agency: string, city: string, link: string, platform: string, date: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f9f9f9;margin:0;padding:30px 0"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:#0B0D12;padding:28px 40px;text-align:center"><h1 style="color:#D4AF37;font-size:22px;margin:0;font-weight:900">Property OS</h1><p style="color:#94A3B8;font-size:12px;margin:6px 0 0">CRM Inmobiliario con Inteligencia Artificial</p></td></tr><tr><td style="padding:40px"><p style="color:#1E293B;font-size:16px;margin:0 0 20px">Hola <strong>${name}</strong>,</p><p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px">¿Tu equipo pierde leads porque nadie responde el WhatsApp después de las 6 PM?</p><ul style="color:#475569;font-size:15px;line-height:1.9;padding-left:20px;margin:0 0 24px"><li>🤖 <strong>Sofía IA</strong> — Califica leads en WhatsApp 24/7</li><li>📄 <strong>Contratos Digitales</strong> — Firma en minutos</li><li>📊 <strong>Análisis CMA con IA</strong> — Mercado de ${city} en tiempo real</li></ul><div style="text-align:center;margin-bottom:32px"><a href="${link}" style="display:inline-block;background:#D4AF37;color:#0B0D12;font-weight:900;font-size:15px;padding:16px 40px;border-radius:10px;text-decoration:none">📅 Demo en ${platform} — ${date}</a></div><p style="color:#94A3B8;font-size:13px;margin:0">Equipo Comercial Property OS<br><a href="https://property-app-ashen.vercel.app" style="color:#D4AF37">property-app-ashen.vercel.app</a></p></td></tr></table></td></tr></table></body></html>`;
}

// ─── ACTION: CONVERT ─────────────────────────────────────────────────────────

async function handleConvert(req: VercelRequest, res: VercelResponse) {
  const { prospectId } = req.body as { prospectId: string };

  if (!prospectId) {
    return res.status(400).json({ error: "prospectId es obligatorio." });
  }

  const { data: prospect, error: fetchError } = await supabaseAdmin
    .from("b2b_agency_prospects")
    .select("*")
    .eq("id", prospectId)
    .single();

  if (fetchError || !prospect) {
    return res.status(404).json({ error: "Prospecto no encontrado." });
  }

  const { data: newOrg, error: orgError } = await supabaseAdmin
    .from("organizations")
    .insert({
      name: prospect.agency_name,
      primary_city: prospect.city,
      ai_config: {
        primary_city: prospect.city,
        tone: "PROFESSIONAL_WARM",
        modules: {
          module_sofia_ia: true,
          module_bant_kanban: true,
          module_social_marketing: false,
          module_legal_audit: true,
          module_contract_generator: true,
        },
        source: "B2B_PROSPECT_CONVERSION",
        converted_from_prospect_id: prospectId,
        manager_name: prospect.manager_name,
        manager_email: prospect.email_official || prospect.email_personal,
      },
    })
    .select()
    .single();

  if (orgError || !newOrg) {
    return res.status(500).json({ error: `Error creando organización: ${orgError?.message}` });
  }

  await supabaseAdmin
    .from("b2b_agency_prospects")
    .update({
      outreach_status: "CONVERTIDO",
      updated_at: new Date().toISOString(),
      notes: `${prospect.notes || ""} | Convertido el ${new Date().toLocaleDateString("es-BO")} — Org ID: ${newOrg.id}`,
    })
    .eq("id", prospectId);

  return res.status(200).json({
    success: true,
    message: `${prospect.agency_name} convertida a inmobiliaria activa en Property OS.`,
    organization: { id: newOrg.id, name: newOrg.name, city: prospect.city },
  });
}
