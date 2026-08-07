-- Script para habilitar el Historial de Copies en Supabase
CREATE TABLE IF NOT EXISTS public.property_copies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    copy_text TEXT NOT NULL,
    image_prompt TEXT,
    platform VARCHAR(50) DEFAULT 'GENERAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.property_copies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access for property_copies" ON public.property_copies;
CREATE POLICY "Full access for property_copies" ON public.property_copies FOR ALL USING (true);

-- Agregar columna de imágenes múltiples
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images TEXT[];
