ALTER TABLE public.whatsapp_conversations 
ADD COLUMN IF NOT EXISTS pending_since TIMESTAMPTZ DEFAULT NULL;