/**
 * api/admin/b2b.ts
 * Handler unificado para el módulo B2B Agency Prospecting.
 * Routing por campo `action` en el body para respetar el límite de
 * 12 Serverless Functions del plan Hobby de Vercel.
 *
 * Actions disponibles:
 *   - "search"   → Escanea agencias reales con Google Places API
 *   - "enrich"   → Scrapea website de un prospecto para extraer email/WhatsApp
 *   - "invite"   → Genera correo ejecutivo de invitación a demo (OpenAI)
 *   - "convert"  → Convierte prospecto a organización activa (tenant)
 *   - "list"     → Lista todos los prospectos de Supabase
 *   - "delete_ai"→ Borra prospectos generados por IA (data_source = AI_GENERATED)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Coordenadas de ciudades bolivianas para Google Places ──────────────────────
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Santa Cruz": { lat: -17.7833, lng: -63.1821 },
  "La Paz": { lat: -16.5, lng: -68.15 },
  Cochabamba: { lat: -17.3895, lng: -66.1568 },
  Oruro: { lat: -17.9667, lng: -67.1167 },
  Potosí: { lat: -19.5836, lng: -65.7531 },
  Sucre: { lat: -19.0196, lng: -65.2627 },
  Trinidad: { lat: -14.8333, lng: -64.9 },
  Tarija: { lat: -21.5355, lng: -64.7296 },
};

// ── DATA QUALITY SCORE ────────────────────────────────────────────────────────

function calcQualityScore(prospect: {
  phone_official?: string | null;
  website_url?: string | null;
  web_status?: string | null;
  email_official?: string | null;
  manager_name?: string | null;
}): number {
  let score = 0;
  if (prospect.phone_official) score += 25;
  if (prospect.website_url && prospect.web_status === "ACTIVE") score += 25;
  else if (prospect.website_url) score += 10; // web exists but not validated yet
  if (prospect.email_official) score += 25;
  if (prospect.manager_name) score += 25;
  return score;
}

// ── MAIN ROUTER ────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action } = req.body as { action?: string };

  if (!action) {
    return res
      .status(400)
      .json({ error: "Campo 'action' requerido" });
  }

  try {
    switch (action) {
      case "search":
        return await handleSearch(req, res);
      case "enrich":
        return await handleEnrich(req, res);
      case "invite":
        return await handleInvite(req, res);
      case "convert":
        return await handleConvert(req, res);
      case "list":
        return await handleList(req, res);
      case "delete_ai":
        return await handleDeleteAI(req, res);
      default:
        return res.status(400).json({ error: `Action '${action}' no reconocida.` });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error(`[api/admin/b2b] Error en action='${action}':`, error);
    return res.status(500).json({ error: msg });
  }
}

// ── ACTION: LIST ──────────────────────────────────────────────────────────────

async function handleList(req: VercelRequest, res: VercelResponse) {
  const { limit = 500 } = req.body as { limit?: number };
  const { data, error } = await supabaseAdmin
    .from("b2b_agency_prospects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Number(limit));

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ success: true, prospects: data || [], total: (data || []).length });
}

// ── ACTION: DELETE AI GENERATED ───────────────────────────────────────────────

async function handleDeleteAI(_req: VercelRequest, res: VercelResponse) {
  const { error, count } = await supabaseAdmin
    .from("b2b_agency_prospects")
    .delete({ count: "exact" })
    .eq("data_source", "AI_GENERATED");

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, deleted: count });
}

// ── ACTION: SEARCH (Google Places API) ───────────────────────────────────────

async function handleSearch(req: VercelRequest, res: VercelResponse) {
  const {
    city = "Santa Cruz",
    limit = 15,
  } = req.body as { city?: string; limit?: number };

  const googleKey = process.env.GOOGLE_PLACES_API_KEY;

  // ── Fallback a muestra si no hay API key ────────────────────────────────
  if (!googleKey) {
    return res.status(200).json({
      success: true,
      prospects: [],
      total: 0,
      source: "NO_API_KEY",
      error:
        "GOOGLE_PLACES_API_KEY no configurada. Agrega la variable en Vercel Environment Variables.",
    });
  }

  const coords = CITY_COORDS[city] || CITY_COORDS["Santa Cruz"];

  // ── Step 1: Google Places Text Search ──────────────────────────────────
  const query = `agencias inmobiliarias ${city} Bolivia`;
  const textSearchUrl =
    `https://maps.googleapis.com/maps/api/place/textsearch/json` +
    `?query=${encodeURIComponent(query)}` +
    `&location=${coords.lat},${coords.lng}` +
    `&radius=20000` +
    `&language=es` +
    `&key=${googleKey}`;

  const searchRes = await fetch(textSearchUrl);
  const searchData = (await searchRes.json()) as {
    status: string;
    results: Array<{
      place_id: string;
      name: string;
      formatted_address: string;
      rating?: number;
      user_ratings_total?: number;
      geometry: { location: { lat: number; lng: number } };
    }>;
    error_message?: string;
  };

  if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
    return res.status(502).json({
      error: `Google Places error: ${searchData.status} — ${searchData.error_message || ""}`,
    });
  }

  const places = (searchData.results || []).slice(0, Math.min(Number(limit), 20));

  if (places.length === 0) {
    return res.status(200).json({
      success: true,
      prospects: [],
      total: 0,
      source: "GOOGLE_PLACES",
    });
  }

  // ── Step 2: Place Details en paralelo (teléfono + website) ─────────────
  const detailFields = "name,formatted_phone_number,international_phone_number,website,formatted_address,vicinity";
  const detailPromises = places.map((place) =>
    fetch(
      `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${place.place_id}` +
        `&fields=${detailFields}` +
        `&language=es` +
        `&key=${googleKey}`
    )
      .then((r) => r.json())
      .then((d: { result?: Record<string, string | undefined>; status: string }) => ({
        place,
        detail: d.result || {},
      }))
      .catch(() => ({ place, detail: {} }))
  );

  const detailResults = await Promise.all(detailPromises);

  // ── Step 3: Construir prospectos con datos reales ──────────────────────
  const prospects = detailResults.map(({ place, detail }) => {
    const phone =
      (detail.international_phone_number as string | undefined) ||
      (detail.formatted_phone_number as string | undefined) ||
      null;
    const website = (detail.website as string | undefined) || null;
    const address =
      (detail.formatted_address as string | undefined) ||
      place.formatted_address ||
      null;

    const qualityScore = calcQualityScore({
      phone_official: phone,
      website_url: website,
      web_status: "UNVERIFIED",
      email_official: null,
      manager_name: null,
    });

    return {
      agency_name: place.name,
      city,
      zone: extractZoneFromAddress(address || "", city),
      address,
      website_url: website,
      phone_official: phone,
      whatsapp_contact: null as string | null,
      manager_name: null as string | null,
      manager_role: null as string | null,
      email_official: null as string | null,
      email_personal: null as string | null,
      linkedin_url: null as string | null,
      place_id: place.place_id,
      google_rating: place.rating || null,
      google_reviews: place.user_ratings_total || null,
      web_status: website ? "UNVERIFIED" : "NONE",
      web_http_status: null as number | null,
      data_source: "GOOGLE_PLACES",
      data_quality_score: qualityScore,
      enrichment_status: "PARTIAL" as const,
      outreach_status: "NUEVO" as const,
    };
  });

  // ── Step 4: Upsert a Supabase (dedup por place_id) ─────────────────────
  const { error: upsertError } = await supabaseAdmin
    .from("b2b_agency_prospects")
    .upsert(prospects, { onConflict: "place_id", ignoreDuplicates: false });

  if (upsertError) {
    console.warn("[b2b/search] Upsert warn:", upsertError.message);
  }

  // ── Step 5: Traer los IDs recién insertados para devolverlos completos ──
  const { data: savedProspects } = await supabaseAdmin
    .from("b2b_agency_prospects")
    .select("*")
    .in("place_id", prospects.map((p) => p.place_id).filter(Boolean))
    .order("created_at", { ascending: false });

  return res.status(200).json({
    success: true,
    prospects: savedProspects || prospects,
    total: prospects.length,
    source: "GOOGLE_PLACES",
    stats: {
      with_website: prospects.filter((p) => p.website_url).length,
      with_phone: prospects.filter((p) => p.phone_official).length,
    },
  });
}

// ── HELPER: Extraer zona de la dirección ─────────────────────────────────────

function extractZoneFromAddress(address: string, city: string): string {
  // Intenta extraer el barrio/zona de una dirección boliviana
  if (!address) return "";
  const cleaned = address
    .replace(city, "")
    .replace("Bolivia", "")
    .replace(/,+/g, ",")
    .trim();
  const parts = cleaned.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[0] || "";
}

// ── ACTION: ENRICH (Scraping de website para email + WhatsApp) ────────────────

async function handleEnrich(req: VercelRequest, res: VercelResponse) {
  const { prospectId } = req.body as { prospectId: string };

  if (!prospectId) {
    return res.status(400).json({ error: "prospectId es obligatorio" });
  }

  const { data: prospect, error: fetchError } = await supabaseAdmin
    .from("b2b_agency_prospects")
    .select("id, website_url, agency_name")
    .eq("id", prospectId)
    .single();

  if (fetchError || !prospect) {
    return res.status(404).json({ error: "Prospecto no encontrado" });
  }

  if (!prospect.website_url) {
    // Sin web: solo actualizar estado
    await supabaseAdmin
      .from("b2b_agency_prospects")
      .update({
        web_status: "NONE",
        scrape_attempted_at: new Date().toISOString(),
      })
      .eq("id", prospectId);
    return res.status(200).json({
      success: true,
      email: null,
      whatsapp: null,
      web_status: "NONE",
      message: "Sin sitio web registrado",
    });
  }

  // ── Scrape ────────────────────────────────────────────────────────────
  const scraped = await scrapeWebsite(prospect.website_url);

  // ── Calcular data_quality_score actualizado ───────────────────────────
  const { data: fullProspect } = await supabaseAdmin
    .from("b2b_agency_prospects")
    .select("phone_official, manager_name")
    .eq("id", prospectId)
    .single();

  const newScore = calcQualityScore({
    phone_official: fullProspect?.phone_official,
    website_url: prospect.website_url,
    web_status: scraped.webStatus,
    email_official: scraped.email,
    manager_name: fullProspect?.manager_name,
  });

  // ── Persistir resultados ──────────────────────────────────────────────
  const { error: updateError } = await supabaseAdmin
    .from("b2b_agency_prospects")
    .update({
      email_official: scraped.email,
      whatsapp_contact: scraped.whatsapp,
      web_status: scraped.webStatus,
      web_http_status: scraped.httpStatus,
      data_quality_score: newScore,
      enrichment_status: scraped.email ? "ENRICHED" : "PARTIAL",
      scrape_attempted_at: new Date().toISOString(),
    })
    .eq("id", prospectId);

  if (updateError) {
    console.warn("[b2b/enrich] update warn:", updateError.message);
  }

  return res.status(200).json({
    success: true,
    email: scraped.email,
    whatsapp: scraped.whatsapp,
    web_status: scraped.webStatus,
    http_status: scraped.httpStatus,
    data_quality_score: newScore,
  });
}

// ── SCRAPER DE WEBSITE ────────────────────────────────────────────────────────

async function scrapeWebsite(url: string): Promise<{
  email: string | null;
  whatsapp: string | null;
  webStatus: "ACTIVE" | "BROKEN" | "NONE";
  httpStatus: number | null;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PropertyOS-Bot/1.0; +https://property-app-ashen.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { email: null, whatsapp: null, webStatus: "BROKEN", httpStatus: response.status };
    }

    const html = await response.text();

    // ── Extraer emails (excluir genéricos y de librerías) ────────────────
    const emailRegex = /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}\b/g;
    const allEmails = html.match(emailRegex) || [];
    const EMAIL_BLACKLIST = [
      "example.com", "test.com", "sentry.io", "w3.org", "schema.org",
      "wordpress.org", "jquery.com", "googleapis.com", "cloudflare.com",
    ];
    const email =
      allEmails.find(
        (e) =>
          !EMAIL_BLACKLIST.some((b) => e.includes(b)) &&
          !e.startsWith("example") &&
          !e.startsWith("info@example") &&
          e.length < 80
      ) || null;

    // ── Extraer WhatsApp ──────────────────────────────────────────────────
    const waPatterns = [
      /wa\.me\/(\+?[\d\s\-\(\)]{7,15})/,
      /api\.whatsapp\.com\/send\?phone=([\d\+]{7,15})/,
      /whatsapp[^"']*?(\+?591[\d]{7,9})/i,
    ];
    let whatsapp: string | null = null;
    for (const pat of waPatterns) {
      const m = html.match(pat);
      if (m?.[1]) {
        whatsapp = m[1].replace(/\s/g, "");
        if (!whatsapp.startsWith("+")) whatsapp = `+${whatsapp}`;
        break;
      }
    }

    return { email, whatsapp, webStatus: "ACTIVE", httpStatus: response.status };
  } catch (err: unknown) {
    const isTimeout =
      err instanceof Error && (err.name === "AbortError" || err.message.includes("abort"));
    return {
      email: null,
      whatsapp: null,
      webStatus: isTimeout ? "BROKEN" : "BROKEN",
      httpStatus: null,
    };
  }
}

// ── ACTION: INVITE (correo individual) ───────────────────────────────────────

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
    htmlBody =
      parsed.html_body ||
      buildFallbackHtml(
        managerName,
        agencyName,
        city,
        meetingLink,
        meetingPlatformName,
        proposedDate
      );
    plainText =
      parsed.plain_text ||
      buildFallbackPlain(
        managerName,
        agencyName,
        city,
        meetingLink,
        meetingPlatformName,
        proposedDate
      );
  } else {
    subject = `🏢 ${managerName}, ¿tu agencia responde leads en WhatsApp a las 3 AM?`;
    htmlBody = buildFallbackHtml(
      managerName,
      agencyName,
      city,
      meetingLink,
      meetingPlatformName,
      proposedDate
    );
    plainText = buildFallbackPlain(
      managerName,
      agencyName,
      city,
      meetingLink,
      meetingPlatformName,
      proposedDate
    );
  }

  if (prospectId !== "local") {
    try {
      await supabaseAdmin
        .from("b2b_agency_prospects")
        .update({
          outreach_status: "EMAIL_ENVIADO",
          last_contacted_at: new Date().toISOString(),
          meeting_link: meetingLink,
        })
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

function buildFallbackPlain(
  name: string,
  agency: string,
  city: string,
  link: string,
  platform: string,
  date: string
) {
  return `Hola ${name},\n\n¿Tu equipo pierde leads porque nadie responde el WhatsApp después de las 6 PM?\n\nProperty OS resuelve esto con Sofía IA: califica leads en WhatsApp 24/7, genera contratos digitales y analiza el mercado de ${city} con IA.\n\nDemo en ${platform} — ${date}\n🔗 ${link}\n\nEquipo Property OS\nhttps://property-app-ashen.vercel.app`;
}

function buildFallbackHtml(
  name: string,
  agency: string,
  city: string,
  link: string,
  platform: string,
  date: string
) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f9f9f9;margin:0;padding:30px 0"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:#0B0D12;padding:28px 40px;text-align:center"><h1 style="color:#D4AF37;font-size:22px;margin:0;font-weight:900">Property OS</h1><p style="color:#94A3B8;font-size:12px;margin:6px 0 0">CRM Inmobiliario con Inteligencia Artificial</p></td></tr><tr><td style="padding:40px"><p style="color:#1E293B;font-size:16px;margin:0 0 20px">Hola <strong>${name}</strong>,</p><p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 20px">¿Tu equipo pierde leads porque nadie responde el WhatsApp después de las 6 PM?</p><ul style="color:#475569;font-size:15px;line-height:1.9;padding-left:20px;margin:0 0 24px"><li>🤖 <strong>Sofía IA</strong> — Califica leads en WhatsApp 24/7</li><li>📄 <strong>Contratos Digitales</strong> — Firma en minutos</li><li>📊 <strong>Análisis CMA con IA</strong> — Mercado de ${city} en tiempo real</li></ul><div style="text-align:center;margin-bottom:32px"><a href="${link}" style="display:inline-block;background:#D4AF37;color:#0B0D12;font-weight:900;font-size:15px;padding:16px 40px;border-radius:10px;text-decoration:none">📅 Demo en ${platform} — ${date}</a></div><p style="color:#94A3B8;font-size:13px;margin:0">Equipo Comercial Property OS<br><a href="https://property-app-ashen.vercel.app" style="color:#D4AF37">property-app-ashen.vercel.app</a></p></td></tr></table></td></tr></table></body></html>`;
}

// ── ACTION: CONVERT ───────────────────────────────────────────────────────────

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
        google_place_id: prospect.place_id,
        google_rating: prospect.google_rating,
      },
    })
    .select()
    .single();

  if (orgError || !newOrg) {
    return res
      .status(500)
      .json({ error: `Error creando organización: ${orgError?.message}` });
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
