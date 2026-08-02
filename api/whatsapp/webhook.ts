import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Manejo de petición GET (Health Check)
  if (req.method === "GET") {
    return res.status(200).json({ status: "WEBHOOK_ACTIVE", service: "Property OS" });
  }

  // Manejo de petición POST (Mensajes entrantes de Evolution API)
  if (req.method === "POST") {
    console.log("📥 [WEBHOOK ENTRY] Body received:", JSON.stringify(req.body));

    // Validar API Key si existe en variables de entorno
    const expectedKey = process.env.EVOLUTION_API_KEY;
    if (expectedKey) {
      const incomingKey =
        (req.headers["apikey"] as string) ||
        (req.headers["x-api-key"] as string) ||
        req.headers["authorization"]?.toString().replace("Bearer ", "");

      if (incomingKey && incomingKey !== expectedKey) {
        console.warn(`[Webhook] ❌ API Key inválida. Recibida: "${incomingKey}"`);
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    // Responder 200 OK inmediatamente
    res.status(200).json({ status: "EVENT_RECEIVED" });

    // Procesamiento en background
    try {
      const messageText =
        req.body?.data?.message?.conversation ||
        req.body?.data?.message?.extendedTextMessage?.text;
      const sender = req.body?.data?.key?.remoteJid;

      if (messageText) {
        console.log(`💬 [Webhook] Mensaje de ${sender}: "${messageText}"`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal Error";
      console.error("[Webhook] ❌ Error procesando mensaje:", message);
    }
    return;
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}