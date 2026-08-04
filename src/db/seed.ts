import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { OpenAI } from "openai";
import dotenv from "dotenv";

// Load environment variables from .env.local or .env
dotenv.config({ path: ".env.local" });
dotenv.config();

// ─── Configuración de credenciales ────────────────────────────────────────────
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Error: Missing Supabase credentials in .env or .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Tipo del proveedor de embeddings activo ──────────────────────────────────
type ActiveProvider = "gemini" | "openai" | "none";

interface EmbeddingResult {
  provider: ActiveProvider;
  embedding: number[];
  dimensions: number;
}

// ─── Determinar proveedor disponible (Gemini primero, OpenAI fallback) ────────
let activeProvider: ActiveProvider = "none";
let geminiClient: GoogleGenAI | null = null;
let openaiClient: OpenAI | null = null;

if (GEMINI_KEY) {
  geminiClient = new GoogleGenAI({ 
    apiKey: GEMINI_KEY,
    httpOptions: { apiVersion: 'v1' }
  });
  activeProvider = "gemini";
  console.log("✅ Gemini API Key detectada — usando gemini-embedding-2 (768d)");
} else if (OPENAI_KEY && OPENAI_KEY !== "tu_openai_key") {
  openaiClient = new OpenAI({ apiKey: OPENAI_KEY });
  activeProvider = "openai";
  console.log("⚠️ Gemini no disponible — fallback a OpenAI text-embedding-3-small (768d)");
} else {
  console.warn("⚠️ Sin API Key de embeddings. Las propiedades se insertarán sin embedding.");
}

// ─── Generación de embedding según proveedor activo ───────────────────────────
async function generateEmbedding(text: string): Promise<EmbeddingResult | null> {
  if (activeProvider === "gemini" && geminiClient) {
    try {
      const response = await geminiClient.models.embedContent({
        model: "gemini-embedding-2",
        contents: text,
      });
      let embedding = response.embeddings?.[0]?.values;
      if (embedding && embedding.length > 768) {
        embedding = embedding.slice(0, 768);
      }
      if (!embedding) {
        console.warn("[Seed] Gemini devolvió respuesta vacía");
        return null;
      }
      return { provider: "gemini", embedding, dimensions: 768 };
    } catch (err) {
      console.warn("[Seed] Error en Gemini embedding. Usando Dummy Vector de 768d.");
      return { provider: "gemini", embedding: Array.from({ length: 768 }, () => (Math.random() - 0.5) * 0.1), dimensions: 768 };
    }
  }

  if (activeProvider === "openai" && openaiClient) {
    try {
      const response = await openaiClient.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        dimensions: 768, // Forzar 768d para compatibilidad con columna vector(768)
      });
      return { provider: "openai", embedding: response.data[0].embedding, dimensions: 768 };
    } catch (err) {
      console.warn("[Seed] Error en OpenAI embedding. Usando Dummy Vector de 768d.");
      return { provider: "openai", embedding: Array.from({ length: 768 }, () => (Math.random() - 0.5) * 0.1), dimensions: 768 };
    }
  }

  return null;
}

