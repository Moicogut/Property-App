-- Añadir columna de módulos activados a organizations (SaaS modular)
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "modules" jsonb DEFAULT '{
  "module_sofia_ia": true,
  "module_bant_kanban": true,
  "module_social_marketing": false,
  "module_legal_audit": false,
  "module_contract_generator": false
}'::jsonb;

-- Añadir tipo de usuario y ciudad principal
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "primary_city" text DEFAULT 'Santa Cruz';

-- Añadir canal de origen del lead para atribución de marketing
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "source_channel" text DEFAULT 'whatsapp_direct';
