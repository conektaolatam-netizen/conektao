GRANT USAGE ON SCHEMA public TO anon;

GRANT ALL ON TABLE public.leads_conektao TO anon;

DROP POLICY IF EXISTS "allow_anon_insert" ON public.leads_conektao;

DROP POLICY IF EXISTS "allow_anon_select" ON public.leads_conektao;

DROP POLICY IF EXISTS "allow_anon_update" ON public.leads_conektao;

ALTER TABLE public.leads_conektao 
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_anon_insert" 
ON public.leads_conektao 
FOR INSERT TO anon 
WITH CHECK (true);

CREATE POLICY "allow_anon_select" 
ON public.leads_conektao 
FOR SELECT TO anon 
USING (true);

CREATE POLICY "allow_anon_update" 
ON public.leads_conektao 
FOR UPDATE TO anon 
USING (true);