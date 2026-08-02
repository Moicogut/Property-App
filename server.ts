import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { processWebhookMessage } from "./src/app/api/whatsapp/webhook/route";
import { supabase } from "./src/lib/supabase";

const app = express();
app.use(express.json());

// 1. API Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "online",
    system: "PROPERTY OS - Real Estate AI CRM & RAG",
    evolutionApiStatus: "CONNECTED",
    pgvectorEngine: "READY (1536d RPC)",
  });
});

// 2. WhatsApp Evolution API Webhook Endpoint - GET & POST
// Handlers universales para que funcionen con o sin el prefijo /api que añade Vercel
const handleWebhookGet = (_req: express.Request, res: express.Response) => {
  return res.status(200).json({ status: "WEBHOOK_ACTIVE", service: "Property OS" });
};

const handleWebhookPost = (req: express.Request, res: express.Response) => {
  // ── Log de entrada INMEDIATO ───────────────────────────────────────────────
  console.log("📥 [WEBHOOK ENTRY] Headers:", JSON.stringify(req.headers));
  console.log("📥 [WEBHOOK ENTRY] Raw body:", JSON.stringify(req.body));

  // Responder 200 INMEDIATAMENTE a Evolution API
  res.status(200).json({ status: "EVENT_RECEIVED" });

  // ── Procesamiento asíncrono en segundo plano ─────────────────────────────
  (async () => {
    try {
      const expectedKey = process.env.EVOLUTION_API_KEY;
      if (expectedKey) {
        const incomingKey =
          (req.headers["apikey"] as string) ||
          (req.headers["x-api-key"] as string) ||
          req.headers["authorization"]?.toString().replace("Bearer ", "");
        if (incomingKey && incomingKey !== expectedKey) {
          console.warn(
            `[Server] ❌ API Key inválida. Recibida: "${incomingKey}"`
          );
          return;
        }
      }

      const result = await processWebhookMessage(req.body, {
        evolutionApiUrl: process.env.EVOLUTION_API_URL,
        evolutionApiKey: process.env.EVOLUTION_API_KEY,
        evolutionInstance:
          process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main",
      });
      console.log(
        "[Server] ✅ Webhook procesado:",
        result.status,
        "| lead:",
        result.phoneNumber
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Internal Server Error";
      console.error("[Server] ❌ Error procesando webhook:", message);
    }
  })();
};

// Registrar ambas variantes de ruta para evitar el error 405 en Vercel
app.get(["/api/whatsapp/webhook", "/whatsapp/webhook"], handleWebhookGet);
app.post(["/api/whatsapp/webhook", "/whatsapp/webhook"], handleWebhookPost);

// 3. API Leads GET / POST (Supabase PostgreSQL)
app.get("/api/leads", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("leads")
      .select("*, matchedProperty:properties(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, count: data?.length || 0, leads: data || [] });
  } catch (err: any) {
    console.error("[Server] Error fetching leads from Supabase:", err);
    res.status(500).json({ success: false, error: err?.message || "Error fetching leads" });
  }
});

app.post("/api/leads", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("leads")
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, lead: data });
  } catch (err: any) {
    console.error("[Server] Error creating lead in Supabase:", err);
    res.status(500).json({ success: false, error: err?.message || "Error creating lead" });
  }
});

// 4. API Properties GET / POST (Supabase pgvector)
app.get("/api/properties", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;
    res.json({ success: true, count: data?.length || 0, properties: data || [] });
  } catch (err: any) {
    console.error("[Server] Error fetching properties from Supabase:", err);
    res.status(500).json({ success: false, error: err?.message || "Error fetching properties" });
  }
});

app.post("/api/properties", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("properties")
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, property: data });
  } catch (err: any) {
    console.error("[Server] Error creating property in Supabase:", err);
    res.status(500).json({ success: false, error: err?.message || "Error adding property" });
  }
});

// 5. Vite Middleware Setup (desarrollo local vs producción Vercel)
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Property OS Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;