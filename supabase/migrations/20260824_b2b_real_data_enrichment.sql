-- Migración: Enriquecimiento de datos reales B2B
-- Agrega columnas para Google Places, validación de web y score de calidad

ALTER TABLE b2b_agency_prospects
  ADD COLUMN IF NOT EXISTS place_id TEXT,
  ADD COLUMN IF NOT EXISTS web_status TEXT DEFAULT 'UNVERIFIED',
  -- UNVERIFIED | ACTIVE | BROKEN | NONE
  ADD COLUMN IF NOT EXISTS web_http_status INTEGER,
  ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 0,
  -- 0-100: +25 tiene teléfono, +25 web activa, +25 email, +25 manager
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'AI_GENERATED',
  -- AI_GENERATED | GOOGLE_PLACES
  ADD COLUMN IF NOT EXISTS google_rating NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS google_reviews INTEGER,
  ADD COLUMN IF NOT EXISTS scrape_attempted_at TIMESTAMPTZ;

-- Índice único en place_id para evitar duplicados de Google Places
CREATE UNIQUE INDEX IF NOT EXISTS idx_b2b_prospects_place_id
  ON b2b_agency_prospects(place_id)
  WHERE place_id IS NOT NULL;

-- Índice en data_source para filtros de calidad
CREATE INDEX IF NOT EXISTS idx_b2b_prospects_data_source
  ON b2b_agency_prospects(data_source);

CREATE INDEX IF NOT EXISTS idx_b2b_prospects_web_status
  ON b2b_agency_prospects(web_status);
