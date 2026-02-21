-- 1. Add payment_method column
ALTER TABLE public.whatsapp_orders 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT null;

-- 2. Expand status check to include 'confirmed' and 'duplicate'
ALTER TABLE public.whatsapp_orders DROP CONSTRAINT whatsapp_orders_status_check;
ALTER TABLE public.whatsapp_orders ADD CONSTRAINT whatsapp_orders_status_check 
CHECK (status IN ('received', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled', 'duplicate'));

-- 3. Mark duplicate orders (keep first per conversation, mark rest as 'duplicate')
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY conversation_id, restaurant_id ORDER BY created_at ASC) as rn
  FROM public.whatsapp_orders
  WHERE status NOT IN ('cancelled', 'duplicate')
)
UPDATE public.whatsapp_orders 
SET status = 'duplicate'
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 4. Fix historical statuses: confirmed orders stuck as 'received'
UPDATE public.whatsapp_orders 
SET status = 'confirmed' 
WHERE email_sent = true AND status = 'received';

-- 5. Sync payment_proof_url from conversations to orders where missing
UPDATE public.whatsapp_orders wo
SET payment_proof_url = wc.payment_proof_url
FROM public.whatsapp_conversations wc
WHERE wo.conversation_id = wc.id
  AND wc.payment_proof_url IS NOT NULL
  AND wo.payment_proof_url IS NULL;

-- 6. Create unique constraint for ATOMIC dedup (now safe — duplicates marked)
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_orders_conv_active 
ON public.whatsapp_orders (conversation_id, restaurant_id) 
WHERE status NOT IN ('cancelled', 'duplicate');

-- 7. Performance index for time-based dedup
CREATE INDEX IF NOT EXISTS idx_whatsapp_orders_phone_created 
ON public.whatsapp_orders (customer_phone, restaurant_id, created_at DESC);
