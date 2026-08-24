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
  global_legal_score?: string;
}

/**
 * Busca propiedades similares al texto del usuario usando embeddings y cosine similarity.
 * @param userText - El mensaje del usuario para generar el embedding de búsqueda.
 * @param organizationId - ID opcional del tenant para aislamiento estricto.
 * @param matchThreshold - Umbral mínimo de similitud (0-1). Default: 0.3
 * @param matchCount - Cantidad máxima de resultados. Default: 2
 */
export async function searchProperties(
  userText: string,
  organizationId?: string,
  matchThreshold = 0.3,
  matchCount = 2
): Promise<MatchedProperty[]> {
  try {
    const queryEmbedding = await generateEmbedding(userText);

    // Intentar primero con la función RPC segura con aislamiento multi-tenant
    const { data: matches, error: rpcError } = await supabaseServer.rpc("match_properties_secure", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_org_id: organizationId || null,
      include_demo: false,
    });

    if (!rpcError && matches) {
      return matches as MatchedProperty[];
    }

    // Fallback defensivo a match_properties estándar si la migración aún no corrió
    const { data: legacyMatches, error: legacyError } = await supabaseServer.rpc("match_properties", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (legacyError) {
      console.error("[RAG] RPC match_properties error:", legacyError);
      return [];
    }

    return (legacyMatches || []) as MatchedProperty[];
  } catch (err) {
    console.error("[RAG] Vector search failed:", err);
    return [];
  }
}
