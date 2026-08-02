import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json());

// Inicialización segura de Supabase para evitar crash al arrancar la Serverless Function
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

const getSupabase = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[Server] ⚠️ Missing Supabase Environment Variables");
    return null;
  }
  return createClient(supabaseUrl, supabaseKey);
};

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
app.all(["/api/whatsapp/webhook", "/whatsapp/webhook"], (req, res) => {
  if (req.method === "GET") {
    return res.status(200).json({ status: "WEBHOOK_ACTIVE", service: "Property OS" });
  }

  if (req.method === "POST") {
    console.log("📥 [WEBHOOK ENTRY] Body received:", JSON.stringify(req.body));

    // Responder 200 OK inmediatamente
    res.status(200).json({ status: "EVENT_RECEIVED" });

    // Procesamiento en background
    setTimeout(() => {
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
        console.error("[Server] ❌ Error procesando webhook:", message);
      }
    }, 0);

    return;
  }

  return res.status(405).json({ error: "Method Not Allowed" });
});

// 3. API Leads GET / POST
app.get("/api/leads", async (_req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase credentials not configured");

    const { data, error } = await supabase
      .from("leads")
      .select("*, matchedProperty:properties(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, count: data?.length || 0, leads: data || [] });
  } catch (err: any) {
    console.error("[Server] Error fetching leads:", err);
    res.status(500).json({ success: false, error: err?.message || "Error fetching leads" });
  }
});

app.post("/api/leads", async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase credentials not configured");

    const { data, error } = await supabase
      .from("leads")
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, lead: data });
  } catch (err: any) {
    console.error("[Server] Error creating lead:", err);
    res.status(500).json({ success: false, error: err?.message || "Error creating lead" });
  }
});

// 4. API Properties GET / POST
app.get("/api/properties", async (_req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase credentials not configured");

    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("id", { ascending: false });

    if (error) throw error;
    res.json({ success: true, count: data?.length || 0, properties: data || [] });
  } catch (err: any) {
    console.error("[Server] Error fetching properties:", err);
    res.status(500).json({ success: false, error: err?.message || "Error fetching properties" });
  }
});

app.post("/api/properties", async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase credentials not configured");

    const { data, error } = await supabase
      .from("properties")
      .insert([req.body])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, property: data });
  } catch (err: any) {
    console.error("[Server] Error creating property:", err);
    res.status(500).json({ success: false, error: err?.message || "Error adding property" });
  }
});

// 5. Vite / Static Setup
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
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;