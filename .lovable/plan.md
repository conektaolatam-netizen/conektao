

## Plan: Fix Packaging Charge Inconsistency

### Root Cause

The packaging validation code (`validateOrder`, lines 1048-1084) is already correct -- it applies packaging based purely on `requires_packaging` from the DB regardless of delivery type.

The problem is in the **AI system prompt** that instructs the bot to only include packaging for delivery/takeaway orders. This causes the AI to generate order JSON without `packaging_cost` for non-delivery orders, creating the inconsistency.

Two lines in the system prompt are responsible:

1. **Line 654**: `"EMPAQUES: Obligatorios en domicilio/llevar"` -- tells AI packaging is only for delivery/takeaway
2. **Line 833**: `"EMPAQUES (domicilio/llevar):\n"` -- labels the packaging section as delivery-only

### Changes (single file)

**File:** `supabase/functions/whatsapp-webhook/index.ts`

**Change 1 -- Line 654**: Update the AI instruction from:
```
4. EMPAQUES: Obligatorios en domicilio/llevar
```
To:
```
4. EMPAQUES: Obligatorios SIEMPRE que el producto lo requiera (según el menú). Aplica para TODOS los tipos de pedido
```

**Change 2 -- Line 833**: Update the packaging block label from:
```
"EMPAQUES (domicilio/llevar):\n"
```
To:
```
"EMPAQUES (aplica siempre que el producto lo requiera):\n"
```

### What is NOT touched

- `validateOrder()` logic (already correct)
- `buildPackagingMap()` function
- `getPackagingCost()` function
- Delivery type detection (`isDelivery` variable and its usage)
- Price validation, totals, confirmation flow
- Kitchen dispatch, pre-order logic
- Order structure, JSON format
- Multi-restaurant behavior
- Database schema

### Why this fixes it

The AI generates the order JSON (including `packaging_cost` per item) based on the system prompt instructions. When the prompt says "packaging only for delivery", the AI omits packaging costs for pickup orders. Even though `validateOrder` catches and corrects this, the AI's summary message to the customer already showed the wrong total without packaging. By updating the prompt, the AI will correctly include packaging for all order types from the start, and `validateOrder` serves as a safety net rather than the primary fix.

