

# Plan: Show category name alongside product names

## Problem
When products share the same name (e.g., "A la española" exists as Personal and Mediana), the price response and order summary show duplicate names without context. The category name (which contains the size/variant info) is already available in the data but not displayed.

## Changes (single file: `supabase/functions/whatsapp-webhook/index.ts`)

### 1. `validateOrder()` — attach category name to order items (line ~1167)

After resolving `bestEntry`, copy `categoryName` onto the order item so `buildOrderSummary` can use it:

```js
if (bestEntry) {
  item.category_name = bestEntry.categoryName; // preserve for display
}
```

### 2. `buildOrderSummary()` — display category in item lines (line ~1264)

Change the item line format from:
```
- 1x A la española: $36.000
```
To:
```
- 1x A la española (Pizzas - Personal): $36.000
```

Logic: if `item.category_name` exists and is non-empty, append ` (CategoryName)` after the product name. The category name comes from the DB as-is (no hardcoding).

### 3. `handlePriceQuestion()` — show category in variant list (lines ~1367-1373)

Change the multi-variant display from:
```
- A la española: $49.000
```
To:
```
- A la española (Pizzas - Personal): $49.000
```

Logic: use the `categoryName` field already present in each `ProductEntry` variant. Title-case it for display since it's stored lowercase.

Also update the single-match response (line ~1381) to include category when available.

## No other files change
- `_shared/productResolver.ts` — untouched
- Product loading, override logic — untouched

