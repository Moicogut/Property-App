-- ==============================================================================
-- MIGRACIÓN: 20260824_v10_tenant_data_isolation.sql
-- PROYECTO: Property OS — ECOTRAFFIC SaaS
-- OBJETIVO: Aislamiento multi-tenant estricto, segregación Demo vs Producción (INV-02),
--           taxonomía canónica (PORT-02) y procedencia BANT (IA-01 / IA-02).
-- ==============================================================================

-- 1. EXTENSIÓN DE TABLA PROPERTIES: Demo flag, ambiente y tipo canónico
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS environment VARCHAR(20) NOT NULL DEFAULT 'production',
ADD COLUMN IF NOT EXISTS property_type VARCHAR(30) NOT NULL DEFAULT 'DEPARTAMENTO',
ADD COLUMN IF NOT EXISTS legal_status VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE';

-- 2. EXTENSIÓN DE TABLA LEADS: Demo flag, ambiente y procedencia auditable BANT
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS environment VARCHAR(20) NOT NULL DEFAULT 'production',
ADD COLUMN IF NOT EXISTS provenance JSONB DEFAULT '{}'::jsonb;

-- 3. EXTENSIÓN DE TABLA CONVERSATIONS / APPOINTMENTS / CONTRACTS
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    ALTER TABLE public.conversations 
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS environment VARCHAR(20) NOT NULL DEFAULT 'production',
    ADD COLUMN IF NOT EXISTS trace_id VARCHAR(64);
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments') THEN
    ALTER TABLE public.appointments 
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS environment VARCHAR(20) NOT NULL DEFAULT 'production';
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contracts') THEN
    ALTER TABLE public.contracts 
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS environment VARCHAR(20) NOT NULL DEFAULT 'production',
    ADD COLUMN IF NOT EXISTS template_version VARCHAR(50) DEFAULT 'v1.0-2026',
    ADD COLUMN IF NOT EXISTS data_snapshot JSONB;
  END IF;
END $$;

-- 4. ÍNDICES DE RENDIMIENTO PARA MULTI-TENANCY Y FILTRO DEMO
CREATE INDEX IF NOT EXISTS idx_properties_org_demo ON public.properties(organization_id, is_demo, status);
CREATE INDEX IF NOT EXISTS idx_leads_org_demo ON public.leads(organization_id, is_demo, pipeline_stage);

-- 5. POLÍTICA DE SEGURIDAD RLS ESTRICTA (Deny by Default & Tenant Isolation)
-- Deshabilitar políticas permisivas previas de desarrollo
DROP POLICY IF EXISTS "Allow full update on properties" ON public.properties;
DROP POLICY IF EXISTS "Allow public read properties" ON public.properties;

-- Política de lectura pública: Solo propiedades ACTIVAS, NO DEMO de organizaciones vigentes
CREATE POLICY "Public read active properties"
ON public.properties
FOR SELECT
USING (
  status = 'AVAILABLE' 
  AND is_demo = false 
  AND environment = 'production'
);

-- Política de gestión interna por tenant: los usuarios autenticados solo operan sobre su propio organization_id
CREATE POLICY "Tenant isolated access on properties"
ON public.properties
FOR ALL
USING (
  organization_id = (auth.jwt() ->> 'organization_id')::text
  OR auth.jwt() ->> 'role' = 'superadmin'
)
WITH CHECK (
  organization_id = (auth.jwt() ->> 'organization_id')::text
  OR auth.jwt() ->> 'role' = 'superadmin'
);

-- 6. AUDITORÍA: ETIQUETAR REGISTROS HISTÓRICOS DE PRUEBA COMO DEMO
UPDATE public.properties
SET is_demo = true
WHERE title ILIKE '%demo%' OR title ILIKE '%test%' OR title ILIKE '%prueba%' OR zone ILIKE '%test%';

UPDATE public.leads
SET is_demo = true
WHERE full_name ILIKE '%demo%' OR full_name ILIKE '%test%' OR full_name ILIKE '%prueba%';

-- 7. FUNCIÓN RPC RAG BLINDADA: MULTI-TENANT ISOLATION + NO DEMO + BLOQUEO LEGAL ROJO
CREATE OR REPLACE FUNCTION match_properties_secure(
  query_embedding vector,
  match_threshold float DEFAULT 0.35,
  match_count int DEFAULT 3,
  filter_org_id uuid DEFAULT NULL,
  filter_city text DEFAULT NULL,
  filter_vis boolean DEFAULT NULL,
  include_demo boolean DEFAULT FALSE
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
    AND (include_demo = TRUE OR p.is_demo = FALSE)
    AND (filter_org_id IS NULL OR p.organization_id = filter_org_id)
    AND (filter_city IS NULL OR p.city ILIKE filter_city)
    AND (filter_vis IS NULL OR p.accepts_social_housing = filter_vis)
    AND (pla.global_legal_score IS NULL OR pla.global_legal_score != 'ROJO') -- Bloqueo preventivo de inmuebles observados
    AND (1 - (p.embedding <=> query_embedding)) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

