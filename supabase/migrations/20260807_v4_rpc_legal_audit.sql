-- Actualizar la función RPC match_properties para incluir global_legal_score
DROP FUNCTION IF EXISTS match_properties(vector(768), float, int, text, boolean);

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
  similarity float,
  global_legal_score varchar(20)
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
    1 - (p.embedding <=> query_embedding) AS similarity,
    COALESCE(pla.global_legal_score, 'PENDIENTE'::varchar) AS global_legal_score
  FROM properties p
  LEFT JOIN property_legal_audit pla ON p.id = pla.property_id
  WHERE p.status = 'AVAILABLE'
    AND (filter_city IS NULL OR p.city ILIKE filter_city)
    AND (filter_vis IS NULL OR p.accepts_social_housing = filter_vis)
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
