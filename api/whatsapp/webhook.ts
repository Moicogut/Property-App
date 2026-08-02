import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Inicializar cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ status: "WEBHOOK_ACTIVE", service: "Property OS" });
  }

  if (req.method === "POST") {
    // Validar API Key si existe
    const expectedKey = process.env.EVOLUTION_API_KEY;
    if (expectedKey) {
      const incomingKey =
        (req.headers["apikey"] as string) ||
        (req.headers["x-api-key"] as string) ||
        req.headers["authorization"]?.toString().replace("Bearer ", "");

      if (incomingKey && incomingKey !== expectedKey) {
        console.warn(`[Webhook] ❌ API Key inválida.`);
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    // Responder 200 OK inmediatamente a Evolution API
    res.status(200).json({ status: "EVENT_RECEIVED" });

    // Procesar el mensaje
    try {
      const data = req.body?.data;
      const key = data?.key;

      // Filtrar para ignorar mensajes enviados por el propio bot
      if (key?.fromMe) return;

      const messageText =
        data?.message?.conversation ||
        data?.message?.extendedTextMessage?.text;
      const rawPhone = key?.remoteJid?.split("@")[0] || "";
      const pushName = data?.pushName || "Cliente WhatsApp";

      if (!messageText || !rawPhone) return;

      console.log(`💬 [Webhook] Nuevo mensaje de ${pushName} (${rawPhone}): "${messageText}"`);

      // 1. Guardar o actualizar el Lead en Supabase
      const { data: existingLead } = await supabase
        .from("leads")
        .select("*")
        .eq("phone", rawPhone)
        .single();

      if (!existingLead) {
        await supabase.from("leads").insert([
          {
            name: pushName,
            phone: rawPhone,
            status: "NUEVO",
            requirements: messageText,
            ai_agent_active: true,
            created_at: new Date().toISOString()
          }
        ]);
        console.log(`✅ [Supabase] Nuevo lead creado para ${pushName}`);
      } else {
        await supabase
          .from("leads")
          .update({
            requirements: messageText,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingLead.id);
        console.log(`🔄 [Supabase] Lead actualizado: ${existingLead.id}`);
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal Error";
      console.error("[Webhook] ❌ Error en el procesamiento:", message);
    }
    return;
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}