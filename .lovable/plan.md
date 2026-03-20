

# Plan: Fix 7 Reservation Issues

## Issue Analysis

### 1. Wrong date calculation ("sábado 22" but tomorrow is "sábado 21")
**Root cause**: The prompt uses `new Date().toISOString().split("T")[0]` which is UTC time. The server runs in UTC, so at night in Colombia (UTC-5) the date shown is already "tomorrow" in UTC. The AI calculates relative dates from the wrong base.
**Fix**: Use `getRestaurantDate(offset)` instead of `new Date().toISOString()` to inject the restaurant's local date into the reservation prompt.

### 2. Move Reservas tab to alicia-dashboard
**Fix**: Add a "Reservas" tab in `WhatsAppDashboard.tsx` next to Conversaciones. Import `AliciaConfigReservations` for the agenda portion, or create a lightweight reservations panel that shows the day's reservations with status management.

### 3. Cancel reservation from chat not reflected in DB
**Root cause**: There is no `---CANCELAR_RESERVA---` tag handler. The AI says "cancelada" conversationally but nothing updates the `reservations` table.
**Fix**: Add a `---CANCELAR_RESERVA---{phone}---FIN_CANCELAR---` tag to the prompt. Add `parseCancelReservation()` and handler that finds the most recent `confirmed`/`pending` reservation for that phone+restaurant and sets `status = "cancelled"`.

### 4. Add "Restablecer a confirmado" button + "Cancelar" button for all statuses
**Current UI**: Only `pending` shows confirm/cancel. Only `confirmed` shows completed/no_show.
**Fix**: Add buttons for `completed`, `no_show`, and `cancelled` statuses to restore to `confirmed`. Add a cancel button to `confirmed` status.

### 5. Query reservations from chat
**Fix**: Add reservation lookup in the prompt instructions: when the user asks about their reservation, the backend should inject recent reservations for that phone number into the conversation context. Add a pre-AI check that queries `reservations` for the customer's phone.

### 6. AI says "confirmada" BEFORE backend validates slot availability
**Root cause**: Lines 4188-4192 send `cleanResp` (AI's confirmation text) to the customer BEFORE `processReservation()` checks availability. So customer sees "confirmada" then "slot full".
**Fix**: Do NOT send `cleanResp` before `processReservation()`. Instead, pass it to `processReservation()` and only send it if validation passes. If validation fails, send only the rejection message.

### 7. When slot is full, suggest available times (not past times if same day)
**Fix**: Enhance `checkSlotAvailability` to also return available slots for that date. Filter out past times if the date is today. Include these in the slot_full response.

## Files to Change

### File 1: `supabase/functions/whatsapp-webhook/index.ts`

**Change A — Fix date injection (line 1114-1116)**
Replace `new Date()` with restaurant-local time:
```
const tz = config?.operating_hours?.timezone || "UTC-5";  // available from outer scope
const offset = parseTimezoneOffset(tz);
const now = getRestaurantTime(offset);
const todayStr = getRestaurantDate(offset);
const todayDayName = dayNamesArr[now.getDay()]; // local day
```
Need to pass `config` into the reservation prompt builder — it's already available in `buildCoreSystemPrompt` params.

**Change B — Don't send AI response before validation (lines 4186-4203)**
Change flow:
```
if (parsedReservation) {
  // Do NOT send cleanResp yet — validate first
  return await processReservation(
    parsedReservation.reservation, rId, conv.id, from,
    config, pid, token, freshMsgs,
    parsedReservation.clean,  // pass clean text to send only on success
  );
}
```

Update `processReservation` signature to accept optional `preConfirmMsg`. Only send it after validation+insert succeeds, before the system confirmation message.

**Change C — Add cancel reservation tag to prompt (line 1138-1142)**
Add to REGLAS DE RESERVA:
```
- Si el cliente quiere CANCELAR una reserva existente, genera el tag:
  ---CANCELAR_RESERVA---{"phone":"<phone>"}---FIN_CANCELAR---
```

**Change D — Add `parseCancelReservation()` function**
Similar to `parseReservation()`, extracts phone from cancel tag.

**Change E — Add cancel reservation handler (after line 4203)**
When cancel tag detected:
1. Query `reservations` where `customer_phone = phone` and `restaurant_id = rId` and `status in ('confirmed','pending')`, order by `reservation_date desc`, limit 1
2. Update status to `cancelled`, set `cancelled_at`
3. Send confirmation message

**Change F — Inject customer's reservations into context**
Before AI call, when `isReservationMode`, query reservations for this phone number and inject as context:
```
RESERVAS EXISTENTES DEL CLIENTE:
- 2026-03-22 12:00 | 4 personas | confirmada
```

**Change G — Add available slots to slot_full response**
In `processReservation`, when slot is full, query available slots for that date and append to the rejection message. Filter out past times if date is today.

### File 2: `src/pages/WhatsAppDashboard.tsx`

**Change A — Add "Reservas" tab**
Add a new tab trigger with CalendarDays icon after "Bloqueados". Import a new `ReservationsPanel` component (or reuse reservation list logic from `AliciaConfigReservations`).

### File 3: `src/components/alicia-dashboard/ReservationsPanel.tsx` (NEW)

Lightweight panel showing:
- Date navigator (prev/next day)
- Reservation cards with status badges
- Action buttons per status:
  - `pending`: confirm, cancel
  - `confirmed`: completed, no_show, cancel
  - `completed`/`no_show`/`cancelled`: restore to confirmed

### File 4: `src/components/alicia-config/AliciaConfigReservations.tsx`

**Change A — Add restore/cancel buttons for all statuses**
- `completed`, `no_show`: add "Restablecer" button → sets to `confirmed`
- `cancelled`: add "Restablecer" button → sets to `confirmed`
- `confirmed`: add "Cancelar" button

## What stays untouched
- Order flow (PEDIDO_CONFIRMADO, CAMBIO, ADICION tags)
- Suggestion flow, upselling, service overrides
- Email sending, ICS generation logic (correct, just timing changes)
- All existing tables

## Expected Results
- Dates calculated correctly in restaurant's timezone
- Reservas tab visible in alicia-dashboard
- Cancel from chat updates DB
- All reservation statuses have restore/cancel actions
- Customer can ask about their reservations
- AI confirmation NOT sent until backend validates
- Slot full message includes available alternatives

