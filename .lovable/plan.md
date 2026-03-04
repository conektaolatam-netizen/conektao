

## Plan: Fix fuzzy matching in `validateOrder()` to prioritize exact product names

### Problem
When the AI sends "Pizza Pepperoni Personal", the matching loop iterates all products. Both "pizza pepperoni personal" ($32,000) and "pizza pepperoni mediana" ($45,000) match via the normalized comparison (stripping "personal"/"mediana"). The last match wins, so whichever comes last in the map overwrites the correct price.

### Solution
Replace the current linear loop (lines 1062-1076) with a **scored matching** approach that prioritizes:

1. **Exact match** (score 100) — `itemLower === prodName` → immediate winner
2. **Token-overlap scoring** — count how many tokens from the item name appear in the product name and vice versa, penalizing extra/missing tokens
3. **Best score wins** — ties broken by shortest name (most specific product)

### Single file change: `supabase/functions/whatsapp-webhook/index.ts`

**Replace lines 1061-1076** (the matching block inside the `for` loop) with:

```typescript
if (Object.keys(priceMap).length > 0) {
  let bestScore = 0;
  // Tokenize item name
  const itemTokens = itemLower.split(/\s+/).filter(Boolean);

  for (const [prodName, price] of Object.entries(priceMap)) {
    // 1) Exact match → immediate winner
    if (prodName === itemLower) {
      bestMatch = prodName;
      bestPrice = price;
      break;
    }

    // 2) Score by token overlap
    const prodTokens = prodName.split(/\s+/).filter(Boolean);
    let score = 0;

    // +3 per item token found in product name
    for (const t of itemTokens) {
      if (prodTokens.includes(t)) score += 3;
    }

    // +2 if full string containment either direction
    if (itemLower.includes(prodName) || prodName.includes(itemLower)) score += 2;

    // -1 penalty per extra token in product not in item (punishes "mediana" when item says "personal")
    for (const t of prodTokens) {
      if (!itemTokens.includes(t)) score -= 1;
    }

    // Only consider if at least one token matched
    if (score > bestScore || (score === bestScore && bestMatch && prodName.length < bestMatch.length)) {
      bestScore = score;
      bestMatch = prodName;
      bestPrice = price;
    }
  }
}
```

### Why this works for the reported bug

- Item: `"pizza pepperoni personal"` → tokens: `["pizza", "pepperoni", "personal"]`
- Product A: `"pizza pepperoni personal"` → exact match, score 100, immediate break
- Even without exact match, Product A scores higher because "personal" token matches (+3) while Product B "pizza pepperoni mediana" gets a -1 penalty for "mediana" not being in item tokens

### What is NOT modified
- Financial recalculation (lines 1128-1153) — untouched
- Packaging logic (lines 1089-1125) — untouched  
- `buildPriceMap()`, `buildPackagingMap()`, `getPackagingCost()` — untouched
- No DB changes, no UI changes

