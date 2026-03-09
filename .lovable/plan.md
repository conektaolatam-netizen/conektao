

# Plan: Backend-built order summaries + price question handler

## Overview

Two changes to `supabase/functions/whatsapp-webhook/index.ts`:

1. **`buildOrderSummary()`** — replaces AI-generated summary text with backend-built text using validated prices
2. **`handlePriceQuestion()`** — intercepts price questions before AI, responds with DB prices from `effectiveProducts`

Both reuse the existing shared resolver from `_shared/productResolver.ts`. No other files change.

---

## 1. `buildOrderSummary(order, config, customerName?)`

Added near line ~1233 (after `validateOrder`).

Takes the validated order object + full `config` (for payment info) and builds a WhatsApp message:

```text
{restaurantName}: Listo, {customerName}. El total de tu pedido es de ${total}.

{paymentBlock from config.payment_config}

Tu pedido incluye:

- {qty}x {name}: ${unit_price * qty}
  📦 Empaque: ${packaging_cost * qty}   ← only if > 0

Subtotal: ${subtotal}
Empaques: ${packaging_total}           ← only if > 0
Total: ${total}

{delivery info if domicilio}

¿Me confirmas tu pedido para empezarlo a preparar?
Responde: "Sí, confirmar" o escribe qué quieres cambiar.
```

Payment block logic:
- Uses `config.payment_config.methods`, `config.payment_config.bank_details`, `config.payment_config.require_proof`
- Same data already available in the handler scope

The hidden JSON tag `---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO---` is **not** included in the sent message — it's only needed for AI→backend parsing, which already happened.

## 2. Order detection block change (lines ~2897-2917)

Current:
```js
resp = parsed.clean || "Pedido registrado! 🍽️";
await sendWA(pid, token, from, resp, true);
```

New:
```js
resp = buildOrderSummary(validated.order, config, parsed.order.customer_name || freshCustomerName);
await sendWA(pid, token, from, resp, true);
```

The AI's text (`parsed.clean`) is discarded. The stored message in `freshMsgs` also uses the backend summary, so conversation history always has correct prices.

## 3. `handlePriceQuestion(text, effectiveProducts, config)`

Added near `buildOrderSummary`. Detects price questions and returns a backend-built response or `null`.

**Detection**: regex patterns like `/cu[áa]nto\s+(cuesta|vale|es|sale)/i`, `/precio\s+de/i`, `/qu[ée]\s+precio/i`, `/a\s+c[óo]mo\s+(est[áa]|sale)/i`.

**Resolution**:
- Extracts the product name from the question text (strips the question pattern)
- Calls `resolveProductEntry(productName, 0, buildProductEntries(effectiveProducts))`
- If found: returns formatted price message using `effectiveProducts` data (which already includes overrides via `applyOverridesToProducts`)
- If not found: returns `null` → falls through to normal AI flow

**Response format**:
```
La {product.name} cuesta ${price}.
¿Quieres que te agregue una al pedido?
```

If the product has multiple sizes/variants (same base name, different prices), list all:
```
Tenemos:
- {name1}: ${price1}
- {name2}: ${price2}
¿Cuál te gustaría?
```

## 4. Price question integration (lines ~2885-2894)

After AI call but **before** it — insert a check:

```js
// Before calling AI, check if it's a price question
const priceAnswer = handlePriceQuestion(userText, effectiveProducts, config);
if (priceAnswer) {
  freshMsgs.push({ role: "assistant", content: priceAnswer, timestamp: new Date().toISOString() });
  await supabase.from("whatsapp_conversations").update({
    messages: freshMsgs.slice(-30),
    customer_name: freshCustomerName,
    current_order: freshCurrentOrder,
    order_status: freshOrderStatus,
  }).eq("id", conv.id);
  await sendWA(pid, token, from, priceAnswer, true);
  return new Response(...);
}
// Otherwise, proceed to AI as normal
const ai = await callAI(sys, mergedMsgs);
```

This skips the AI call entirely for price questions, saving tokens and guaranteeing correct prices.

## 5. System prompt update (line ~771)

Update step 6 instruction to tell the AI:

> "Genera el tag ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO--- al final. El sistema generará y enviará el resumen automáticamente con los precios correctos. NO escribas un resumen de precios detallado, solo incluye el tag con el JSON."

This reduces the chance of AI-generated price text leaking through.

## Files modified

| File | Changes |
|------|---------|
| `supabase/functions/whatsapp-webhook/index.ts` | Add `buildOrderSummary()`, add `handlePriceQuestion()`, modify order detection to use backend summary, add price question intercept before AI call, update system prompt step 6 |

## What does NOT change

- `validateOrder()` — untouched
- `_shared/productResolver.ts` — untouched, only imported
- `applyOverridesToProducts()` — untouched
- Product loading pipeline — untouched
- Confirmation flow — untouched
- Modification flow — untouched (future improvement candidate)

