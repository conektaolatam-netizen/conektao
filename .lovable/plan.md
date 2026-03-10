

# Plan: Fix 3 Issues in Restaurant Availability Logic

## Issue 1: Pre-orders blocked when `open_time < now < schedule_start` and `accept_pre_orders = true`

**Problem**: `checkRestaurantAvailability()` at line 306-310 returns a hard block when `nowMinutes < schedStartMin`, regardless of `accept_pre_orders`. Previously the AI would take the order and tell the user preparation starts at `schedule_start`.

**Fix in `checkRestaurantAvailability()` (line 306-311)**:
- When `nowMinutes >= openMinutes` and `nowMinutes < schedStartMin`, check `hours.accept_pre_orders`
- If `true`: return `{ blocked: false, message: "" }` — let the flow continue, the AI prompt already has the schedule context via `scheduleBlock`
- If `false`: keep the current block message

Additionally, update the `scheduleBlock` (line 1032-1041) to handle the case `openMinutes <= currentMinutes < schedStartMin` when `accept_pre_orders = true`:
```
ESTADO: ABIERTOS pero pre-pedido. Atención desde ${schedStart}.
Mensaje pre-orden: "${hours.pre_order_message || ...}"
Indica al cliente que su pedido se empezará a preparar a las ${schedStart}.
```

## Issue 2: "Hoy abrimos desde la 1pm" override produces `value: "open_from_1pm"` which is not handled

**Problem**: The AI parser in `alicia-daily-override` generates `override_type: "enable"` and `value: "open_from_1pm"` for "abrimos desde la 1pm". The webhook's `checkRestaurantAvailability()` only checks for `value === "closed"` in `isRestaurantClosedOverride()` and daily closures filter by `/closed/i.test(o.value)`. An "open_from" override is effectively ignored.

**The correct interpretation**: "Hoy abrimos desde la 1pm" means the restaurant is **closed until 1pm**. It should create a `disable` override with `value: "closed"` and `until_hour: "13:00"`.

**Fix in `alicia-daily-override/index.ts`**: Update the AI prompt examples to map "abrimos desde las X" to a closure override:
```
- "hoy abrimos desde la 1pm" → {"type":"schedule_change","instruction":"Hoy el restaurante está cerrado hasta la 1:00 PM","override_type":"disable","target_type":"restaurant","product_name":null,"value":"closed","start_hour":null,"until_hour":"13:00"}
```
Replace the existing example at line 100 that generates `enable`/`open_from_9pm`.

## Issue 3: Closure end_time after `schedule_end`/`close_time` shows misleading reopen time

**Problem**: When a system_override has `end_time = 23:59:59` (default end-of-day), the bot says "Abriremos a las 11:59 PM" which is misleading — the restaurant wouldn't actually serve at that time.

**Fix in `checkRestaurantAvailability()` (lines 228-236)**:
When a closed override has an `end_time`, after converting to local time, compare it against `schedule_end` (or `close_time` as fallback):
- If the override's end time is **after** `schedule_end`/`close_time`, the restaurant won't actually reopen today. Show the "closed for today" message instead, mentioning tomorrow's `schedule_start` or `open_time` depending on `accept_pre_orders`.

Same logic for daily_overrides (lines 258-263): if `until_hour` is after `schedule_end`/`close_time`, show "closed for today" instead of "reopening at X".

### Files changed:
1. `supabase/functions/whatsapp-webhook/index.ts` — `checkRestaurantAvailability()` + `scheduleBlock`
2. `supabase/functions/alicia-daily-override/index.ts` — AI prompt example fix

