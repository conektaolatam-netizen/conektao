ALTER TABLE public.vendedores_agente DROP CONSTRAINT vendedores_agente_estado_check;

ALTER TABLE public.vendedores_agente ADD CONSTRAINT vendedores_agente_estado_check 
CHECK (estado = ANY (ARRAY['pendiente'::text, 'pre-registrado'::text, 'certificado'::text, 'activo'::text]));