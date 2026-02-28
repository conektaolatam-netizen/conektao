

## Plan: Expand Post-Registration Prompt + Send Recovery Message

### File to modify
`supabase/functions/whatsapp-vendedores/index.ts`

### Change 1 — Expand system prompt (line 134)
Replace the closing line `IMPORTANT: After registration...` with the full POST-REGISTRATION PHASE section from the user's request. This adds:
- **Role 1**: Answer any platform/process question. Never say "no entendí."
- **Role 2**: Personalized sales coaching for specific restaurant meetings (adapt pitch by restaurant type, owner personality)
- **Role 3**: Celebrate closes, diagnose rejections with counter-arguments
- **Explicit prohibitions**: Never "Lo siento, no entendí tu mensaje", never stop conversation, never forget vendor name
- **Fallback rule**: If unclear message → "Cuéntame más, ¿qué está pasando exactamente?"
- **Tone shift**: Coach and biggest fan, warmer, more personal, more celebratory

### Change 2 — Send recovery message to +573176436656
After deploying the updated function, use `sendWhatsAppMessage` via the edge function's admin action or direct API call to send:
"¡Hola de nuevo! Perdona el silencio técnico de hace un momento — ya estoy aquí al 100%. Cuéntame, ¿ya entraste a conektao.com/vendedores para certificarte? ¿O tienes alguna pregunta sobre cómo arrancar? 💪"

### What is NOT touched
- No other files
- No database changes
- No other edge functions

