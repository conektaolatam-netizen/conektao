

# Plan: Dynamic Sub-Flow Architecture for Alicia's System Prompt

## Problem
Currently, `buildCoreSystemPrompt()` injects ALL flow instructions (orders + reservations) into a single monolithic prompt. Even with the recent consolidation, the prompt sends ~2,500-3,500 tokens of flow-specific instructions regardless of what the customer actually needs. This causes instruction dilution — the LLM deprioritizes `custom_rules` and business-specific constraints because they're buried among irrelevant flow instructions.

## Current Architecture

```text
Every request:
  Core (Identity + Anti-hallucination + Format + Trato) ← ~800 tokens
  + Order Flow (7 steps + confirmation + modifications) ← ~600 tokens  
  + Suggestion/Upselling rules ← ~300 tokens
  + Menu + Business Config ← ~1,500+ tokens
  + Reservation Flow (if reservationMode=true) ← ~500 tokens
  = ~3,500-4,000+ tokens ALWAYS
```

The `reservationMode` boolean already strips order-irrelevant blocks (delivery, packaging, payment) when active — but the inverse is not true: order-mode still loads the full core prompt even though reservation instructions aren't needed.

## Proposed Architecture

```text
Every request:
  CORE BLOCK (permanent, ~900 tokens)
    Identity, Anti-hallucination, Format, Trato, Audios/Stickers/Context
  + SUB-FLOW BLOCK (conditional, ~500-700 tokens)
    IF order_status = "reservation_flow" → RESERVATION sub-flow
    ELSE → ORDER sub-flow
  + BUSINESS CONFIG (permanent but mode-filtered, ~1,200+ tokens)
    Menu, Rules, Tone, Schedule, etc.
```

## Changes

**Single file: `supabase/functions/whatsapp-webhook/index.ts`**

### Change 1: Split `buildCoreSystemPrompt()` into 3 functions

1. **`buildCorePrompt(assistantName, escalationPhone)`** — ~900 tokens
   - Identity, Anti-hallucination, Format, Trato al Cliente, Audios/Stickers/Contexto
   - NO flow steps, NO tags, NO confirmation rules
   - Always injected

2. **`buildOrderFlowPrompt(suggestConfigs, greetingMessage, deliveryAvailable)`** — ~600 tokens
   - The 7-step order flow with suggestion injection points
   - JSON tag format + confirmation anti-loop + modifications
   - Only injected when `isReservationMode === false`

3. **`buildReservationFlowPrompt(reservationConfig, escalationPhone)`** — ~500 tokens
   - The 6-step reservation flow with date/time calculation
   - Reservation tag format + cancellation tag
   - Reservation-specific rules
   - Only injected when `isReservationMode === true`

### Change 2: Update `buildPrompt()` to conditionally compose

```text
function buildPrompt(..., reservationMode) {
  const core = buildCorePrompt(name, phone);
  const flow = reservationMode
    ? buildReservationFlowPrompt(resConfig, phone)
    : buildOrderFlowPrompt(suggestConfigs, greeting, deliveryAvailable);
  const dynamic = buildDynamicPrompt(..., reservationMode);
  return core + "\n\n" + flow + "\n\n" + dynamic;
}
```

### Change 3: `buildDynamicPrompt()` — already mode-aware, minimal changes

The existing `if (reservationMode)` block at line 1402-1412 already strips delivery/payment/packaging/overrides. This stays as-is — it already does the right thing for the business config layer.

### Change 4: Sync `generate-alicia/index.ts`

Since `generate-alicia` only generates the order flow (no reservation mode), it will use `buildCorePrompt() + buildOrderFlowPrompt() + buildBusinessConfigPrompt()`. The reservation flow is never included in the generated prompt — it's only injected at runtime by the webhook.

## Token Savings Estimate

- **Order requests** (95% of traffic): Save ~500 tokens (no reservation flow loaded)
- **Reservation requests** (5%): Save ~600 tokens (no order flow, no suggestions, no packaging/delivery)
- **Net effect**: Average ~500 fewer tokens per request, plus better adherence to `custom_rules` due to reduced dilution

## What stays untouched
- `buildDynamicPrompt()` — only minor adjustment to remove redundant `reservationMode` parameter handling since the flow is now external
- `buildSuggestionFlow()` — no changes
- All backend interceptors (validateOrder, Layer 2 guardrail, confirmation detection) — no changes
- Reservation flow activation logic (line 3990-4014) — no changes
- `buildMenuFromProducts()` — no changes

## Risk Assessment
- **Low risk**: The prompt content itself doesn't change — only the assembly logic changes to be conditional
- **Testing**: Both flows should be tested (order a product, make a reservation) to verify no instructions were accidentally dropped

