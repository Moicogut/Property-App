import { OpenAI } from "openai";
import type { EmbeddingProvider } from "./types";

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  public readonly providerName = "openai";
  public readonly modelName = "text-embedding-3-small";
  public readonly dimensions = 768; // Forzado a 768d para match de BD

  private client: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY no configurada. No se puede instanciar OpenAIEmbeddingProvider.");
    }
    this.client = new OpenAI({ apiKey });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.modelName,
        input: text,
        dimensions: this.dimensions, 
      });

      const embedding = response.data[0]?.embedding;
      
      if (!embedding || embedding.length !== this.dimensions) {
        throw new Error(`OpenAI API retornó un embedding inválido (esperado ${this.dimensions}d, recibido ${embedding?.length}d)`);
      }

      return embedding;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[OpenAI Provider] Falló la API de OpenAI: ${msg}`);
      console.warn(`[OpenAI Provider] ⚠️ Se está utilizando un vector Dummy (768d) para mantener la estabilidad del sistema.`);
      
      // Fallback a vector dummy de 768 dimensiones
      return Array.from({ length: this.dimensions }, () => (Math.random() - 0.5) * 0.1);
    }
  }
}
