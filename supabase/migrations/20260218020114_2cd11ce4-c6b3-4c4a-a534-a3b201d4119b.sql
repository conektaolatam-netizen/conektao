
ALTER TABLE whatsapp_conversations 
DROP CONSTRAINT whatsapp_conversations_order_status_check;

ALTER TABLE whatsapp_conversations 
ADD CONSTRAINT whatsapp_conversations_order_status_check 
CHECK (order_status = ANY (ARRAY[
  'none', 'building', 'confirmed', 'sent', 
  'emailed', 'active', 'pending_confirmation', 
  'pending_button_confirmation', 'nudge_sent', 'followup_sent'
]));
