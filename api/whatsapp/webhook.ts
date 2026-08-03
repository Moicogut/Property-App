import type { IncomingMessage, ServerResponse } from "http";
import { createClient } from "@supabase/supabase-js";

// Inicializar cliente Supabase con resguardo de variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse & { status?: (code: number) => any; json?: (body: unknown) => any }) {
  // Compatibilidad con vercel serverless o uso directo
  const sendJson = (statusCode: number, body: unknown) => {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };

  if (req.method === "GET") {
    return sendJson(200, { status: "WEBHOOK_ACTIVE", system: "Property OS" });
  }

  if (req.method === "POST") {
    sendJson(200, { status: "EVENT_RECEIVED" });

    try {
      const body = req.body as Record<string, unknown> | undefined;
      console.log("📥 [PAYLOAD RECEIVED]:", JSON.stringify(body));

      const data = body?.data as Record<string, unknown> | undefined;
      if (!data) return;

      const key = data?.key as Record<string, unknown> | undefined;
      const remoteJid = (key?.remoteJid as string) || "";
      const rawPhone = remoteJid.split("@")[0].split(":")[0];

      if (!rawPhone || rawPhone.includes("g.us")) return;

      const messageData = data?.message as Record<string, unknown> | undefined;
      const messageText: string =
        (messageData?.conversation as string) ||
        ((messageData?.extendedTextMessage as Record<string, unknown>)?.text as string) ||
        ((messageData?.imageMessage as Record<string, unknown>)?.caption as string) ||
        "";

      const pushName = (data?.pushName as string) || "Cliente WhatsApp";

      if (!messageText) return;

      console.log(`💬 Procesando lead: ${pushName} (${rawPhone}) - Mensaje: "${messageText}"`);

      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", rawPhone)
        .maybeSingle();

      if (!existingLead) {
        const { error: insertError } = await supabase.from("leads").insert([{
          name: pushName,
          phone: rawPhone,
          status: "NUEVO",
          requirements: messageText,
          ai_agent_active: true,
          created_at: new Date().toISOString()
        }]);
        if (insertError) {
          console.error("❌ [Supabase Insert Error]:", insertError.message);
        } else {
          console.log(`✅ [Supabase] Nuevo Lead registrado: ${pushName}`);
        }
      } else {
        const { error: updateError } = await supabase
          .from("leads")
          .update({ requirements: messageText, updated_at: new Date().toISOString() })
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

  return sendJson(405, { error: "Method Not Allowed" });
}