import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "";
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ status: "WEBHOOK_ACTIVE", service: "Property OS" });
  }

  if (req.method === "POST") {
    // Imprimir todo el body entrante en Vercel Logs para diagnóstico
    console.log("RAW BODY RECEIVED:", JSON.stringify(req.body, null, 2));

    res.status(200).json({ status: "EVENT_RECEIVED" });

    try {
      const data = req.body?.data;
      const key = data?.key;

      // Extraer número de teléfono y mensaje
      const rawPhone = key?.remoteJid?.split("@")[0] || "";
      const pushName = data?.pushName || "Cliente WhatsApp";
      const messageText =
        data?.message?.conversation ||
        data?.message?.extendedTextMessage?.text ||
        data?.message?.imageMessage?.caption ||
        "";

      if (!rawPhone || !messageText) {
        console.warn("[Webhook] Petición omitida: falta número o mensaje.");
        return;
      }

      console.log(`💬 Procesando mensaje de ${pushName} (${rawPhone}): "${messageText}"`);

      // Guardar o actualizar en Supabase
      const { data: existingLead, error: selectError } = await supabase
        .from("leads")
        .select("*")
        .eq("phone", rawPhone)
        .maybeSingle();

      if (selectError) {
        console.error("[Supabase Error Select]:", selectError.message);
      }

      if (!existingLead) {
        const { error: insertError } = await supabase.from("leads").insert([
          {
            name: pushName,
            phone: rawPhone,
            status: "NUEVO",
            requirements: messageText,
            ai_agent_active: true,
            created_at: new Date().toISOString()
          }
        ]);
        if (insertError) console.error("[Supabase Error Insert]:", insertError.message);
        else console.log(`✅ Lead guardado exitosamente para ${pushName}`);
      } else {
        const { error: updateError } = await supabase
          .from("leads")
          .update({
            requirements: messageText,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingLead.id);
        if (updateError) console.error("[Supabase Error Update]:", updateError.message);
        else console.log(`🔄 Lead actualizado: ${existingLead.id}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      console.error("[Webhook Error]:", msg);
    }
    return;
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}