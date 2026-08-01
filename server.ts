import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { processWebhookMessage } from "./src/app/api/whatsapp/webhook/route";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Memory Mock Store for API requests
  const memoryStore = {
    leads: [
      {
        id: "lead-1",
        fullName: "Juan Pérez",
        phoneNumber: "+591 71234567",
        pipelineStage: "NUEVO",
        budgetMaxUsd: 85000,
        paymentMethod: "CREDITO_VIS",
        hasDownPayment: true,
        downPaymentPercent: 15,
        preferredZone: "Equipetrol Norte",
        aiSummary: "Calificado: 15% aporte propio verificado BCP.",
        aiPaused: false,
        intentScore: 95
      },
      {
        id: "lead-2",
        fullName: "María Delgado",
        phoneNumber: "+591 78912345",
        pipelineStage: "EN_CALIFICACION",
        budgetMaxUsd: 120000,
        paymentMethod: "CREDITO_VIS",
        hasDownPayment: true,
        downPaymentPercent: 15,
        preferredZone: "Urubó",
        aiSummary: "Calificando crédito ASFI en Condominio Urubó.",
        aiPaused: false,
        intentScore: 72
      }
    ],
    properties: [
      {
        id: "prop-1",
        title: "Smart Tower 2D",
        city: "Santa Cruz",
        zone: "Equipetrol Norte",
        priceUsd: 82000,
        acceptsSocialHousing: true,
        status: "AVAILABLE",
        vectorIndexed: true,
        vectorDimensions: 1536
      },
      {
        id: "prop-2",
        title: "Residencia Jardines del Sur",
        city: "La Paz",
        zone: "Zona Sur",
        priceUsd: 145000,
        acceptsSocialHousing: true,
        status: "AVAILABLE",
        vectorIndexed: true,
        vectorDimensions: 1536
      }
    ]
  };

  // 1. API Health Check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "online",
      system: "PROPERTY OS - Real Estate AI CRM & RAG",
      evolutionApiStatus: "CONNECTED",
      pgvectorEngine: "READY (1536d)",
    });
  });

  // 2. WhatsApp Evolution API Webhook Endpoint
  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      // Validate API Key if configured
      const expectedKey = process.env.EVOLUTION_API_KEY;
      if (expectedKey) {
        const incomingKey = req.headers["apikey"] || req.headers["authorization"]?.toString().replace("Bearer ", "");
        if (incomingKey !== expectedKey) {
          console.warn("[Server] ❌ Webhook request with invalid API Key rejected.");
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
      }

      const result = await processWebhookMessage(req.body, {
        evolutionApiUrl: process.env.EVOLUTION_API_URL,
        evolutionApiKey: process.env.EVOLUTION_API_KEY,
        evolutionInstance: process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main",
      });
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal Server Error";
      console.error("[Server] Error in /api/whatsapp/webhook:", message);
      res.status(500).json({ error: message });
    }
  });

  // 3. API Leads GET / POST
  app.get("/api/leads", (_req, res) => {
    try {
      res.json({ success: true, count: memoryStore.leads.length, leads: memoryStore.leads });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Error processing leads" });
    }
  });

  app.post("/api/leads", (req, res) => {
    try {
      const newLead = {
        id: `lead-${Date.now()}`,
        ...req.body,
        createdAt: new Date().toISOString()
      };
      memoryStore.leads.unshift(newLead);
      res.json({ success: true, lead: newLead });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Error creating lead" });
    }
  });

  // 4. API Properties GET / POST (RAG Vectors)
  app.get("/api/properties", (_req, res) => {
    try {
      res.json({ success: true, count: memoryStore.properties.length, properties: memoryStore.properties });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Error fetching properties" });
    }
  });

  app.post("/api/properties", (req, res) => {
    try {
      const newProp = {
        id: `prop-${Date.now()}`,
        vectorIndexed: true,
        vectorDimensions: 1536,
        ...req.body
      };
      memoryStore.properties.unshift(newProp);
      res.json({ success: true, property: newProp });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Error adding property" });
    }
  });

  // 5. Vite Middleware Setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Property OS Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
