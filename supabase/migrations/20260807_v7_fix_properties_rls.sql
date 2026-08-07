-- 1. Asegurar la columna images como matriz de texto (por si acaso no corrieron la v6)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS images TEXT[];

-- 2. Habilitar RLS explícitamente en la tabla
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- 3. Crear política permisiva para todas las operaciones (desarrollo/admin)
DROP POLICY IF EXISTS "Allow full update on properties" ON public.properties;
CREATE POLICY "Allow full update on properties"
ON public.properties
FOR ALL
USING (true)
WITH CHECK (true);
