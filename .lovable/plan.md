

# Plan: Fix Alicia Vendedores Loop + Clean Data

## Root Cause Analysis

The conversation for `573006653341` shows:
1. **Old fallback message still in DB** (from before the fix at 15:03:24) — this poisons the AI context every time
2. **History loader doesn't filter fallbacks** — when building the AI prompt at line 375, fallback messages from the DB are included as-is, confusing the model
3. **No visibility into AI failures** — when the AI gateway returns empty, we don't log what it actually returned

The `isFallbackMessage` check only prevents NEW fallbacks from being stored (line 561), but OLD ones already in the DB still get loaded into the conversation context.

## Changes (all in `whatsapp-vendedores/index.ts`)

### 1. Filter fallback messages from history when building AI context (line 375)
Add a `.filter()` to exclude any message whose content matches `isFallbackMessage()` before sending to the AI. This ensures even old fallback messages in the DB never reach the model.

```typescript
const conversationMessages = (historyRows || [])
  .filter((r) => !isFallbackMessage(r.content))
  .map((r) => ({
    role: r.role === "user" ? "user" : "assistant",
    content: r.content,
  }));
```

### 2. Add response body logging for debugging (in `callVendedoresAI`)
Log the raw AI response when it's empty/invalid so we can diagnose gateway issues:
```typescript
console.warn("[vendedores] AI response body:", JSON.stringify(data?.choices?.[0]));
```

### 3. Also filter RESET_MESSAGE from history
The `RESET_MESSAGE` should also not be stored or loaded. Update `isFallbackMessage` to also match "enredo técnico".

### 4. Clean both tables via data operations
- DELETE all rows from `vendedores_mensajes`
- DELETE all rows from `vendedores_agente`

This gives a fresh start as the user requested.

## What is NOT touched
- SYSTEM_PROMPT, TOOLS, `generarCodigo()`, `sendWhatsAppMessage()`, tool call logic — all unchanged
- No other files modified

