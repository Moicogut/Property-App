-- 1. Crear índice HNSW para acelerar la distancia coseno en pgvector
CREATE INDEX IF NOT EXISTS properties_embedding_idx 
ON properties 
USING hnsw (embedding vector_cosine_ops);

-- 2. Habilitar replicación de Supabase Realtime para la tabla leads
ALTER PUBLICATION supabase_realtime ADD TABLE leads;

-- 3. Crear / Reemplazar función RPC de búsqueda semántica híbrida
CREATE OR REPLACE FUNCTION match_properties(
  query_embedding vector(1536),
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
    (1 - (p.embedding <=> query_embedding))::float AS similarity
  FROM properties p
  WHERE p.status = 'AVAILABLE'
    AND (filter_city IS NULL OR p.city ILIKE filter_city)
    AND (filter_vis IS NULL OR p.accepts_social_housing = filter_vis)
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
