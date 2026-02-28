

## Plan: Actualizar System Prompt y Tool-Calling de Alicia Vendedores

### What needs to change

The `whatsapp-vendedores` Edge Function needs three upgrades:

1. **Replace the system prompt** with the full Alicia Vendedores prompt you provided (personality, SPIN selling flow, commissions, objection handling, all 10 steps).

2. **Add conversation history** — currently Alicia only sees the latest message (no memory). We need to load previous messages from `vendedores_agente` or a new messages table so the AI receives full context per vendor.

3. **Enable tool-calling for vendor registration** — when Alicia decides a vendor is ready, the AI should call `registrar-vendedor` automatically via function/tool-calling, get the code back, and include it in the reply. This replaces the current behavior where registration only happens on first contact.

### Technical steps

**Step 1 — Create conversation history table**
- New table `vendedores_mensajes` with columns: `id`, `vendedor_whatsapp` (text), `role` (text: user/assistant/system), `content` (text), `created_at`.
- No RLS needed (only accessed from edge functions via service role).

**Step 2 — Update `whatsapp-vendedores/index.ts`**
- Replace `SYSTEM_PROMPT` with the complete prompt.
- On each incoming message: load last ~20 messages from `vendedores_mensajes` for that WhatsApp number.
- Send full history to the AI gateway.
- Save both the user message and assistant reply to `vendedores_mensajes`.
- Add a tool definition for `registrar_vendedor` in the AI call, so when Alicia decides to pre-register, the AI returns a tool call.
- When a tool call is detected: invoke the `registrar-vendedor` edge function internally (direct Supabase insert or HTTP call), get the code, send a follow-up AI call with the tool result, then reply.
- Update vendedor name/correo in `vendedores_agente` when provided during conversation.

**Step 3 — Deploy and test**
- Deploy `whatsapp-vendedores`.
- Test end-to-end with a WhatsApp message.

### Important details
- The system prompt is ~4,000+ words. It will be embedded as a constant string in the edge function.
- Tool-calling format follows OpenAI-compatible schema (supported by the Lovable AI gateway).
- Messages older than ~20 will be trimmed to stay within token limits.
- The `registrar-vendedor` endpoint already exists and works — we just call it from within the same function using a direct Supabase insert (no HTTP hop needed).

