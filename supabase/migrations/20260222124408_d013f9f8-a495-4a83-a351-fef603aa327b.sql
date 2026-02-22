
-- Drop restrictive unique index that blocks repeat customers
DROP INDEX IF EXISTS idx_whatsapp_orders_conv_active;

-- Replace with non-unique index for performance
CREATE INDEX idx_whatsapp_orders_conv_lookup 
ON whatsapp_orders (conversation_id, restaurant_id, status);
