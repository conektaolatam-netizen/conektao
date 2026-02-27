

# Plan: Add `portions` Column to Products (Strictly Additive)

## Overview
Add a `portions` field to the `products` table so the AI assistant can answer customer questions about how many portions/slices a product has. This is a safe, additive-only change with zero impact on existing logic.

## 1. Database Migration

Add column to the `products` table:
```sql
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS portions integer NOT NULL DEFAULT 1;
```

All existing rows automatically get `portions = 1`. No table recreation. No constraint changes.

## 2. Backend Query Updates (Append Field Only)

The following product queries need `portions` appended to their select list:

**`supabase/functions/whatsapp-webhook/index.ts`** (2 queries):
- Line ~2397: Add `portions` to the confirmation price-snapshot query
- Line ~2615: Add `portions` to the main product loading query

**`supabase/functions/generate-alicia/index.ts`** (1 query):
- Line ~297: Already uses `select("*, categories(name)")` so `portions` is automatically included. No change needed.

**`supabase/functions/conektao-ai/index.ts`** (1 query):
- Line ~100: Add `portions` to the product select for AI context.

**Frontend files** that use `select('*')` or broader selects (e.g., `ProductsCatalog`, `Billing`, `POSSystem`, `ProductManager`) will automatically pick up the new column since they use `*`. No changes needed there.

## 3. AI Prompt Context Updates

**`buildMenuFromProducts()` in `whatsapp-webhook/index.ts`** (line ~874):
- When building the menu string for each product, append portions info when `portions > 1`:
  - Example output: `Pizza Mediana | Descripcion | $35,000 | 6 porciones`
- If `portions` is 1 or undefined, omit (backward compatible).

**`buildBusinessConfigPrompt()` in `generate-alicia/index.ts`** (line ~107):
- In the product listing loop (line ~167), append portions when available and > 1.

**`buildDynamicPrompt()` in `whatsapp-webhook/index.ts`** (line ~700 area):
- Same treatment in the menu_data loop (line ~766): if product has portions info, include it.

## 4. AI Behavioral Rule

Add a single line to the core system prompt (`buildCoreSystemPrompt`) in both `whatsapp-webhook` and `generate-alicia`:
- Rule: "Si el cliente pregunta cuantas porciones tiene un producto, responde SOLO con el dato del menu. NO inventes porciones."
- This ensures the AI uses the stored value and never guesses.

## 5. What Will NOT Be Changed
- Order validation (`validateOrder`) -- untouched
- `buildPriceMap` / `buildPackagingMap` -- untouched  
- Webhook verification flow -- untouched
- Message routing logic -- untouched
- Database write operations for orders -- untouched
- Existing JSON structures -- untouched
- Frontend components -- no UI changes needed
- No function signatures changed
- No existing fields renamed or removed

## Files Modified
| File | Change |
|------|--------|
| New migration SQL | `ALTER TABLE products ADD COLUMN portions` |
| `supabase/functions/whatsapp-webhook/index.ts` | Add `portions` to 2 select queries, update `buildMenuFromProducts`, add 1 AI rule line |
| `supabase/functions/generate-alicia/index.ts` | Update `buildBusinessConfigPrompt` menu output, add 1 AI rule line |
| `supabase/functions/conektao-ai/index.ts` | Add `portions` to product select |

## Risk Assessment
- **Zero risk**: Column has NOT NULL DEFAULT 1, so all existing code continues working
- **No breaking changes**: Only appending a field to selects and menu text
- **Backward compatible**: Products without explicit portions show as 1

