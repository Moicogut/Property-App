-- Añadir tipo de usuario a la tabla users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "user_type" VARCHAR(50) DEFAULT 'INDEPENDENT_AGENT';

-- Crear tabla property_legal_audit
CREATE TABLE IF NOT EXISTS "property_legal_audit" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "property_id" UUID REFERENCES "properties"("id") ON DELETE CASCADE,
  "city" VARCHAR(50) NOT NULL,
  "folio_real_status" VARCHAR(20) DEFAULT 'PENDIENTE',
  "tax_status" VARCHAR(20) DEFAULT 'PENDIENTE',
  "cadastral_status" VARCHAR(20) DEFAULT 'PENDIENTE',
  "global_legal_score" VARCHAR(20) DEFAULT 'ROJO',
  "notes" TEXT,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
