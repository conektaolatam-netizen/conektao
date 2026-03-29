CREATE TABLE public.leads_conektao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  main_business_type text NOT NULL,
  necesidad_principal text,
  completo_flujo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.leads_conektao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON public.leads_conektao
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update" ON public.leads_conektao
  FOR UPDATE TO anon USING (true) WITH CHECK (true);