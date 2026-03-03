

## Plan: Remove packaging_rules Redundancy — Products as Single Source of Truth

### Summary
Replace all `config.packaging_rules` usage in the two edge functions with a dynamically built packaging block from the `products` table. Remove the packaging section from the Alicia config UI. Drop the `packaging_rules` column.

---

### Changes

#### 1. `supabase/functions/whatsapp-webhook/index.ts` (3 edits)

**a) Add `packaging_price` to products select (line 2617)**
Current: `"id, name, price, description, category_id, requires_packaging, portions, categories(name)"`
Add: `packaging_price` to the select string.

**b) Remove `packaging_rules` reference (line 774)**
Delete: `const packaging = config.packaging_rules || [];`

**c) Replace packaging block builder (lines 871-876)**
Instead of reading from `packaging` array, build from `products` parameter:
```ts
const packagingProducts = products.filter((p: any) => p.requires_packaging && p.packaging_price > 0);
const packagingBlock = packagingProducts.length > 0
  ? "EMPAQUES (aplica siempre que el producto lo requiera):\n" +
    packagingProducts.map((p: any) => `- ${p.name}: +$${Number(p.packaging_price).toLocaleString("es-CO")}`).join("\n")
  : "";
```

#### 2. `supabase/functions/generate-alicia/index.ts` (3 edits)

**a) Remove `packaging_rules` reference (line 112)**
Delete: `const packaging = config.packaging_rules || [];`

**b) Replace packaging block (lines 197-200)**
Same dynamic approach from `products` parameter (already passed to `buildBusinessConfigPrompt`).

**c) Update stats `has_packaging` (line 335)**
Change from `!!(config.packaging_rules?.length)` to `!!(products?.some((p: any) => p.requires_packaging))`.

#### 3. Remove UI components

**a) Delete `src/components/alicia-config/AliciaConfigPackaging.tsx`**

**b) Delete `src/components/alicia-setup/Step5Packaging.tsx`**

**c) Update `src/pages/AliciaConfigPage.tsx`:**
- Remove import of `AliciaConfigPackaging`
- Remove the `packaging` entry from `SECTIONS` array (line 29)
- Remove the `case "packaging"` from `renderContent()` (line 157)

#### 4. Drop `packaging_rules` column
Migration: `ALTER TABLE whatsapp_configs DROP COLUMN IF EXISTS packaging_rules;`

### What is NOT modified
- `buildPackagingMap()`, `getPackagingCost()`, `validateOrder()` — untouched
- Financial calculations, delivery logic, peak logic, order flow — untouched
- `requires_packaging` and `packaging_price` DB fields — untouched (they are the source of truth)

