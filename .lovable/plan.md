

# Plan: Robustness Improvements for Alicia Vendedores

## Problems Identified in Current Code

1. **Fallback messages saved to history** (lines 495-503): The fallback "Tuve un pequeño problema técnico..." is saved to `vendedores_mensajes`, polluting the AI context and causing loops.
2. **No retry before fallback** (lines 320-327, 494-497): On AI failure, it immediately sends the fallback — no second attempt.
3. **No loop detection**: If AI keeps failing, the same fallback is repeated endlessly.
4. **No response validation**: Empty/malformed AI responses trigger fallback without retry.

## Changes — All in `supabase/functions/whatsapp-vendedores/index.ts`

### 1. Define fallback phrases as constants (~line 7)
Add a list of known fallback/technical-error phrases and a helper function `isFallbackMessage(text)` that checks if a string contains "problema técnico" or matches known fallback messages.

### 2. Add error loop detection helper (~line 277, after loading history)
After loading `historyRows`, check if the last 2 assistant messages contain "problema técnico". If so, set a flag `errorLoopDetected = true`.

### 3. Add AI call + retry logic (replace lines 311-331)
Extract the AI call into a helper `callVendedoresAI(payload)` that:
- Makes the fetch call
- Validates response: `reply` exists, is a string, `trim().length > 0`
- If invalid → logs `[vendedores] AI retry triggered` → retries once
- If still invalid → returns `null`

### 4. Apply retry to both AI calls
- **Main AI call** (line 311): Use the retry helper
- **Follow-up AI call after tool calls** (line 456): Use the same retry helper

### 5. Replace fallback logic (lines 494-503)
After AI calls, if reply is still empty:
- If `errorLoopDetected` → use soft reset message: *"Creo que tuvimos un pequeño enredo técnico. Volvamos a empezar rápido. ¿Te cuento cómo funciona la oportunidad de Conektao?"*
- Otherwise → use standard fallback
- Log accordingly: `[vendedores] Fallback response used` or `[vendedores] Error loop detected – sending reset message`

### 6. Don't store fallback messages (lines 498-503)
Before inserting into `vendedores_mensajes`, check `isFallbackMessage(reply)`. If true, skip the insert. Only store real AI responses.

### 7. Apply same protection to global catch block (lines 511-531)
The crash handler at line 522 also sends a fallback — this is fine (not saved to DB currently), but add the log: `[vendedores] CRITICAL fallback triggered`.

## What is NOT touched
- `SYSTEM_PROMPT` — unchanged
- `TOOLS` definition — unchanged
- `generarCodigo()` — unchanged
- Tool call registration logic (lines 334-492) — unchanged
- `sendWhatsAppMessage()` — unchanged
- Any other files — untouched

