GRANT USAGE ON SCHEMA public TO anon;

GRANT INSERT ON TABLE public.leads_conektao TO anon;

GRANT UPDATE ON TABLE public.leads_conektao TO anon;

GRANT SELECT ON TABLE public.leads_conektao TO anon;

ALTER TABLE public.leads_conektao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_anon_insert" ON public.leads_conektao;

CREATE POLICY "allow_anon_insert"
ON public.leads_conektao
FOR INSERT
TO anon
WITH CHECK (true);

DROP POLICY IF EXISTS "allow_anon_select" ON public.leads_conektao;

CREATE POLICY "allow_anon_select"
ON public.leads_conektao
FOR SELECT
TO anon
USING (true);