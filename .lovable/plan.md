

# Root Cause: Hardcoded "closed" messages pollute conversation history

## The Problem

When a restaurant closure override is active, the webhook sends a **hardcoded** response at lines 2954-2964:

```
"Lo siento, hoy el restaurante está cerrado. ¡Te esperamos pronto! 🙏"
```

This message gets saved to the conversation history (`whatsapp_conversations.messages`). If 5 customers write during the closure, the history accumulates 5 "we're closed" responses.

When the override expires at 10:00 AM:
1. `getActiveOverrides` correctly stops returning the override (via `end_time < now()`)
2. The `isRestaurantClosedOverride` check correctly returns `false`
3. The code proceeds to the AI prompt — BUT the conversation history still has recent "we're closed" messages
4. The AI reads the conversation context, sees the recent "closed" messages, and **continues saying the restaurant is closed** even though no override instruction is present

**Why price changes don't have this problem**: Price overrides flow through the AI prompt naturally — there's no hardcoded early-return. When the override expires, the instruction disappears from the prompt, and the AI adjusts immediately.

**Why manual removal has the same problem**: Removing the override clears `system_overrides` and `daily_overrides`, but the hardcoded "closed" messages remain in conversation history.

## Fix

### File: `supabase/functions/whatsapp-webhook/index.ts`

**Change 1**: Remove the hardcoded "closed" early-return at lines 2953-2965 (main message flow). Instead, let the closure instruction flow through the AI prompt naturally via the `overridesBlock` (which already includes "CAMBIOS DE HOY: Hoy el restaurante está cerrado hasta las 10:00 AM"). The AI will respond naturally about the closure, AND when the override expires, the instruction disappears and the AI responds normally — no stale history problem.

The `system_overrides` + `validateOrder` still enforce the hard block programmatically, so orders cannot actually be placed during closure.

**Change 2**: Keep the hardcoded block at line 2665 (confirmation flow) — this is correct because it prevents confirming orders during closure.

**Change 3**: Add a small hint to the system prompt when the restaurant was recently closed by override but is now open. After the `overridesBlock` is built, check if conversation history has recent "cerrado" messages but no active closure override — if so, append a note like:

```
IMPORTANTE: El restaurante está ABIERTO ahora. Ignora mensajes anteriores sobre cierre.
```

This prevents the AI from being confused by stale history.

### Summary of changes
- Remove hardcoded closure early-return from the main message flow (let AI handle it via prompt)
- Add "restaurant is now OPEN" hint when conversation has stale closure messages but no active closure override
- Keep the confirmation-flow closure block unchanged
- No changes to `system_overrides`, `validateOrder`, or `applyOverridesToProducts`

