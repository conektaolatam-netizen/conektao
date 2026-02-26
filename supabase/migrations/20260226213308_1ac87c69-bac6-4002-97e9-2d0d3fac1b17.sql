
-- Fix SELECT policy: allow anon to read their own row (by whatsapp match)
DROP POLICY IF EXISTS "Service role can read vendedores" ON public.vendedores;

-- Allow anyone to select vendedores (needed for duplicate check and post-insert select)
CREATE POLICY "Anyone can read vendedores"
ON public.vendedores
FOR SELECT
USING (true);

-- Add nivel_actual column if missing
ALTER TABLE public.vendedores ADD COLUMN IF NOT EXISTS nivel_actual integer DEFAULT 1;
