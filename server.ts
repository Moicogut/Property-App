import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { processWebhookMessage } from "./api/whatsapp/webhook";
import { supabaseServer } from "./src/lib/supabase-server";
import { EmbeddingFactory } from "./src/lib/embeddings";

const PORT = process.env.PORT || 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. API Health Check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "online",
      system: "Property OS V2 - Real Estate AI CRM & RAG",
      evolutionApiStatus: "CONNECTED",
      pgvectorEngine: "READY (768d)",
    });
  });

  // 2. WhatsApp Evolution API Webhook Endpoint
  app.post("/api/whatsapp/webhook", async (req: Request, res: Response): Promise<void> => {
    try {
      const apiKey = req.headers["apikey"] || req.headers["x-api-key"] || req.query.apikey || req.headers["authorization"]?.toString().replace("Bearer ", "");
      const expectedKey = process.env.WEBHOOK_SECRET || process.env.EVOLUTION_API_KEY;

      if (process.env.NODE_ENV === "development") {
        console.log("[Server Dev] Webhook recibido con Key:", apiKey);
      } else if (expectedKey && apiKey !== expectedKey) {
        console.warn("[Server] ❌ Webhook request with invalid API Key rejected.");
        res.status(401).json({ error: "Unauthorized" });
        return;
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

  // 3. API Leads GET / POST (Supabase)
  app.get("/api/leads", async (_req: Request, res: Response) => {
    try {
      const { data, error } = await supabaseServer
        .from("leads")
        .select(`*, matchedProperty:properties(*)`)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      res.json({ success: true, count: data?.length || 0, leads: data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching leads";
      res.status(500).json({ success: false, error: msg });
    }
  });

  app.post("/api/leads", async (req: Request, res: Response) => {
    try {
      const { data: orgs } = await supabaseServer.from("organizations").select("id").limit(1);
      const orgId = orgs?.[0]?.id || null;

      const { data, error } = await supabaseServer
        .from("leads")
        .insert({
          organization_id: orgId,
          ...req.body
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json({ success: true, lead: data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating lead";
      res.status(500).json({ success: false, error: msg });
    }
  });

  // 3.1 API Admin Create / Upsert Agency User
  app.post("/api/admin/create-user", async (req: Request, res: Response) => {
    try {
      const { email, password, fullName, role, organizationId } = req.body;
      if (!email || !password || !organizationId) {
        res.status(400).json({ error: "Faltan datos obligatorios." });
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName?.trim() || "Administrador Inmobiliario";
      const userRole = role || "agency_admin";

      let authUserId: string | null = null;
      try {
        const { data: created, error: createErr } = await supabaseServer.auth.admin.createUser({
          email: cleanEmail,
          password: password.trim(),
          email_confirm: true,
          user_metadata: {
            full_name: cleanName,
            role: userRole,
            organization_id: organizationId,
          },
        });

        if (createErr) {
          const { data: existing } = await supabaseServer.auth.admin.listUsers();
          const found = existing?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
          if (found) {
            authUserId = found.id;
            await supabaseServer.auth.admin.updateUserById(found.id, {
              password: password.trim(),
              email_confirm: true,
              user_metadata: {
                full_name: cleanName,
                role: userRole,
                organization_id: organizationId,
              },
            });
          }
        } else if (created?.user) {
          authUserId = created.user.id;
        }
      } catch (authErr) {
        console.warn("[Server] Auth admin warning:", authErr);
      }

      const { data: dbUser, error: dbError } = await supabaseServer
        .from("users")
        .upsert(
          {
            ...(authUserId ? { id: authUserId } : {}),
            email: cleanEmail,
            full_name: cleanName,
            role: userRole,
            organization_id: organizationId,
            user_type: "REAL_ESTATE_AGENCY",
          },
          { onConflict: "email" }
        )
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);
      res.json({ success: true, user: dbUser });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating user";
      res.status(500).json({ success: false, error: msg });
    }
  });

  // 4. API Properties GET / POST (Supabase + Vector Embedding)
  app.get("/api/properties", async (_req: Request, res: Response) => {
    try {
      const { data, error } = await supabaseServer
        .from("properties")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw new Error(error.message);
      res.json({ success: true, count: data?.length || 0, properties: data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error fetching properties";
      res.status(500).json({ success: false, error: msg });
    }
  });

  app.post("/api/properties", async (req: Request, res: Response) => {
    try {
      const { data: orgs } = await supabaseServer.from("organizations").select("id").limit(1);
      const orgId = orgs?.[0]?.id || null;

      const body = req.body;
      let embeddingStr = null;

      if (body.rawDescription) {
        try {
          const provider = await EmbeddingFactory.getProvider();
          const vector = await provider.generateEmbedding(body.rawDescription);
          embeddingStr = JSON.stringify(vector);
        } catch (embedErr) {
          console.warn("[Server] No se pudo generar embedding:", embedErr);
        }
      }

      const payload = {
        organization_id: orgId,
        title: body.title,
        city: body.city,
        zone: body.zone,
        price_usd: body.priceUsd,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        area_sqm: body.areaSqm,
        accepts_social_housing: body.acceptsSocialHousing,
        status: body.status || "AVAILABLE",
        raw_description: body.rawDescription,
        image_url: body.imageUrl,
        ...(embeddingStr && { embedding: embeddingStr })
      };

      const { data, error } = await supabaseServer
        .from("properties")
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error(error.message);
      res.json({ success: true, property: data });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error adding property";
      res.status(500).json({ success: false, error: msg });
    }
  });

  // 5. Vite Middleware Setup (Frontend)
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

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Property OS V2 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
