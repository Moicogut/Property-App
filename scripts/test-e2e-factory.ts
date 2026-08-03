import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { supabaseServer } from "../src/lib/supabase-server";
import { EmbeddingFactory } from "../src/lib/embeddings";

async function runFactoryTest() {
  console.log("🚀 Iniciando prueba E2E Factory (Gemini vs OpenAI en 768d)");

  try {
    const text = "Prueba de dimensión dinámica";
    
    // --- 1. PRUEBA GEMINI ---
    console.log("\n🔄 1️⃣ Forzando configuración a GEMINI...");
    await supabaseServer.from("app_config").update({ embedding_provider: "gemini" }).eq("id", "d5910fae-6003-4d43-8581-229ef5e0e0f3"); // Se ignora where si la BD tiene 1 solo (pero mejor hacer update sin where usando RPC o asumiendo el existente)
    // Para asegurar el update general:
    await supabaseServer.from("app_config").update({ embedding_provider: "gemini", embedding_model: "text-embedding-004" }).neq("id", "00000000-0000-0000-0000-000000000000"); 

    const geminiProvider = await EmbeddingFactory.getProvider(true);
    console.log(`Proveedor activo: ${geminiProvider.providerName}`);
    
    if (geminiProvider.providerName !== "gemini") {
      throw new Error(`Se esperaba 'gemini', pero Factory retornó '${geminiProvider.providerName}'`);
    }

    const vectorGemini = await geminiProvider.generateEmbedding(text);
    console.log(`Dimensión retornada por Gemini: ${vectorGemini.length}d`);
    
    if (vectorGemini.length !== 768) {
      throw new Error(`Gemini devolvió ${vectorGemini.length}d en lugar de 768d`);
    }
    console.log("✅ Gemini Check Passed.");

    // --- 2. PRUEBA OPENAI ---
    console.log("\n🔄 2️⃣ Forzando configuración a OPENAI...");
    await supabaseServer.from("app_config").update({ embedding_provider: "openai", embedding_model: "text-embedding-3-small" }).neq("id", "00000000-0000-0000-0000-000000000000");

    const openaiProvider = await EmbeddingFactory.getProvider(true);
    console.log(`Proveedor activo: ${openaiProvider.providerName}`);

    if (openaiProvider.providerName !== "openai") {
      throw new Error(`Se esperaba 'openai', pero Factory retornó '${openaiProvider.providerName}'`);
    }

    const vectorOpenai = await openaiProvider.generateEmbedding(text);
    console.log(`Dimensión retornada por OpenAI: ${vectorOpenai.length}d`);

    if (vectorOpenai.length !== 768) {
      throw new Error(`OpenAI devolvió ${vectorOpenai.length}d en lugar de 768d`);
    }
    console.log("✅ OpenAI Check Passed.");

    // --- 3. RESTAURAR GEMINI ---
    console.log("\n🔄 3️⃣ Restaurando configuración a GEMINI (Default)...");
    await supabaseServer.from("app_config").update({ embedding_provider: "gemini", embedding_model: "text-embedding-004" }).neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("\n✅ Test de Conmutación de Factory Superado con éxito.");

  } catch (err: unknown) {
    console.error("❌ FAILED E2E Factory Test:");
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

runFactoryTest();
