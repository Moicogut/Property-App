import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Inicializar cliente Supabase con resguardo de variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Healthcheck para verificaciones GET
  if (req.method === "GET") {
    return res.status(200).json({ status: "WEBHOOK_ACTIVE", system: "Property OS" });
  }

  if (req.method === "POST") {
    // 1. Responder HTTP 200 inmediatamente a Evolution API para evitar timeouts
    res.status(200).json({ status: "EVENT_RECEIVED" });

    try {
      const body = req.body;
      console.log("📥 [PAYLOAD RECEIVED]:", JSON.stringify(body));

      const data = body?.data;
      if (!data) return;

      const key = data?.key;
      const remoteJid = key?.remoteJid || "";
      const rawPhone = remoteJid.split("@")[0].split(":")[0]; // Limpiar sufijos :3@s.whatsapp.net

      if (!rawPhone || rawPhone.includes("g.us")) {
        // Ignorar mensajes de grupos o sin número válido
        return;
      }

      // Extraer el texto independientemente del tipo de formato enviado por WhatsApp
      const messageText =
        data?.message?.conversation ||
        data?.message?.extendedTextMessage?.text ||
        data?.message?.imageMessage?.caption ||
        "";

      const pushName = data?.pushName || "Cliente WhatsApp";

      if (!messageText) return;

      console.log(`💬 Procesando lead: ${pushName} (${rawPhone}) - Mensaje: "${messageText}"`);

      // 2. Insertar o actualizar Lead en Supabase
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", rawPhone)
        .maybeSingle();

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

        if (insertError) {
          console.error("❌ [Supabase Insert Error]:", insertError.message);
        } else {
          console.log(`✅ [Supabase] Nuevo Lead registrado correctamente: ${pushName}`);
        }
      } else {
        const { error: updateError } = await supabase
          .from("leads")
          .update({
            requirements: messageText,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingLead.id);

        if (updateError) {
          console.error("❌ [Supabase Update Error]:", updateError.message);
        } else {
          console.log(`🔄 [Supabase] Lead actualizado ID: ${existingLead.id}`);
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      console.error("❌ [Webhook Fatal Error]:", msg);
    }
    return;
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}