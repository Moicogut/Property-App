/**
 * Servicio de búsqueda vectorial RAG contra Supabase pgvector.
 * Responsabilidad única: dado un texto del usuario, devolver las propiedades más similares.
 */
import { supabaseServer, generateEmbedding } from "./shared";

export interface MatchedProperty {
  id: string;
  title: string;
  zone: string;
  city: string;
  price_usd: number;
  raw_description: string;
  property_code?: string;
  similarity: number;
}

/**
 * Busca propiedades similares al texto del usuario usando embeddings y cosine similarity.
 * @param userText - El mensaje del usuario para generar el embedding de búsqueda.
 * @param matchThreshold - Umbral mínimo de similitud (0-1). Default: 0.3
 * @param matchCount - Cantidad máxima de resultados. Default: 2
 */
export async function searchProperties(
  userText: string,
  matchThreshold = 0.3,
  matchCount = 2
): Promise<MatchedProperty[]> {
  try {
    const queryEmbedding = await generateEmbedding(userText);

    const { data: matches, error: rpcError } = await supabaseServer.rpc("match_properties", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (rpcError) {
      console.error("[RAG] RPC match_properties error:", rpcError);
      return [];
    }

    return (matches || []) as MatchedProperty[];
  } catch (err) {
    console.error("[RAG] Vector search failed:", err);
    return [];
  }
}
