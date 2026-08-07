-- Tabla para almacenar el historial de contratos y reservas emitidos
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN ('RESERVATION', 'PURCHASE_PROMISE')),
    buyer_name VARCHAR(255) NOT NULL,
    buyer_id_number VARCHAR(50) NOT NULL, -- CI / Passaporte / NIT
    agreed_price NUMERIC(12, 2) NOT NULL,
    reservation_amount NUMERIC(12, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    valid_until DATE,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS en la tabla
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Políticas base para la tabla contracts (Opcional, asumiendo acceso completo a admin por el momento)
DROP POLICY IF EXISTS "Allow Full Access on Contracts" ON public.contracts;
CREATE POLICY "Allow Full Access on Contracts"
ON public.contracts
FOR ALL
USING (true)
WITH CHECK (true);

-- 1. Crear el bucket de Storage para guardar los PDFs si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts-pdf', 'contracts-pdf', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Permitir lectura pública de los documentos generados
DROP POLICY IF EXISTS "Public Read Access for Contracts" ON storage.objects;
CREATE POLICY "Public Read Access for Contracts"
ON storage.objects FOR SELECT
USING (bucket_id = 'contracts-pdf');

-- 3. Permitir subida/inserción a usuarios autenticados (o desde el Service Role del Serverless)
DROP POLICY IF EXISTS "Allow Upload for Contracts" ON storage.objects;
CREATE POLICY "Allow Upload for Contracts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'contracts-pdf');
