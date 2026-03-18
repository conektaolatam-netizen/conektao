

# Plan: Asistente Personal de Santiago (573176436656)

## Overview
Intercept messages from Santiago's number in the WhatsApp webhook, bypass the restaurant/emotional flow entirely, and route to a dedicated personal assistant powered by Gemini that manages an `agenda_santi` table.

## 1. Database: Create `agenda_santi` table

```sql
CREATE TABLE public.agenda_santi (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha_hora timestamptz NOT NULL,
  titulo text NOT NULL,
  descripcion text,
  aviso_minutos integer DEFAULT 5,
  aviso_enviado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.agenda_santi ENABLE ROW LEVEL SECURITY;
-- Service role only (edge functions use service role key)
CREATE POLICY "Service role full access" ON public.agenda_santi FOR ALL USING (true) WITH CHECK (true);
```

## 2. Webhook: Intercept Santiago's number

**File: `supabase/functions/whatsapp-webhook/index.ts`**

After message type handling (~line 2696, after the empty-text check) and **before** the config lookup (line 2698), insert:

```typescript
const SANTI_PHONE = "573176436656";
if (from === SANTI_PHONE) {
  await markRead(pid, GLOBAL_WA_TOKEN, msg.id);
  await handleSantiAssistant(text, from, pid, GLOBAL_WA_TOKEN);
  return new Response(JSON.stringify({ status: "santi_handled" }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

This returns early, completely skipping the restaurant/emotional flow.

## 3. `handleSantiAssistant` function

Add in the webhook file (helpers section, ~line 490). This function:

1. Loads existing conversation context from `agenda_santi` (upcoming events)
2. Calls Gemini via Lovable AI Gateway with tool-calling to extract structured actions:
   - **Tool `agendar`**: params `fecha_hora`, `titulo`, `descripcion`, `aviso_minutos` → INSERT into `agenda_santi`
   - **Tool `ver_agenda`**: params `rango` (hoy/semana/todo) → SELECT from `agenda_santi`
   - **Tool `eliminar`**: params `titulo_parcial` → DELETE matching row
   - **Tool `modificar`**: params `titulo_parcial`, `nueva_fecha_hora` → UPDATE matching row
3. Executes the tool action against the DB
4. Sends the AI's confirmation text back via `sendWA`

The system prompt instructs Gemini to always assume `America/Bogota` (UTC-5), respond in Spanish, confirm with date/time/notes, use direct tone, max one ✅ emoji.

Gemini handles natural Spanish date parsing ("mañana a las 3", "el miércoles", "en 2 horas") internally via the system prompt instructions. Dates are stored as UTC `timestamptz`.

## 4. Edge Function: `agenda-reminder`

**New file: `supabase/functions/agenda-reminder/index.ts`**

- Runs on HTTP call (triggered externally via cron-job.org every 1 minute)
- Queries `agenda_santi` for events where:
  - `aviso_enviado = false`
  - `fecha_hora - interval 'aviso_minutos minutes' <= now()`
  - `fecha_hora > now()`
- For each match, sends WhatsApp message to `573176436656` with format:
  ```
  ⏰ Santiago, en X minutos:
  
  TÍTULO
  DESCRIPCIÓN
  
  Hora Colombia: HH:mm
  ```
- Marks `aviso_enviado = true`
- Uses `GLOBAL_WA_PHONE_ID` and `GLOBAL_WA_TOKEN` from env

**Config**: Add `[functions.agenda-reminder]` with `verify_jwt = false` to `supabase/config.toml`.

## 5. Files Modified

| File | Change |
|------|--------|
| `supabase/functions/whatsapp-webhook/index.ts` | Add `handleSantiAssistant` function + early-return intercept for Santiago's number |
| `supabase/functions/agenda-reminder/index.ts` | New edge function for reminder cron |
| `supabase/config.toml` | Add `[functions.agenda-reminder]` entry |
| Database migration | Create `agenda_santi` table |

## 6. Cron Setup

After deployment, the reminder URL will be:
`https://ctsqvjcgcukosusksulx.supabase.co/functions/v1/agenda-reminder`

The user should configure this in cron-job.org to run every 1 minute with the anon key as Authorization header.

