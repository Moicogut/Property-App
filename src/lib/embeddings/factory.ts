import type { EmbeddingProvider } from "./types";
import { GeminiEmbeddingProvider } from "./gemini";
import { OpenAIEmbeddingProvider } from "./openai";
import { supabaseServer } from "../supabase-server";

// Variable global en memoria para caché del provider instanciado (solo Node.js)
let cachedProvider: EmbeddingProvider | null = null;
let cachedProviderName: string | null = null;

export class EmbeddingFactory {
  /**
   * Obtiene la instancia activa del proveedor de embeddings basado en la BD.
   * Utiliza caché en memoria para no instanciar el cliente en cada request,
   * a menos que se fuerce la recarga.
   *
   * @param forceReload Ignorar caché y volver a leer de DB
   */
  static async getProvider(forceReload: boolean = false): Promise<EmbeddingProvider> {
    if (!forceReload && cachedProvider) {
      return cachedProvider;
    }

    // 1. Obtener la configuración actual desde Supabase app_config
    const { data: configRows, error } = await supabaseServer
      .from("app_config")
      .select("embedding_provider")
      .limit(1);

    const configData = configRows?.[0];

    if (error) {
      console.warn("[EmbeddingFactory] Error leyendo app_config, haciendo fallback a 'gemini':", error.message);
    }

    const activeProviderName = configData?.embedding_provider?.toLowerCase() || "gemini";

    // 2. Si el proveedor activo es el mismo que el cacheado, lo reutilizamos
    if (!forceReload && activeProviderName === cachedProviderName && cachedProvider) {
      return cachedProvider;
    }

    // 3. Instanciar el nuevo proveedor
    let provider: EmbeddingProvider;
    
    if (activeProviderName === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey || apiKey === "tu_openai_key") {
        throw new Error("OPENAI_API_KEY requerida para usar OpenAI.");
      }
      provider = new OpenAIEmbeddingProvider(apiKey);
    } else {
      // Default: Gemini
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY requerida para usar Gemini.");
      }
      provider = new GeminiEmbeddingProvider(apiKey);
    }

    // 4. Actualizar caché
    cachedProvider = provider;
    cachedProviderName = activeProviderName;

    return provider;
  }
}
