

# Plan: Fix Date Calculation & Reservation Query in Chat

## Issue 1 — AI suggests wrong date (e.g. "sábado 22" when sábado is 21)

**Root cause**: The date injection logic uses `getRestaurantDate(tzOffset)` correctly, but the issue is that `FECHA_ACTUAL` is only injected inside the `buildCoreSystemPrompt` when `reservationMode = true`. The AI calculates the date correctly in the prompt, but the instruction says "ejemplo: sería el sábado 22 de marzo de 2026" — this hardcoded example in the prompt text confuses the LLM into echoing "22" instead of calculating from the actual `FECHA_ACTUAL`.

**Fix**: Change the hardcoded example in line 1122 to use a dynamic example based on the actual date injected, so the AI doesn't parrot a stale example. For instance: `"Sería el ${todayDayName} ${localNow.getDate()} de ${monthName} de ${localNow.getFullYear()}, ¿correcto?"` — but using tomorrow or next relevant day so the example itself is correct.

### File: `supabase/functions/whatsapp-webhook/index.ts` (~line 1119-1122)

Replace the hardcoded example with a dynamically computed one:
```
FECHA_ACTUAL: ${todayStr} (${todayDayName})
HORA_ACTUAL: HH:MM
Cuando el cliente diga "mañana", "el sábado", etc., CALCULA la fecha real basándote en FECHA_ACTUAL.
Siempre CONFIRMA la fecha completa al cliente, ejemplo: "Sería el [día] [número] de [mes] de [año], ¿correcto?"
NO copies el ejemplo literalmente — calcula la fecha real.
```

Remove the specific date from the example to prevent parroting.

---

## Issue 2 — AI says "no tengo acceso" when asked about existing reservations

**Root cause**: The reservation context injection (lines 4222-4238) is inside the `if (isReservationMode)` block. When the customer asks "muéstrame mis reservas" but the conversation is NOT in `reservation_flow` status (e.g., it's in `none`), the code never queries the DB for existing reservations, so the AI has no data and says "no tengo acceso".

**Fix**: Move the reservation context injection OUTSIDE the `isReservationMode` block. Always query reservations for the customer's phone when reservations are enabled for the restaurant, regardless of flow status. This way, even in normal conversation mode, the AI can answer "you have a reservation on Saturday at 12:00".

### File: `supabase/functions/whatsapp-webhook/index.ts` (~lines 4222-4238)

- Move the reservation DB query block to AFTER the `isReservationMode` block (after line 4239)
- Make it conditional on `resConfig?.enabled === true` instead of `isReservationMode`
- Keep it appending to `reopenHint` so it's included in the system prompt
- Add instruction: "Si el cliente pregunta por sus reservas, responde con esta información. No digas que no tienes acceso."

## What stays untouched
- Order flow, all tags, validation, ICS generation
- Anti-contamination logic (stays inside `isReservationMode`)
- UI components

## Expected results
- AI will calculate dates correctly without parroting a hardcoded example
- AI will answer reservation queries in any conversation state (not just `reservation_flow`)

