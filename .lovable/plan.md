

# Plan: Fix pre-order confirmation message when between open_time and schedule_start

## Problem

When the current time is between `open_time` and `schedule_start`, `isRestaurantOpen()` returns `isOpen: true`. The confirmation flow at line 2901 then sends "Ya lo estamos preparando / Pedido enviado a cocina", which is incorrect — the kitchen hasn't started yet.

## Solution

Add an `isPreOrder` flag to `isRestaurantOpen()` return value, then use it in the confirmation flow to show the pre-order message instead of the "sent to kitchen" message.

### Change 1: Update `isRestaurantOpen` (lines 137-154)

Add `isPreOrder: boolean` to the return type. It's `true` when the restaurant is physically open but `schedule_start` hasn't been reached yet:

```typescript
function isRestaurantOpen(config: any): { isOpen: boolean; isPreOrder: boolean; preOrderMessage: string } {
  const hours = config?.operating_hours || {};
  if (!hours.open_time || !hours.close_time) {
    return { isOpen: false, isPreOrder: false, preOrderMessage: "" };
  }
  const { hour, minute } = getRestaurantTimeInfo(config);
  const currentMinutes = hour * 60 + minute;
  const openMinutes = timeToMinutes(hours.open_time);
  const closeMinutes = timeToMinutes(hours.close_time);
  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  const schedStart = hours.schedule_start || hours.open_time;
  const schedStartMin = timeToMinutes(schedStart);
  const isPreOrder = isOpen && currentMinutes < schedStartMin;
  const preOrderMessage = hours.pre_order_message || `Tomamos tu pedido, pero empezamos a atender a las ${schedStart}`;
  return { isOpen, isPreOrder, preOrderMessage };
}
```

### Change 2: Update confirmation flow (lines 2894-2908)

Use the new `isPreOrder` flag to create a third branch — order is accepted but NOT sent to kitchen:

```typescript
const { isOpen, isPreOrder, preOrderMessage } = isRestaurantOpen(config);
const hours = config?.operating_hours || {};
const fmt12Conf = (t: string): string => {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${(m || 0).toString().padStart(2, "0")} ${suffix}`;
};

let resp: string;
let finalStatus: string;

if (isOpen && !isPreOrder) {
  // Fully operational — send to kitchen
  resp = `Listo${nameGreeting} ✅ Pedido confirmado!\n\nYa lo estamos preparando 🍕\n📩 Pedido enviado a cocina${paymentInstruction}`;
  finalStatus = "confirmed";
} else if (isOpen && isPreOrder) {
  // Open but before schedule_start — accept as pre-order
  const schedStart = hours.schedule_start || hours.open_time;
  resp = `Listo${nameGreeting} ✅ Pedido recibido!\n\n${preOrderMessage}\n🕐 Empezamos a preparar a las ${fmt12Conf(schedStart)}${paymentInstruction}`;
  finalStatus = "pre_order";
} else {
  // Closed
  const openTime = hours.open_time || "";
  resp = `Listo${nameGreeting} ✅ Pedido recibido!\n\n🕐 El restaurante abre a las ${openTime}.\n${preOrderMessage}${paymentInstruction}`;
  finalStatus = "pre_order";
}
```

### Change 3: Update idempotency check (lines 2789-2793)

Same logic for duplicate detection — use `isPreOrder`:

```typescript
const { isOpen: idempOpen, isPreOrder: idempPreOrder } = isRestaurantOpen(config);
const resp = (idempOpen && !idempPreOrder)
  ? "Ya quedó confirmado ✅ Tu pedido está en preparación"
  : "Ya quedó registrado ✅ Te avisamos cuando empecemos a preparar";
const idempStatus = (idempOpen && !idempPreOrder) ? "confirmed" : "pre_order";
```

### Files changed
- `supabase/functions/whatsapp-webhook/index.ts` — 3 localized edits

### What is NOT modified
- `checkRestaurantAvailability()` — already correctly allows pre-orders through
- `buildDynamicPrompt` schedule block — already has the pre-order AI context
- Database, overrides, validateOrder

