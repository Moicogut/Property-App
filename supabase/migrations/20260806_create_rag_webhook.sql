-- Reemplaza [TU-DOMINIO] por tu URL de Vercel (ej: https://property-app-chi.vercel.app)
-- Reemplaza [TU-WEBHOOK-SECRET] por el secreto que configuraste en las variables de entorno de Vercel

DROP TRIGGER IF EXISTS property_auto_embed_webhook ON properties;

CREATE TRIGGER property_auto_embed_webhook
AFTER INSERT OR UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://[TU-DOMINIO]/api/rag/auto-embed',
  'POST',
  '{"Content-type":"application/json", "x-webhook-secret":"[TU-WEBHOOK-SECRET]"}',
  '{}',
  '1000'
);
