-- Añadir columnas de configuración de IA a la tabla 'organizations'
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS ai_keywords TEXT DEFAULT 'Departamento, Casa, Garsonier, Garaje, Tienda, almacen, Property',
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;