// ─── Catálogo de propiedades del Eje Troncal ──────────────────────────────────
const properties = [
  {
    title: "Smart Tower 2D Equipetrol",
    city: "Santa Cruz",
    zone: "Equipetrol Norte",
    priceUsd: 82000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 68.5,
    acceptsSocialHousing: true,
    status: "AVAILABLE",
    rawDescription: "Departamento moderno de 2 dormitorios en Equipetrol Norte con parqueo, balcón y cocina equipada. Califica a crédito de vivienda social VIS de ASFI.",
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Residencia Exclusiva Urubó",
    city: "Santa Cruz",
    zone: "Urubó",
    priceUsd: 350000,
    bedrooms: 4,
    bathrooms: 5,
    areaSqm: 450,
    acceptsSocialHousing: false,
    status: "AVAILABLE",
    rawDescription: "Lujosa casa en condominio cerrado en el Urubó. Cuenta con piscina privada, jardín amplio, churrasquera y acabados de lujo.",
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Oficina Corporativa Sirari",
    city: "Santa Cruz",
    zone: "Sirari",
    priceUsd: 120000,
    bedrooms: 0,
    bathrooms: 1,
    areaSqm: 55,
    acceptsSocialHousing: false,
    status: "AVAILABLE",
    rawDescription: "Oficina céntrica en el barrio Sirari, ideal para consultorios o startups. Edificio corporativo con seguridad 24/7 y parqueo de visitas.",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Penthouse Calacoto",
    city: "La Paz",
    zone: "Calacoto",
    priceUsd: 280000,
    bedrooms: 3,
    bathrooms: 4,
    areaSqm: 210,
    acceptsSocialHousing: false,
    status: "AVAILABLE",
    rawDescription: "Espectacular penthouse en Calacoto con vista panorámica. Amplias terrazas, calefacción central y excelente iluminación natural.",
    imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1e525044c7?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Departamento Familiar Obrajes",
    city: "La Paz",
    zone: "Obrajes",
    priceUsd: 95000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 110,
    acceptsSocialHousing: true,
    status: "AVAILABLE",
    rawDescription: "Acogedor departamento de 3 dormitorios en Obrajes. Cerca de colegios y transporte público. Apto para crédito de vivienda social.",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Casa Condominio Norte",
    city: "Santa Cruz",
    zone: "Zona Norte",
    priceUsd: 115000,
    bedrooms: 3,
    bathrooms: 3,
    areaSqm: 180,
    acceptsSocialHousing: true,
    status: "AVAILABLE",
    rawDescription: "Hermosa casa de 2 plantas en la Zona Norte. Condominio con áreas sociales, piscina y canchas. Se acepta financiamiento bancario VIS.",
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Loft Moderno Sopocachi",
    city: "La Paz",
    zone: "Sopocachi",
    priceUsd: 78000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 50,
    acceptsSocialHousing: false,
    status: "AVAILABLE",
    rawDescription: "Loft de diseño moderno en el corazón de Sopocachi. Ideal para solteros o parejas. Totalmente amoblado y equipado.",
    imageUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Casa Amplia Tiquipaya",
    city: "Cochabamba",
    zone: "Tiquipaya",
    priceUsd: 210000,
    bedrooms: 4,
    bathrooms: 4,
    areaSqm: 320,
    acceptsSocialHousing: false,
    status: "AVAILABLE",
    rawDescription: "Casa familiar en Tiquipaya rodeada de naturaleza. Cuenta con parrillero, amplio jardín y dependencias de servicio.",
    imageUrl: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Departamento Cala Cala",
    city: "Cochabamba",
    zone: "Cala Cala",
    priceUsd: 88000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 90,
    acceptsSocialHousing: true,
    status: "AVAILABLE",
    rawDescription: "Departamento céntrico en Cala Cala. Acceso rápido a supermercados y parques. Excelente oportunidad para crédito VIS.",
    imageUrl: "https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Lote Comercial Centro",
    city: "Santa Cruz",
    zone: "Centro",
    priceUsd: 450000,
    bedrooms: 0,
    bathrooms: 0,
    areaSqm: 600,
    acceptsSocialHousing: false,
    status: "AVAILABLE",
    rawDescription: "Excelente terreno comercial en pleno centro de la ciudad. Ideal para construcción de edificio de oficinas o centro comercial.",
    imageUrl: "https://images.unsplash.com/photo-1531971589569-0d9370cbe1e5?q=80&w=800&auto=format&fit=crop"
  }
];

// ─── Ejecución del Seed ───────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Starting seed process...");
  console.log(`📐 Embedding dimensions: 768 | Provider: ${activeProvider}`);

  // Obtener o crear organización
  const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
  let orgId = orgs?.[0]?.id;

  if (!orgId) {
    console.log("No organization found, creating one...");
    const { data: newOrg, error: insertOrgErr } = await supabase
      .from("organizations")
      .insert({ name: "Inmobiliaria Property OS" })
      .select("id")
      .single();

    if (insertOrgErr) {
      console.error("❌ Failed to create organization:", insertOrgErr.message);
      orgId = crypto.randomUUID();
    } else {
      orgId = newOrg.id;
    }
  }

  let successCount = 0;
  let embeddingCount = 0;

  for (const prop of properties) {
    let embedding: number[] | null = null;

    if (activeProvider !== "none") {
      console.log(`  🔄 Generating ${activeProvider} embedding for: ${prop.title}`);
      const result = await generateEmbedding(prop.rawDescription);
      if (result) {
        embedding = result.embedding;
        embeddingCount++;
        console.log(`  ✅ Embedding (${result.dimensions}d) generated via ${result.provider}`);
      }
    }

    const { error } = await supabase.from("properties").insert({
      organization_id: orgId,
      title: prop.title,
      city: prop.city,
      zone: prop.zone,
      price_usd: prop.priceUsd,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      area_sqm: prop.areaSqm,
      accepts_social_housing: prop.acceptsSocialHousing,
      status: prop.status,
      raw_description: prop.rawDescription,
      image_url: prop.imageUrl,
      ...(embedding && { embedding: JSON.stringify(embedding) }),
    });

    if (error) {
      console.error(`  ❌ Error inserting property ${prop.title}:`, error.message);
    } else {
      successCount++;
      console.log(`  ✅ Inserted: ${prop.title}`);
    }
  }

  console.log(`\n✨ Seeding completed: ${successCount}/${properties.length} properties inserted, ${embeddingCount} embeddings generated.`);
}

seed().catch(console.error);
