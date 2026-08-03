import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { supabaseServer } from "../src/lib/supabase-server";
import { EmbeddingFactory } from "../src/lib/embeddings";

async function runRagTest() {
  console.log("🚀 Iniciando prueba E2E RAG (Vectorial en PostgreSQL)");
  console.time("E2E_RAG_LATENCY");

  try {
    // 1. Forzamos lectura de configuración (Factory)
    const provider = await EmbeddingFactory.getProvider(true);
    console.log(`\n1️⃣ Embedding Provider Activo: ${provider.providerName} (${provider.modelName}, ${provider.dimensions}d)`);

    // 2. Generar vector para consulta de usuario
    const query = "Busco departamento con garaje en zona Equipetrol o Calacoto";
    console.log(`2️⃣ Generando vector para la frase: "${query}"`);
    const embedding = await provider.generateEmbedding(query);

    if (embedding.length !== 768) {
      throw new Error(`Dimensión incorrecta. Esperado: 768, Obtenido: ${embedding.length}`);
    }

    console.log("✅ Vector generado exitosamente (768 dimensiones).");

    // 3. Invocación RPC a match_properties
    console.log("3️⃣ Ejecutando búsqueda vectorial RPC 'match_properties' en Supabase...");
    
    const { data: matches, error } = await supabaseServer.rpc("match_properties", {
      query_embedding: JSON.stringify(embedding),
      match_threshold: 0.3,
      match_count: 3
    });

    if (error) {
      throw new Error(`Error en RPC: ${error.message}`);
    }

    console.timeEnd("E2E_RAG_LATENCY");

    // 4. Mostrar resultados
    console.log(`\n🎉 Resultados devueltos: ${matches?.length || 0}`);
    if (matches && matches.length > 0) {
      console.table(
        matches.map((m: any) => ({
          ID: m.id?.substring(0, 8),
          Title: m.title,
          Zone: m.zone,
          Price: `$${m.price_usd}`,
          Similarity: m.similarity ? m.similarity.toFixed(4) : "N/A"
        }))
      );
    } else {
      console.log("No se encontraron coincidencias bajo el threshold 0.3");
    }

  } catch (err: unknown) {
    console.error("❌ FAILED E2E RAG Test:");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

runRagTest();
