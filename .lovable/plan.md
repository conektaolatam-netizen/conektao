

# Plan: Apply `system_overrides` dynamically in backend logic

## Overview

Add a `getActiveOverrides()` utility to the `whatsapp-webhook` edge function and integrate it at four key points: product loading (menu/availability), price validation, restaurant open check, and delivery validation. The existing `daily_overrides` prompt injection remains untouched.

## Step 1: Add `getActiveOverrides()` utility function

Add a function in `whatsapp-webhook/index.ts` (near the top utility section, ~line 115):

```typescript
async function getActiveOverrides(restaurantId: string): Promise<any[]> {
  const { data } = await supabase
    .from("system_overrides")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .lte("start_time", new Date().toISOString())
    .gte("end_time", new Date().toISOString());
  return data || [];
}
```

Also add two helpers to query specific override types:

```typescript
function getDisabledProductIds(overrides: any[]): Set<string> {
  return new Set(
    overrides
      .filter(o => o.type === "disable" && o.target_type === "product" && o.target_id)
      .map(o => o.target_id)
  );
}

function getPriceOverrides(overrides: any[]): Map<string, number> {
  const map = new Map();
  for (const o of overrides) {
    if (o.type === "price_override" && o.target_type === "product" && o.target_id) {
      const price = parseFloat(o.value);
      if (!isNaN(price) && price > 0) map.set(o.target_id, price);
    }
  }
  return map;
}

function isRestaurantClosedOverride(overrides: any[]): boolean {
  return overrides.some(o => o.type === "disable" && o.target_type === "restaurant" && o.value === "closed");
}

function isDeliveryDisabledOverride(overrides: any[]): boolean {
  return overrides.some(o => o.type === "disable" && o.target_type === "delivery" && o.value === "no_delivery");
}
```

## Step 2: Load overrides once per message and apply to products

In the main webhook handler (~line 2622), after loading `prods` and building `prodsWithCategory`, load overrides and filter/modify products:

```typescript
// After line 2641 (prodsWithCategory built)
const activeOverrides = await getActiveOverrides(rId);
const disabledIds = getDisabledProductIds(activeOverrides);
const priceMap = getPriceOverrides(activeOverrides);

// Filter out disabled products, apply price overrides
const effectiveProducts = prodsWithCategory
  .filter((p: any) => !disabledIds.has(p.id))
  .map((p: any) => priceMap.has(p.id) ? { ...p, price: priceMap.get(p.id) } : p);
```

Then use `effectiveProducts` instead of `prodsWithCategory` for:
- `buildPrompt()` call (~line 2734) — menu generation
- `validateOrder()` call (~line 2757) — order price validation

Keep `prodsWithCategory` reference intact for the confirmation flow (line 2401 has its own product load).

## Step 3: Apply overrides in the confirmation flow

In the confirmation section (~line 2389-2401), after loading `confirmProds`, apply the same override logic:

```typescript
// After line 2400
const confirmOverrides = await getActiveOverrides(rId);
const confirmDisabled = getDisabledProductIds(confirmOverrides);
const confirmPrices = getPriceOverrides(confirmOverrides);

const effectiveConfirmProds = confirmProdsWithCategory
  .filter((p: any) => !confirmDisabled.has(p.id))
  .map((p: any) => confirmPrices.has(p.id) ? { ...p, price: confirmPrices.get(p.id) } : p);

// Check if any ordered items are disabled
const orderItems = resolvedOrder?.items || [];
for (const item of orderItems) {
  // Match item to product using the scoring logic
  // If matched product is in disabledIds → reject order
}
```

Add a blocked-product check before `validateOrder`: if any item in the order matches a disabled product, send a rejection message and return early.

## Step 4: Restaurant closed override

Modify the `isRestaurantOpen` usage. After loading `activeOverrides` (~line 2622+), check for restaurant closure:

```typescript
if (isRestaurantClosedOverride(activeOverrides)) {
  // Send "closed" message and return
  const resp = "Lo siento, hoy el restaurante está cerrado. ¡Te esperamos pronto! 🙏";
  await sendWA(pid, token, from, resp, true);
  // Update conversation
  return new Response(...);
}
```

This is placed **before** the normal AI processing, so no orders are taken.

## Step 5: Delivery disabled override

In the confirmation flow, when a delivery order is detected and `isDeliveryDisabledOverride(activeOverrides)` is true:

```typescript
const isDeliveryOrder = /domicilio|delivery/i.test(resolvedOrder?.delivery_type || "");
if (isDeliveryOrder && isDeliveryDisabledOverride(activeOverrides)) {
  const resp = "Lo siento, hoy no tenemos servicio de domicilio 🚫 ¿Te gustaría recogerlo en el local?";
  // Send and return
}
```

This check goes in the confirmation section, before `saveOrder`.

## Step 6: Inject override info into prompt

Add a small block to `buildDynamicPrompt` or append after the prompt is built, listing disabled products and price changes so the LLM is aware:

```typescript
let overridePromptBlock = "";
if (disabledIds.size > 0) {
  const disabledNames = effectiveProducts.length < prodsWithCategory.length
    ? prodsWithCategory.filter(p => disabledIds.has(p.id)).map(p => p.name)
    : [];
  if (disabledNames.length > 0) {
    overridePromptBlock += `\nPRODUCTOS NO DISPONIBLES HOY: ${disabledNames.join(", ")}. NO los ofrezcas.\n`;
  }
}
```

This supplements (not replaces) the existing `CAMBIOS DE HOY` block.

## What does NOT change

- `daily_overrides` JSONB system remains intact
- `CAMBIOS DE HOY` prompt injection stays as-is
- `buildMenuFromProducts()` and `buildDynamicPrompt()` function signatures unchanged
- Original `products` table records never modified
- `alicia-daily-override` edge function untouched
- POS/Billing frontend unchanged (scope is WhatsApp backend only)
- `saveOrder` function unchanged

## Files modified

| File | Change |
|------|--------|
| `supabase/functions/whatsapp-webhook/index.ts` | Add utility functions (~30 lines), integrate override loading and filtering at 3 points (~40 lines of additive changes) |

## Safety

- All changes are additive — existing logic paths unchanged
- `getActiveOverrides` returns `[]` on error (safe fallback = no overrides = current behavior)
- Price overrides only apply temporarily; DB records untouched
- Override expiry is automatic (time-based query)
- Single extra DB query per message (indexed on `restaurant_id, end_time`)

