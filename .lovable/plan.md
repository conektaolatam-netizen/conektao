

# Plan: Remove legacy format + add category_id

## Changes

### 1. `src/components/alicia-config/AliciaConfigUpselling.tsx`
- Remove `parsePromotedProducts` legacy `string[]` handling (lines 61-65) — only keep the new format, return `[]` for unrecognized data
- Update product query to also select `category_id` from products table
- Update `MenuProduct` interface to include `category_id: string`
- Update `PromotedCategory` interface to include `category_id: string`
- In `toggleProduct`, pass `categoryId` and store it in the category object
- When loading from DB, the format already includes `category_id`

### 2. `supabase/functions/generate-alicia/index.ts` (lines 162-176)
- Remove the `typeof item === "string"` legacy branch (line 167-168)
- Keep only the `item.category && Array.isArray(item.products)` branch

### 3. `supabase/functions/whatsapp-webhook/index.ts` (lines 1093-1106)
- Remove the `typeof item === "string"` legacy branch (lines 1097-1098)
- Keep only the categorized object format

### Data format after changes
```json
[
  {
    "category": "Entradas",
    "category_id": "uuid-cat-1",
    "products": [
      { "product_id": "uuid-1", "name": "Nuditos de Ajo", "note": "recién salidos del horno" }
    ]
  }
]
```

