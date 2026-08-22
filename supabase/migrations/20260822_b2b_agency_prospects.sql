-- Migración: Tabla para Prospección B2B de Agencias Inmobiliarias y Cold Outreach
CREATE TABLE IF NOT EXISTS b2b_agency_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_name TEXT NOT NULL,
  city TEXT NOT NULL,
  zone TEXT,
  address TEXT,
  website_url TEXT,
  phone_official TEXT,
  whatsapp_contact TEXT,
  manager_name TEXT,
  manager_role TEXT DEFAULT 'Gerente General',
  email_official TEXT,
  email_personal TEXT,
  linkedin_url TEXT,
  enrichment_status TEXT DEFAULT 'ENRICHED', -- 'PENDING', 'ENRICHED', 'FAILED'
  outreach_status TEXT DEFAULT 'NUEVO', -- 'NUEVO', 'EMAIL_ENVIADO', 'DEMO_AGENDADA', 'RECHAZADO', 'CONVERTIDO'
  last_contacted_at TIMESTAMPTZ,
  meeting_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_b2b_prospects_city ON b2b_agency_prospects(city);
CREATE INDEX IF NOT EXISTS idx_b2b_prospects_status ON b2b_agency_prospects(outreach_status);

-- Habilitar RLS
ALTER TABLE b2b_agency_prospects ENABLE ROW LEVEL SECURITY;

-- Política para superadmin / service_role
CREATE POLICY "Allow all access to authenticated users on b2b_agency_prospects"
  ON b2b_agency_prospects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para service_role / anon en dev
CREATE POLICY "Allow anon read/write in dev on b2b_agency_prospects"
  ON b2b_agency_prospects
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
