ALTER TABLE public.whatsapp_orders
ADD COLUMN IF NOT EXISTS payment_proof_url text;