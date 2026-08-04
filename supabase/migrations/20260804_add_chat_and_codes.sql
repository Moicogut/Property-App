-- Añadir código único a la tabla properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS property_code TEXT UNIQUE;

-- Crear la tabla messages para sincronizar el historial del chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  sender TEXT CHECK (sender IN ('lead', 'ai_sofia', 'agent')) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear un índice en lead_id para acelerar la carga del historial en el chat
CREATE INDEX IF NOT EXISTS messages_lead_id_idx ON messages(lead_id);
