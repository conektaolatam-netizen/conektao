

# Bug Analysis: Alicia stops responding after override expires

## Root Cause

There is a **critical crash** in `buildDynamicPrompt()` (whatsapp-webhook, line 953). The cleanup code references `restaurant_id` as a bare variable, but it's never passed as a parameter to this function. It only exists in the outer handler scope.

```
.eq("restaurant_id", restaurant_id)  // ← ReferenceError: restaurant_id is not defined
```

The error log confirms this:
```
🔥 CRITICAL ERROR: restaurant_id is not defined
    at buildDynamicPrompt (index.ts:828)
```

### Why it only crashes after expiration

- When the override is **active**: `cleaned.length === dailyOverrides.length` → cleanup code is **skipped** → no crash → works fine.
- When the override **expires**: `cleaned.length !== dailyOverrides.length` → cleanup code **runs** → hits the undefined `restaurant_id` → **crashes the entire request** → Alicia returns nothing.
- When dashboard reloads: `AliciaDailyChat.tsx` cleans the JSONB from the frontend → next webhook call has no expired overrides → no cleanup triggered → no crash.

## Fix

**In `supabase/functions/whatsapp-webhook/index.ts`**, line 953: replace `restaurant_id` with `config.restaurant_id`, which is available in scope since `config` is a parameter of `buildDynamicPrompt`.

```typescript
// Line 953 — change:
.eq("restaurant_id", restaurant_id)
// To:
.eq("restaurant_id", config.restaurant_id)
```

This is a single-line fix. No other files need changes.

## Verification

After deploying, test by creating an override with a short `until_hour` (e.g., 5 minutes from now), wait for it to expire, then send a WhatsApp message. Alicia should respond normally and the expired override should be auto-cleaned from the JSONB.

