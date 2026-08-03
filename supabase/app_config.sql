-- Tabla de Configuración Global de la Aplicación (Proveedores de IA & RAG Embeddings)
CREATE TABLE IF NOT EXISTS app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  embedding_provider text NOT NULL DEFAULT 'openai', -- 'openai' | 'gemini'
  embedding_model text NOT NULL DEFAULT 'text-embedding-3-small',
  updated_at timestamp with time zone DEFAULT now()
);

-- Insertar configuración inicial por defecto si la tabla está vacía
INSERT INTO app_config (embedding_provider, embedding_model)
SELECT 'openai', 'text-embedding-3-small'
WHERE NOT EXISTS (SELECT 1 FROM app_config);
