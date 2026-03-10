

# Plan: Fix Order Summary Formatting Issues

## Problem 1: Category label repeated in product name
The AI's JSON `item.name` may already contain the category (e.g., "A la española (Pizzas - Personal)"). Then `validateOrder` sets `item.category_name = "pizzas - personal"` from the DB match, and `buildOrderSummary` appends it again as `catLabel`. If the AI included it multiple times in the name, it compounds.

**Fix in `buildOrderSummary` (line 1458-1459)**: Before appending `catLabel`, strip any existing parenthesized category from `item.name`. Also, only append `catLabel` if it's not already present in the cleaned name.

## Problem 2: AI includes "Empaque" as a standalone item in the items array
The AI sometimes adds a separate line item like `{name: "Empaque", quantity: 1, unit_price: 2000}` in addition to setting `packaging_cost` on the actual product. This causes packaging to appear as both a line item AND a sub-line, and gets double-counted in the total.

**Fix in `validateOrder` (before the items loop, ~line 1349)**: Filter out items whose name matches packaging patterns (`/^📦?\s*empaque/i`). Their cost is already captured via `packaging_cost` on actual product items.

## Changes in `supabase/functions/whatsapp-webhook/index.ts`

### Change 1: Filter packaging pseudo-items in `validateOrder` (~line 1349)

Add before the `for` loop:
```typescript
// Remove AI-generated packaging pseudo-items — packaging is handled via packaging_cost per product
order.items = (order.items || []).filter((item: any) => {
  const name = (item.name || "").trim();
  return !/^📦?\s*empaque/i.test(name);
});
```

### Change 2: Clean item name and avoid duplicate category in `buildOrderSummary` (~line 1458)

Replace the catLabel + itemLines logic:
```typescript
// Strip any parenthesized category already embedded in the item name by the AI
let displayName = (item.name || "").replace(/\s*\([^)]*\)\s*/g, "").trim() || item.name;
const catLabel = item.category_name
  ? ` (${item.category_name.split(/\s+/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")})`
  : "";
itemLines += `- ${qty > 1 ? qty + "x " : ""}${displayName}${catLabel}: ${formatCOP(lineTotal)}\n`;
```

### Files changed
- `supabase/functions/whatsapp-webhook/index.ts` — 2 localized edits

