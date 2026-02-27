

# Fix: Packaging Not Charged for Pickup Orders

## Problem
Line 1026 in `whatsapp-webhook/index.ts` wraps all packaging logic inside `if (isDelivery)`, causing pickup orders to skip packaging entirely -- even when products have `requires_packaging = true` and `packaging_price > 0`.

## Fix (Single Line Change)
Remove the `if (isDelivery)` guard on line 1026 so the packaging block runs for **all** order types.

```text
Before (line 1026):
    if (isDelivery) {

After:
    {  // PACKAGING: always apply based on product config
```

The closing `}` on line 1060 also becomes just the block's closing brace (no behavioral change needed since the indented code stays the same).

Concretely: remove `if (isDelivery)` and replace it with a simple block or just unindent the code. Everything inside (lines 1027-1059) remains untouched.

## What Changes
| Aspect | Before | After |
|--------|--------|-------|
| Pickup + requires_packaging=true | Packaging = 0 (bug) | Packaging = packaging_price (correct) |
| Delivery + requires_packaging=true | Packaging applied | Unchanged |
| requires_packaging=false | Packaging = 0 | Unchanged |
| packaging_price=0 | Packaging = 0 | Unchanged |

## Files Modified
- `supabase/functions/whatsapp-webhook/index.ts` -- remove `if (isDelivery)` wrapper at line 1026

## What Is NOT Changed
- `getPackagingCost()` function
- `buildPackagingMap()` function
- `validateOrder()` return format
- Subtotal/total calculation logic (lines 1063-1085)
- Order saving flow
- Webhook processing
- AI prompt logic
- Database schema

