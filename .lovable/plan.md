

# Plan: Fix stale override enforcement after expiration

## Root Cause Analysis

### Issue 1: Restaurant stays "closed" after override expires
In `checkRestaurantAvailability` (line 226-251), when a closure system_override exists in `activeOverrides`:
- Line 238 checks `if (endMinutes > nowMinutes)` — if the override's end time has passed in local time, this is FALSE
- It falls through to line 250: `return { blocked: true, message: "Hoy el restaurante está cerrado..." }` — **unconditional block**
- This is a fallback that should only trigger when there's NO end_time, but it also catches expired overrides due to any DB/timing edge case

**Fix:** When `endMinutes <= nowMinutes`, the override has expired locally — **skip it** (don't block, continue to next priority check).

### Issue 2: "No hay domicilio" persists after delivery override expires
The delivery/pickup override enforcement during **conversation** relies entirely on the AI reading conversation history. After the override expires:
- `system_overrides` DB correctly excludes it
- `daily_overrides` JSONB correctly cleans it
- But the AI conversation history still contains messages like "hoy no tenemos servicio de domicilio"
- The AI reads this and repeats it

There's already a `reopenHint` (line 3249-3257) that injects "El restaurante está ABIERTO ahora" when stale closure messages are detected. But there's **no equivalent** for delivery or pickup overrides.

**Fix:** Add similar context recovery hints for delivery and pickup.

## Changes in `supabase/functions/whatsapp-webhook/index.ts`

### Change 1: Fix closure override fallthrough (line 248-250)

When `endMinutes <= nowMinutes`, the override has expired. Don't block — continue to next priority:

```typescript
      if (endMinutes > nowMinutes) {
        if (closeBoundary && endMinutes >= closeBoundary) {
          // ... existing "closed for today" logic
        }
        const endStr = fmt12(`${endH}:${endM}`);
        return { blocked: true, message: `El restaurante está cerrado...` };
      }
      // endMinutes <= nowMinutes → override expired locally, skip it
    }
    // Only block if NO end_time at all (indefinite closure for today)
    if (!closedOverride?.end_time) {
      return { blocked: true, message: "Hoy el restaurante está cerrado..." };
    }
    // Otherwise: override had an end_time that has passed → don't block
  }
```

### Change 2: Add delivery/pickup context recovery hints (after line 3257)

Check if recent AI messages mention "no hay domicilio/delivery" or "no hay recogida/pickup" but no active override exists:

```typescript
// Detect stale "no delivery" messages
if (!isDeliveryDisabledOverride(activeOverrides)) {
  const recentMsgs = (mergedMsgs || []).slice(-10);
  const hasStaleDeliveryMsg = recentMsgs.some((m: any) =>
    m.role === "assistant" && /no.*(domicilio|delivery|servicio de domicilio)/i.test(m.content || "")
  );
  if (hasStaleDeliveryMsg) {
    reopenHint += "\n\nIMPORTANTE: El servicio de DOMICILIO está disponible ahora. Ignora mensajes anteriores que digan que no hay domicilio.";
  }
}

// Detect stale "no pickup" messages
const hasPickupDisabled = activeOverrides.some(o => o.type === "disable" && o.target_type === "pickup");
if (!hasPickupDisabled) {
  const recentMsgs = (mergedMsgs || []).slice(-10);
  const hasStalePickupMsg = recentMsgs.some((m: any) =>
    m.role === "assistant" && /no.*(recogida|recoger|pickup)/i.test(m.content || "")
  );
  if (hasStalePickupMsg) {
    reopenHint += "\n\nIMPORTANTE: El servicio de RECOGIDA está disponible ahora. Ignora mensajes anteriores que digan que no hay recogida.";
  }
}
```

### Files changed
- `supabase/functions/whatsapp-webhook/index.ts` — 2 localized edits

