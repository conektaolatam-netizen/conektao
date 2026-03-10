

# Plan: Fix nudge system disrupting order confirmations

## Root Cause

The "." messages you see are from the **nudge system** (`runSalesNudgeCheck`). It fires on conversations with statuses like `pending_confirmation` that haven't been updated in 2 minutes. When a nudge fires between the order summary and the user's "Sí, confirmar":

1. The nudge changes `order_status` from `pending_confirmation` to `nudge_sent`
2. It injects a nudge message into the conversation history
3. When the user confirms, the AI processes the "Sí" with the nudge-polluted context, losing awareness of the pre-order state

In Chat 2, the nudge fired at 1:57 PM (same minute), which is why the confirmation said "sent to kitchen" instead of showing the pre-order message.

## Fix: Two changes in `supabase/functions/whatsapp-webhook/index.ts`

### Change 1: Exclude pending confirmation statuses from nudges

In `runSalesNudgeCheck()`, add `pending_confirmation`, `pending_button_confirmation`, and `pre_order` to the excluded statuses for `dyingConvs`. These conversations are **waiting for user input** — nudging them is counterproductive.

Current filter (line 2045):
```
.not("order_status", "in", '("none","confirmed","followup_sent","nudge_sent")')
```

Updated:
```
.not("order_status", "in", '("none","confirmed","followup_sent","nudge_sent","pending_confirmation","pending_button_confirmation","pre_order","emailed","sent")')
```

Same for `abandonedConvs` (line 2050) — also exclude these statuses.

### Change 2: Skip nudges for conversations with recent assistant messages (< 5 min)

Add a guard: if the last assistant message in the conversation is less than 5 minutes old, skip the nudge. This prevents nudging immediately after Alicia just sent an order summary.

```typescript
const lastAssistantMsg = msgs.filter(m => m.role === "assistant").pop();
if (lastAssistantMsg?.timestamp) {
  const lastTime = new Date(lastAssistantMsg.timestamp).getTime();
  if (Date.now() - lastTime < 5 * 60 * 1000) continue; // Assistant responded recently, skip
}
```

### Files changed
- `supabase/functions/whatsapp-webhook/index.ts` — 2 localized edits in `runSalesNudgeCheck()`

