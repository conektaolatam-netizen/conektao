

# Plan: Category-aware product resolver + follow-up dedup

## Part 1: Shared product resolver

### Create `supabase/functions/_shared/productResolver.ts`

A shared module with the category-aware scoring and resolution logic, used by both `whatsapp-webhook` and `alicia-daily-override`.

**Exported functions:**

```typescript
export function scoreProduct(query: string, product: { name: string; description?: string; category_name?: string }): number
export function resolveProduct(productName: string, products: any[], hints?: { unit_price?: number }): { id: string; name: string; price?: number } | null
export function resolveProductEntry(itemName: string, declaredPrice: number, entries: ProductEntry[]): { entry: ProductEntry; ambiguous: boolean }
```

**Category-aware disambiguation algorithm (for tied scores):**

1. Collect all candidates with `score === bestScore`
2. If one candidate → select it
3. If multiple candidates:
   - **Price-as-intent**: if `declaredPrice` matches exactly one candidate's price → select it
   - **Category token boost**: re-score candidates by checking if `itemName` tokens match `categoryName` tokens → pick highest
   - **Family consistency**: prefer candidate whose category appears most frequently among tied candidates
   - **Fallback**: return `ambiguous: true` → caller skips price correction

No hardcoded size keywords. Resolution uses only `categories.name` from DB.

### Update `whatsapp-webhook/index.ts`

- Import `resolveProductEntry` from `../_shared/productResolver.ts`
- Add `categoryName` field to `ProductEntry` (already exists) and `categoryId` field
- Replace lines 1159-1197 (single-pass best-match) with call to `resolveProductEntry()`
- When `ambiguous === true`, skip price correction (keep AI's declared price)
- Products query already joins `categories(name)` and selects `category_id` — no query changes needed

### Update `alicia-daily-override/index.ts`

- Import `scoreProduct`, `resolveProduct` from `../_shared/productResolver.ts`
- Remove the inlined `scoreProduct()` and `resolveProduct()` functions (lines 28-58)

## Part 2: Follow-up message dedup

### Database migration

```sql
ALTER TABLE public.whatsapp_conversations
ADD COLUMN IF NOT EXISTS follow_up_sent_at timestamptz DEFAULT NULL;
```

### Update stale pending check (webhook lines 2131-2169)

Move the stale check block to AFTER `from` is known (after line 2188). Then:

1. **Filter current sender**: add `.neq("customer_phone", from)` to the stale query
2. **30-min cooldown**: add `.or('follow_up_sent_at.is.null,follow_up_sent_at.lt.${thirtyMinAgo}')` filter
3. **2-min activity guard**: add `.lt("updated_at", twoMinAgo)` filter
4. **Set timestamp on send**: update statement adds `follow_up_sent_at: new Date().toISOString()`

### Fix reset loop (line 2968-2969)

Currently `followup_sent` resets to `active` on any message. Change: only reset to `active` if the conversation's `order_status` is `followup_sent` AND the user is actively responding (which is the current trigger context — correct behavior, but we must NOT clear `follow_up_sent_at` on reset so the 30-min guard still works).

## Files modified

| File | Change |
|------|--------|
| `supabase/functions/_shared/productResolver.ts` | **New** — shared scoring + resolution |
| `supabase/functions/whatsapp-webhook/index.ts` | Import shared resolver, replace scoring loop, move stale check, add dedup guards |
| `supabase/functions/alicia-daily-override/index.ts` | Import shared resolver, remove inlined scoring functions |
| DB migration | Add `follow_up_sent_at` column |

