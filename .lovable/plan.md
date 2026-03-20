# Plan: Fix reservation flow not being followed by LLM

## Root Cause

The reservation hint is appended at the END of a ~4000-char prompt that explicitly says:

- "Eres una IA conversacional de **pedidos** por WhatsApp" (identity = orders only)
- FLUJO DE PEDIDO steps 1-7 are always present, even during reservation flow
- "Si no sabes algo → redirige al número del dueño" — triggers phone escalation
- The reservation instructions at the bottom get ignored because the core prompt dominates

## Fix (1 file)

### `supabase/functions/whatsapp-webhook/index.ts`

**Change A — Make `buildCoreSystemPrompt` aware of reservation flow**

Add a `reservationMode: boolean = false` parameter. When `true`:

- Change identity line from "IA conversacional de pedidos" to "IA conversacional de pedidos y reservas"
- Wrap the entire FLUJO DE PEDIDO block in a conditional: when `reservationMode = true`, replace it with a FLUJO DE RESERVA block directly in the core prompt (not as a suffix)
  &nbsp;

**Change B — Pass `reservationMode` through the call chain**

In `buildPrompt()`, add the `reservationMode` parameter and forward it to `buildCoreSystemPrompt()`.

In the main handler (~line 4071), pass `currentFlowStatus === "reservation_flow"` to `buildPrompt()`.

**Change C — Remove the redundant `reservationHint` suffix**

Since the reservation flow instructions will now be embedded IN the core prompt (replacing the order flow), the `reservationHint` variable appended at the end (~line 4050-4068) is no longer needed. Remove it.

**Change D — Skip restaurant-closed check for reservation flow**

The availability check at line 3871 returns early with a "we're closed" message. Reservations should be allowed even when the restaurant is currently closed (you're booking for a future date). Add a condition:

```
if (availability.blocked && conv.order_status !== "reservation_flow") {
```

## What stays untouched

- Order flow (PEDIDO_CONFIRMADO tags, parseOrder, saveOrder)
- Suggestion flow, upselling, service overrides
- Reservation validation, ICS generation, email sending
- All existing tables and UI

## Expected result

- When `reservation_flow` is active, the LLM sees "FLUJO DE RESERVA" as its primary flow instead of "FLUJO DE PEDIDO"
- FLUJO DE PEDIDO should keep working at the same way it did before intruding reservation_flow
- The LLM won't escalate to the phone number because its identity includes reservations
- Restaurant-closed status won't block future-date bookings