

# Plan: Fix reservation flow being ignored by LLM (Root Cause #2)

## Diagnosis

The reservation intent IS being detected correctly (logs confirm `Reservation flow activated`). The `reservationMode` flag IS being passed to `buildCoreSystemPrompt`. However, the AI still refuses because:

1. **`buildDynamicPrompt` is NOT reservation-aware**: It always outputs `ESTADO: Cerrado` (schedule), full delivery/payment blocks, escalation instructions, and the entire menu — all order-taking context that overwhelms the FLUJO DE RESERVA instructions.

2. **Schedule says "Cerrado"**: Even though we bypass the hard availability block (line 3896), the dynamic prompt's `scheduleBlock` still tells the AI "ESTADO: Cerrado. Abrimos a las X" — and the AI obeys this instead of the reservation flow.

3. **Escalation block**: The dynamic prompt includes "Si insiste → comunícate al [phone]", causing the AI to redirect to the phone instead of handling the reservation.

## Fix (1 file)

### `supabase/functions/whatsapp-webhook/index.ts`

**Change A — Pass `reservationMode` to `buildDynamicPrompt`**

Add `reservationMode: boolean = false` parameter to `buildDynamicPrompt()` and forward it from `buildPrompt()` (line 1225).

**Change B — Override `scheduleBlock` in reservation mode**

When `reservationMode = true`, replace whatever schedule status was calculated with:
```
"ESTADO: Aceptando reservas. El horario de operación del restaurante no afecta las reservas (son para fecha futura)."
```

**Change C — Suppress order-specific blocks in reservation mode**

When `reservationMode = true`:
- Replace `deliveryBlock` with empty string (reservations don't involve delivery)
- Replace `paymentBlock` with empty string
- Replace `escalationBlock` with empty string (don't redirect to phone for reservations)
- Replace `packagingBlock` with empty string
- Keep `menuBlock` (the customer might ask about the menu while reserving — harmless)
- Keep business name, location, tone, customer context

**Change D — Add reservation override note in dynamic prompt**

When `reservationMode = true`, add after the business name:
```
MODO ACTUAL: RESERVA. Tu ÚNICO objetivo es completar el FLUJO DE RESERVA del prompt principal. NO tomes pedidos. NO hables de horarios de cierre.
```

## What stays untouched

- `buildCoreSystemPrompt` (already has reservation mode working correctly)
- Order flow, confirmation, modification tags
- Reservation intent detection, validation, ICS generation
- Database, tables, UI

## Expected result

- When `reservationMode = true`, the dynamic prompt will be lean: business name + location + tone + menu + reservation mode indicator
- No more "ESTADO: Cerrado" confusing the AI during reservation flow
- No more escalation to phone number during reservation flow
- The AI will focus exclusively on the FLUJO DE RESERVA instructions from the core prompt

