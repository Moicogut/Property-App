import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prospectId }: { prospectId: string } = req.body;

    if (!prospectId) {
      return res.status(400).json({ error: "prospectId es obligatorio." });
    }

    // 1. Obtener datos del prospecto
    const { data: prospect, error: fetchError } = await supabaseAdmin
      .from("b2b_agency_prospects")
      .select("*")
      .eq("id", prospectId)
      .single();

    if (fetchError || !prospect) {
      return res.status(404).json({ error: "Prospecto no encontrado." });
    }

    // 2. Crear la organización en la tabla organizations
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
      console.error("[convert-prospect] Error creating org:", orgError?.message);
      return res.status(500).json({ error: `Error creando organización: ${orgError?.message}` });
    }

    // 3. Actualizar el prospecto a CONVERTIDO
    await supabaseAdmin
      .from("b2b_agency_prospects")
      .update({
        outreach_status: "CONVERTIDO",
        updated_at: new Date().toISOString(),
        notes: `${prospect.notes || ""} | Convertido a tenant el ${new Date().toLocaleDateString("es-BO")} — Org ID: ${newOrg.id}`,
      })
      .eq("id", prospectId);

    return res.status(200).json({
      success: true,
      message: `${prospect.agency_name} convertida exitosamente a inmobiliaria activa en Property OS.`,
      organization: {
        id: newOrg.id,
        name: newOrg.name,
        city: prospect.city,
        manager_name: prospect.manager_name,
        manager_email: prospect.email_official || prospect.email_personal,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error converting prospect";
    console.error("[api/admin/convert-prospect] Error:", error);
    return res.status(500).json({ error: msg });
  }
}
