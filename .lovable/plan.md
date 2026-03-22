

# Plan: Implicit Confirmation for Payment Proof Messages

## Problem
When `order_status` is `pending_confirmation` and the customer sends a message about payment (e.g., "Te envié una foto del comprobante de pago"), it doesn't match the `affirmativeKeywords` regex. The message falls through to the LLM, which hallucinated a confirmation response ("Tu pedido está confirmado...") without actually saving the order to the database or creating a kitchen order.

## Solution: Two-layer fix

### Layer 1: Add payment-related keywords as implicit affirmatives
**File: `supabase/functions/whatsapp-webhook/index.ts`**

After the existing `affirmativeKeywords` check (line ~3583), add a second check specifically for `pending_confirmation` status: if the customer mentions payment proof (comprobante, transferencia, pago, envié foto, etc.), treat it as an implicit confirmation.

```
Payment keywords to add:
/\b(comprobante|transferencia|pago|pagué|pague|envié|envie|nequi|daviplata|consign)/i
```

This triggers the same backend confirmation flow (validate → `saveOrder()` → build deterministic response → send), ensuring the order is saved before ANY message is sent to the customer.

### Layer 2: Post-AI guardrail for pending_confirmation
After the AI call (line ~4346), when `order_status` is still `pending_confirmation` and `parseOrder(ai)` returns null, scan the AI response for false confirmation language (confirmado, en preparación, listo tu pedido). If detected, replace it with a safe message asking the customer to explicitly confirm.

This prevents any future edge case where the AI hallucinates a confirmation for an unrecognized message type.

## Changes

**Single file: `supabase/functions/whatsapp-webhook/index.ts`**

1. Around line 3583, extend the `isAffirmative` logic:
   - Add `isPaymentProof` regex for payment-related keywords
   - When `order_status === "pending_confirmation"` and `isPaymentProof` is true, set `isAffirmative = true`

2. Around line 4524 (before sending AI response), add guardrail:
   - If `freshOrderStatus === "pending_confirmation"` and response contains confirmation language but no order tag was parsed → replace with safe prompt like "Gracias por el comprobante 💳 ¿Confirmas tu pedido? Responde *Sí* para confirmar"

## What stays untouched
- `saveOrder()`, `validateOrder()`, `buildOrderSummary()` — no changes
- Realtime, kitchen orders, email flow — no changes
- Cancel/change patterns — no changes
- Reservation flow — no changes
- All other order statuses — no changes

