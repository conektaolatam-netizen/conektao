

# Plan: Fix 3 Reservation Flow Issues

## Issues Diagnosed

### Issue 1 — AI says "confirmed" but never generates the `---RESERVA_CONFIRMADA---` tag
The AI (for 573506332222) conversationally confirmed the reservation ("¡listo, tu reserva está confirmada!") but **never generated the structured tag** `---RESERVA_CONFIRMADA---{json}---FIN_RESERVA---`. Without the tag, `parseReservation()` returns null, so `processReservation()` never runs → no DB insert, no ICS, no email. The AI just sent a text response as if it confirmed, but it was a hallucination — the backend never processed it.

**Root cause**: The prompt says "Cuando el cliente confirme, genera el tag" but doesn't explicitly tell the AI that saying "confirmado" without the tag does nothing. The AI shortcuts and writes a confirmation message without the tag.

### Issue 2 — AI doesn't include the exact date (e.g. "sábado" without YYYY-MM-DD)
The prompt asks for `YYYY-MM-DD` but the AI never resolves "el sábado" to `2026-03-22`. This is because the AI doesn't know today's date.

**Root cause**: No `FECHA_ACTUAL` context is injected into the reservation prompt.

### Issue 3 — 573006653341 conversation is contaminated
That phone's conversation history has 20+ messages where the bot said "no hacemos reservas" / "llama al restaurante". When `reservation_flow` is set, the LLM sees the reservation instructions in the system prompt BUT also sees its own previous messages refusing reservations. The history dominates.

**Root cause**: No history cleanup when reservation mode is activated. Similar to the `reopenHint` pattern but specific to reservation contamination.

## Fix (1 file)

### `supabase/functions/whatsapp-webhook/index.ts`

**Change A — Inject today's date into reservation prompt block (~line 1108-1130)**

Add to the FLUJO DE RESERVA section:
```
FECHA_ACTUAL: ${new Date().toISOString().split("T")[0]} (${dayNamesArr[new Date().getDay()]})
Cuando el cliente diga "el sábado", "mañana", etc., CALCULA la fecha real en formato YYYY-MM-DD.
Siempre CONFIRMA la fecha completa al cliente: "Sería el sábado 22 de marzo de 2026, ¿correcto?"
```

**Change B — Strengthen tag requirement in prompt (~line 1120-1130)**

Add explicit instruction:
```
CRÍTICO: La reserva NO queda registrada hasta que generes el tag ---RESERVA_CONFIRMADA---. 
Sin el tag, el sistema NO la procesa. NUNCA digas "tu reserva está confirmada" sin incluir el tag.
Genera el tag SOLO cuando tengas TODOS los datos: nombre, personas, fecha (YYYY-MM-DD) y hora (HH:MM).
```

**Change C — Add reservation anti-contamination hint (~line 4097, alongside `reopenHint`)**

When `isReservationMode === true`, scan recent messages for stale "no reservations" responses and inject:
```
IMPORTANTE: El servicio de RESERVAS está ACTIVO ahora. Ignora CUALQUIER mensaje anterior donde se haya dicho que no se aceptan reservas o que se debe llamar al restaurante. Gestiona la reserva con normalidad siguiendo el FLUJO DE RESERVA.
```

**Change D — Reset conversation on reservation flow activation (~line 3873)**

When the reservation flow is activated for the first time (intent detected), check if conversation history contains "no reserva" messages. If so, trim messages to only keep the last 2-4 messages (the current interaction), preventing old refusal messages from contaminating the context.

## What stays untouched
- Order flow, parseOrder, saveOrder, confirmations
- Validation, ICS generation, email sending logic (all correct — just never reached)
- DB tables, UI, other edge functions

## Expected Result
- AI will always include `---RESERVA_CONFIRMADA---` tag with full JSON when confirming
- AI will resolve relative dates ("sábado") to absolute `YYYY-MM-DD` using injected current date
- AI will tell the customer the exact date: "Sería el sábado 22 de marzo"
- Reservation will be inserted in DB, ICS generated and sent
- Contaminated conversations (573006653341) will have stale refusal messages purged/overridden
