-- Add the Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id),
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELED', 'RESCHEDULED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS appointments_lead_id_idx ON public.appointments(lead_id);
CREATE INDEX IF NOT EXISTS appointments_date_idx ON public.appointments(appointment_date);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow Service Role full access on appointments"
    ON public.appointments
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Temporal allow public read/write for local demo
CREATE POLICY "Allow public full access on appointments local"
    ON public.appointments
    FOR ALL
    TO public, anon, authenticated
    USING (true)
    WITH CHECK (true);
