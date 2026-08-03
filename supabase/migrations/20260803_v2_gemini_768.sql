-- ============================================================================
-- Property OS V2 — Migración a Gemini 768d + Infraestructura RAG Nativa
-- Fecha: 2026-08-03
-- Descripción: Migra embeddings de 1536d (OpenAI) a 768d (Gemini),
--              crea tabla app_config, función RPC match_properties,
--              e índice HNSW optimizado.
-- ============================================================================

-- 1. Asegurar la extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Modificar la columna embedding en properties a 768 dimensiones (Gemini)
-- NOTA: Esto invalida cualquier embedding previo de 1536d
ALTER TABLE properties ALTER COLUMN embedding TYPE vector(768);

-- 3. Crear índice HNSW optimizado para distancia coseno en 768d
DROP INDEX IF EXISTS properties_embedding_idx;
DROP INDEX IF EXISTS properties_embedding_hnsw_idx;
CREATE INDEX properties_embedding_idx ON properties USING hnsw (embedding vector_cosine_ops);

-- 4. Replicación Realtime en la tabla leads (Comentado porque ya existe y lanza error 42710)
-- ALTER PUBLICATION supabase_realtime ADD TABLE leads;

-- 5. Tabla de Configuración Global de Embeddings
CREATE TABLE IF NOT EXISTS app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  embedding_provider text NOT NULL DEFAULT 'gemini',
  embedding_model text NOT NULL DEFAULT 'text-embedding-004',
  updated_at timestamp with time zone DEFAULT now()
);

-- Inserción del registro por defecto (Gemini) si no existe
INSERT INTO app_config (embedding_provider, embedding_model)
SELECT 'gemini', 'text-embedding-004'
WHERE NOT EXISTS (SELECT 1 FROM app_config);

-- 6. Función RPC de Búsqueda Vectorial Semántica (768d)
-- Delega el 100% del cómputo de similitud coseno a PostgreSQL.
-- Jamás se calcula en código TypeScript/Node.js.
CREATE OR REPLACE FUNCTION match_properties(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.4,
  match_count int DEFAULT 3,
  filter_city text DEFAULT NULL,
  filter_vis boolean DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  title text,
  city text,
  zone text,
  price_usd numeric,
  bedrooms int,
  bathrooms int,
  area_sqm numeric,
  accepts_social_housing boolean,
  status text,
  raw_description text,
  image_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.organization_id,
    p.title,
    p.city,
    p.zone,
    p.price_usd,
    p.bedrooms,
    p.bathrooms,
    p.area_sqm,
    p.accepts_social_housing,
    p.status,
    p.raw_description,
    p.image_url,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM properties p
  WHERE p.status = 'AVAILABLE'
    AND (filter_city IS NULL OR p.city ILIKE filter_city)
    AND (filter_vis IS NULL OR p.accepts_social_housing = filter_vis)
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
