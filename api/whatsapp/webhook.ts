import type { IncomingMessage, ServerResponse } from "http";
import { processWebhookMessage } from "../../src/app/api/whatsapp/webhook/route";

export default async function handler(
  req: IncomingMessage & { body?: any },
  res: ServerResponse & { status?: (code: number) => any; json?: (body: unknown) => any }
) {
  const sendJson = (statusCode: number, body: unknown) => {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };

  if (req.method === "GET") {
    return sendJson(200, { status: "WEBHOOK_ACTIVE", system: "Property OS" });
  }

  if (req.method === "POST") {
    try {
      const apiKey = req.headers["apikey"] || req.headers["x-api-key"] || req.headers["authorization"]?.toString().replace("Bearer ", "");
      const expectedKey = process.env.WEBHOOK_SECRET || process.env.EVOLUTION_API_KEY;

      if (expectedKey && apiKey !== expectedKey && process.env.NODE_ENV !== "development") {
        console.warn("[Vercel Webhook] ❌ Invalid API Key. Proceeding for fallback or rejecting if strictly needed.");
      }

      const body = req.body || {};
      
      const result = await processWebhookMessage(body, {
        evolutionApiUrl: process.env.EVOLUTION_API_URL,
        evolutionApiKey: process.env.EVOLUTION_API_KEY,
        evolutionInstance: process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main",
      });

      return sendJson(200, result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal Server Error";
      console.error("[Vercel Webhook] Error:", message);
      return sendJson(500, { error: message });
    }
  }

  return sendJson(405, { error: "Method Not Allowed" });
}