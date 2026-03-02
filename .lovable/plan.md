
## Plan: Pre-Order Behavior When Restaurant is Closed

### Summary
When a customer confirms an order outside service hours, the bot will accept and save the order as a **pre-order** but will NOT say it's being prepared or sent to the kitchen. Instead, it will show the restaurant's `pre_order_message` or a dynamic fallback.

When open, everything stays exactly as it is now.

### What Changes (single file)
**File:** `supabase/functions/whatsapp-webhook/index.ts`

### Change 1 — Add `isRestaurantOpen()` helper (near `timeToMinutes`, ~line 80)

A small reusable function that reads `config.operating_hours` and returns `{ isOpen, preOrderMessage }`:

```typescript
function isRestaurantOpen(config: any): { isOpen: boolean; preOrderMessage: string } {
  const hours = config?.operating_hours || {};
  if (!hours.open_time || !hours.close_time) return { isOpen: true, preOrderMessage: "" };

  const { hour, minute } = getColombiaTime();
  const currentMinutes = hour * 60 + minute;
  const openMinutes = timeToMinutes(hours.open_time);
  const closeMinutes = timeToMinutes(hours.close_time);

  const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  const prepStart = hours.preparation_start || hours.open_time;
  const preOrderMessage = hours.pre_order_message
    || `Tomamos tu pedido, pero empezamos a preparar a las ${prepStart}`;

  return { isOpen, preOrderMessage };
}
```

### Change 2 — Modify confirmation response (line ~2335-2374)

After `saveOrder()` is called (line 2335), add the `isOpen` check to branch the confirmation message:

- **If open:** Keep the current message exactly as-is:
  `"Listo, [Name] Pedido confirmado! Ya lo estamos preparando. Pedido enviado a cocina"`

- **If closed:** Replace with a pre-order message:
  `"Listo, [Name] Pedido recibido! El restaurante abre a las [open_time]. [pre_order_message]. Te avisamos cuando empecemos a prepararlo"`

  Also set `order_status` to `"pre_order"` instead of `"confirmed"` so kitchen doesn't dispatch it.

### Change 3 — Modify idempotent confirmation (line ~2299-2311)

The idempotent duplicate check currently says `"Ya quedo confirmado. Tu pedido esta en preparacion"`. When closed, this should say `"Ya quedo registrado. Te avisamos cuando empecemos a preparar"` instead.

### What is NOT touched
- `saveOrder()` function (order is still saved to DB in all cases)
- Packaging logic, price validation, totals
- Payment logic and proof handling
- Email dispatch (still sends notification email)
- System prompt / schedule block (already correct)
- Menu, AI conversation flow
- Database schema (no new columns needed -- `order_status` already supports arbitrary strings)
- Multi-restaurant behavior

### Technical Details
- `config` object (from `whatsapp_configs`) is already in scope at the confirmation block (line 2070-2081)
- `config.operating_hours` contains `open_time`, `close_time`, `preparation_start`, `pre_order_message`
- The helper uses the same minute-based math already established in `timeToMinutes()` and `getColombiaTime()`
- The `order_status` field will be set to `"pre_order"` for closed-hours orders, which is a new status value but requires no schema change (it's a text field)
- The `saveOrder` function always runs regardless of open/closed (order is always persisted)
