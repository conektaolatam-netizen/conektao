

# Plan: Kitchen Ticket Format + Unread Indicator

## 1. Kitchen-style ticket printing (one per product)

### What changes

**`src/lib/printComanda.ts`** -- Add new function + HTML builder:

- Add `printKitchenTickets(data: ComandaData): boolean` -- iterates `data.items` and prints one ticket per item with staggered `setTimeout` (500ms between each).
- Add `buildKitchenTicketHTML(data, item, paperWidth)` -- generates a single-product ticket:
  - Header: `PEDIDO No. {order_id}` (large, bold, centered)
  - Channel tag: maps `delivery_type` to `DOMICILIOS` / `PARA LLEVAR` / `RECOGER` / `MESA` (large, bold)
  - Meta line: `FECHA: {date}` / `PERSONAS: 0` / `VENDEDOR: {seller or '--'}`
  - Product block (largest font ~20px): `{quantity} {PRODUCT_NAME}` (uppercase)
  - If item has `notes`: `OBS: {notes}`
  - NO prices, NO totals
  - Same `@page` / thermal CSS as existing `buildComandaHTML`
- Keep `printComanda()` and `buildComandaHTML()` untouched.

**`src/hooks/usePrintQueue.ts`** -- Change the print call:

- Import `printKitchenTickets` instead of `printComanda` for the auto-print path
- When `hasPrinterConfigured()` is true, call `printKitchenTickets(comanda)` instead of `printComanda(comanda)`
- The toast/fallback path stays the same

**`src/components/settings/PrinterSettings.tsx`** -- Update test print button to use `printKitchenTickets` so users can preview the new format.

### Delivery type mapping

| `delivery_type` value | Label on ticket |
|---|---|
| `delivery` | `DOMICILIOS` |
| `pickup` | `PARA LLEVAR` |
| `table` / `mesa` | `MESA` |
| other | value as-is, uppercase |

---

## 2. Unread message indicator on /alicia-dashboard conversations

### Database change (migration)

Create a table to track the last-read timestamp per conversation per user:

```sql
CREATE TABLE public.conversation_read_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_read_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own read status"
  ON public.conversation_read_status
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### Frontend changes

**`src/pages/WhatsAppDashboard.tsx`**:

- On mount (when `restaurantId` loads), fetch `conversation_read_status` for the current user into a `Map<conversationId, lastReadAt>`.
- For each conversation in the sidebar, compute unread count: count messages where `timestamp > lastReadAt`. If no record exists, unread = 0 (first open marks as read).
- Show a teal badge with the count next to the conversation name (only if > 0).
- When a conversation is selected (`setSelected(c)`), upsert `conversation_read_status` with `last_read_at = now()` and update the local map to clear the badge immediately.

### What stays untouched
- Realtime subscription, order flow, `usePrintQueue` trigger logic, `printComanda()` function signature, WhatsApp webhook, restaurant_id filtering, all existing conversation data/messages.

