-- 1. Crear el bucket 'images' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;


-- 3. Crear política para permitir visualización pública de las imágenes
CREATE POLICY "Public Access for images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'images');

-- 4. Crear política para permitir subida de imágenes a usuarios (o anónimo si es pruebas)
CREATE POLICY "Allow uploads to images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'images');

-- 5. Crear política para permitir eliminar imágenes
CREATE POLICY "Allow deletes from images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'images');
