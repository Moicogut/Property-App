import { GoogleGenAI } from "@google/genai";
import type { EmbeddingProvider } from "./types";

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  public readonly providerName = "gemini";
  public readonly modelName = "text-embedding-004";
  public readonly dimensions = 768;

  private client: GoogleGenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no configurada. No se puede instanciar GeminiEmbeddingProvider.");
    }
    this.client = new GoogleGenAI({ 
      apiKey,
      httpOptions: { apiVersion: 'v1' }
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.models.embedContent({
        model: this.modelName,
        contents: text,
      });

      const embedding = response.embeddings?.[0]?.values;
      
      if (!embedding || embedding.length !== this.dimensions) {
        throw new Error(`Gemini API retornó un embedding inválido (esperado ${this.dimensions}d, recibido ${embedding?.length}d)`);
      }

      return embedding;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[Gemini Provider] Fallo la API de Gemini: ${msg}`);
      console.warn(`[Gemini Provider] ⚠️ Se está utilizando un vector Dummy (768d) para mantener la estabilidad del sistema.`);
      
      // Fallback a vector dummy de 768 dimensiones (todos ceros o floats pequeños) para que el RPC no colapse
      return Array.from({ length: this.dimensions }, () => (Math.random() - 0.5) * 0.1);
    }
  }
}
