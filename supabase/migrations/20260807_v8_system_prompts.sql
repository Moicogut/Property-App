-- 1. Tabla de Prompts Dinámicos del Sistema
CREATE TABLE IF NOT EXISTS public.system_prompts (
    key VARCHAR(50) PRIMARY KEY, -- ej. 'COPY_GENERATOR', 'RAG_ASSISTANT'
    prompt_text TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Habilitar RLS
ALTER TABLE public.system_prompts ENABLE ROW LEVEL SECURITY;

-- 3. Crear política permisiva (acceso total temporal para admin/backend)
DROP POLICY IF EXISTS "Allow full access on system_prompts" ON public.system_prompts;
CREATE POLICY "Allow full access on system_prompts"
ON public.system_prompts
FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Insertar Prompt Inicial para el Generador de Copies
INSERT INTO public.system_prompts (key, prompt_text)
VALUES ('COPY_GENERATOR', 'Eres un Copywriter Inmobiliario Elite especializado en Ads.
Genera 2 variantes de copy persuasivo (Estructura Hook + Beneficios + CTA directo) y 1 Prompt para generar la imagen publicitaria en Midjourney/DALL-E.

FORMATO REQUERIDO (Estricto, sin marcas de markdown ### ni **):

OPCION 1: INSTAGRAM / FACEBOOK
[Texto altamente persuasivo con emojis estratégicos]

OPCION 2: TIKTOK / WHATSAPP SHORT
[Texto directo al grano, enfocado en escasez o inversión]

PROMPT DE IMAGEN IA (Midjourney / DALL-E / Flux):
[Prompt detallado en inglés optimizado para render fotorrealista del inmueble, iluminación arquitectónica y estilo editorial]')
ON CONFLICT (key) DO NOTHING;
