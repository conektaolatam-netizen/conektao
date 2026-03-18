

# Fix: Change `promoted_products` column from `text[]` to `jsonb`

## Root Cause
The `promoted_products` column in `whatsapp_configs` is defined as `text[]` (PostgreSQL text array). When the frontend saves the categorized JSON structure, each object gets stringified into a text element. On reload, Supabase returns an array of strings, not parsed objects. The `parsePromotedProducts` function checks `typeof raw[0] === "object"` which fails for strings, so it returns `[]`.

## Solution

### 1. Database Migration
Alter the column from `text[]` to `jsonb`, converting existing data:

```sql
ALTER TABLE whatsapp_configs 
ALTER COLUMN promoted_products 
TYPE jsonb 
USING COALESCE(
  CASE 
    WHEN array_length(promoted_products, 1) IS NULL THEN '[]'::jsonb
    ELSE (
      SELECT jsonb_agg(elem::jsonb)
      FROM unnest(promoted_products) AS elem
    )
  END,
  '[]'::jsonb
);

ALTER TABLE whatsapp_configs 
ALTER COLUMN promoted_products 
SET DEFAULT '[]'::jsonb;
```

This safely converts existing text array data (stringified JSON objects) into proper JSONB.

### 2. `src/components/alicia-config/AliciaConfigUpselling.tsx`
Add a safety fallback in `parsePromotedProducts` to handle string elements (in case any edge case remains):

```typescript
function parsePromotedProducts(raw: any): PromotedCategory[] {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
  // Handle case where elements might be strings (from text[] column)
  let parsed = raw;
  if (typeof raw[0] === "string") {
    try {
      parsed = raw.map((item: string) => JSON.parse(item));
    } catch { return []; }
  }
  if (typeof parsed[0] === "object" && parsed[0].category) {
    return parsed as PromotedCategory[];
  }
  return [];
}
```

No other files need changes since the data structure itself is correct — only the column type was wrong.

