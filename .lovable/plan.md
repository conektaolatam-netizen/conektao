

# Plan: Fix pickup override detection and strengthen delivery/pickup backend enforcement

## Root Causes Identified

### Bug 1: Pickup overrides stored with wrong `target_type`
The `alicia-daily-override` AI parser only knows `target_type: "product|restaurant|delivery"` — no `"pickup"` option exists. When a user says "no hay recogida", it gets stored as `target_type: "delivery"` + `value: "no_pickup"`. But `isPickupDisabledOverride()` checks `target_type === "pickup"`, which **never matches** any DB record.

DB evidence: All 4 pickup overrides have `target_type: "delivery"` + `value: "no_pickup"`.

### Bug 2: AI remembers expired restrictions from conversation history
Even after overrides expire in the DB, the AI sees old messages like "hoy no tenemos servicio de domicilio" and repeats them. Recovery hints help but aren't 100% reliable.

### Bug 3: No mid-conversation interception
Backend only blocks at order-parsing and confirmation time. When the AI asks "domicilio o recogida?" and the user answers, the AI handles it from memory — which fails when stale or when context is lost.

## Solution: 4 changes

### Change 1: Fix `alicia-daily-override` parser — add `pickup` as a target_type

In the AI system prompt (line 85), add `pickup` as a valid target_type. Add examples for "no hay recogida":

```
"target_type": "product|restaurant|delivery|pickup",
```

Add examples:
```
- "no hay recogida hoy" → {"type":"delivery_change",...,"target_type":"pickup","value":"no_pickup",...}
- "no hay recogida hasta las 5" → {"type":"delivery_change",...,"target_type":"pickup","value":"no_pickup","until_hour":"17:00",...}
```

### Change 2: Fix `isPickupDisabledOverride()` and `isDeliveryDisabledOverride()` for backward compatibility

Update both functions to handle both old and new data formats:

```typescript
function isDeliveryDisabledOverride(overrides: any[]): boolean {
  return overrides.some(o => o.type === "disable" && o.value === "no_delivery");
}

function isPickupDisabledOverride(overrides: any[]): boolean {
  return overrides.some(o => o.type === "disable" && 
    (o.target_type === "pickup" || (o.target_type === "delivery" && o.value === "no_pickup"))
  );
}
```

Also update `buildOverridePromptBlock()` pickup detection to match the same logic.

### Change 3: SQL data fix for historical records

Update existing `system_overrides` records where `target_type = 'delivery'` AND `value = 'no_pickup'` to `target_type = 'pickup'`:

```sql
UPDATE system_overrides SET target_type = 'pickup' WHERE target_type = 'delivery' AND value = 'no_pickup';
```

### Change 4: Strengthen mid-conversation delivery/pickup interception

Currently the backend only intercepts at:
- Order parsing (line 3354) — when AI generates `---PEDIDO_CONFIRMADO---`
- Confirmation (line 2862) — when user says "sí"

But the AI can still **conversationally** deny/allow services incorrectly. Add an **early intercept** right after the AI response is generated (line 3341) but **before** sending it to the user. If the AI response mentions allowing a restricted service, override the response:

```typescript
// After AI response generated, before sending:
// If delivery is disabled and AI response seems to accept delivery, override
if (isDeliveryDisabledOverride(activeOverrides) && /domicilio|delivery/i.test(ai) && !/no.*domicilio|no.*delivery/i.test(ai)) {
  // Check if AI is accepting a delivery request it shouldn't
  const lastCustomerText = trailingCustomerTexts.join(" ").toLowerCase();
  if (/domicilio|delivery/i.test(lastCustomerText)) {
    resp = "Lo siento, hoy no tenemos servicio de domicilio 🚫 Solo estamos manejando pedidos para recoger en el local. ¿Te gustaría recoger tu pedido?";
  }
}
// Same for pickup
if (isPickupDisabledOverride(activeOverrides) && /recog|pickup/i.test(ai) && !/no.*recog|no.*pickup/i.test(ai)) {
  const lastCustomerText = trailingCustomerTexts.join(" ").toLowerCase();
  if (/recog|pickup|recoger/i.test(lastCustomerText)) {
    resp = "Lo siento, hoy no tenemos servicio de recogida 🚫 Solo estamos manejando domicilios. ¿Te gustaría pedirlo a domicilio?";
  }
}
```

## Files changed
- `supabase/functions/alicia-daily-override/index.ts` — add `pickup` target_type + examples
- `supabase/functions/whatsapp-webhook/index.ts` — fix helper functions + add mid-conversation intercept
- SQL data update for historical records

## What is NOT touched
- Price override logic (working correctly)
- Product unavailability logic (working correctly)
- Restaurant closure logic (working correctly)

