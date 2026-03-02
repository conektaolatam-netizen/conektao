
## Plan: Fix Schedule Validation — Timezone and Decimal Math

### Problem
Two bugs in `supabase/functions/whatsapp-webhook/index.ts` (lines 720-738):

1. **Wrong decimal conversion**: `parseFloat("15:40".replace(":", "."))` produces `15.40`, which is NOT 15 hours 40 minutes (should be `15.667`). This means a restaurant set to open at 15:40 actually gets treated as opening at 15:24 (0.40 * 60 = 24 minutes).

2. **Timezone leak**: `new Date().getMinutes()` uses server time instead of Colombia time, even though `getColombiaTime()` already provides the correct `minute` value.

### Scope
Only lines 720-738 in `supabase/functions/whatsapp-webhook/index.ts`. Nothing else changes.

### Solution

**Add a helper function** near the top of the file (after `getColombiaTime()`):

```typescript
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}
```

**Replace lines 720-738** with minute-based comparison using only `getColombiaTime()`:

```typescript
// Schedule
let scheduleBlock = "";
if (hours.open_time && hours.close_time) {
  const { hour, minute } = getColombiaTime();
  const currentMinutes = hour * 60 + minute;
  const openMinutes = timeToMinutes(hours.open_time);
  const closeMinutes = timeToMinutes(hours.close_time);
  const prepStart = hours.preparation_start || hours.open_time;

  if (currentMinutes < openMinutes) {
    scheduleBlock = `ESTADO: Cerrado. Abrimos a las ${hours.open_time}.`;
    if (hours.accept_pre_orders) {
      scheduleBlock += ` Puedes tomar el pedido: "${hours.pre_order_message || `Empezamos a preparar a las ${prepStart}`}"`;
    }
  } else if (currentMinutes >= closeMinutes) {
    scheduleBlock = `ESTADO: Cerrando. Horario: ${hours.open_time} - ${hours.close_time}.${hours.may_extend ? " A veces nos extendemos." : ""}`;
  } else {
    scheduleBlock = `ESTADO: ABIERTOS. ${hours.open_time} - ${hours.close_time}.`;
  }
}
```

### What is NOT touched
- Messages, tone, wording (identical output strings)
- Pre-order logic (`accept_pre_orders`, `pre_order_message`)
- `may_extend` behavior
- `peak_hours` logic
- Packaging, order validation, confirmation flow
- All other business logic
- No other files

### Technical details
- `getColombiaTime()` already exists at line 68 and returns `{ hour, minute, ... }`
- The `h` variable from the destructured `getColombiaTime()` call at line 660 is still available in scope, but we call `getColombiaTime()` again locally for clarity and to avoid any stale-value risk
- Minute-based math: `15:40` becomes `940` minutes, compared against current time also in minutes -- no floating point ambiguity
