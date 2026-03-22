

# Plan: Manual Print Button on Kitchen Orders

## Changes

### 1. Disable automatic printing (`src/hooks/usePrintQueue.ts`)

Remove the auto-print block when `hasPrinterConfigured()` is true. Instead, always show a toast notification when a new confirmed order arrives (no printing). The toast will inform that a new order was received — printing will be manual from the kitchen card.

### 2. Add print button to `KitchenOrderCard` (`src/components/kitchen/KitchenOrderCard.tsx`)

- Add a new prop `onPrint: (order: KitchenOrder) => void`
- Add a `Printer` icon button next to "Preparar" / "¡Lista!" (same row), visible only when order is `pending` or `in_progress`
- Style: outline, small, matching existing slate theme

### 3. Wire print handler in `KitchenDashboard` (`src/components/kitchen/KitchenDashboard.tsx`)

- Import `printKitchenTickets` and `hasPrinterConfigured` 
- Add `handlePrintOrder(order)` that converts the kitchen order items to `ComandaData` format and calls `printKitchenTickets()`
- If no printer configured, show toast with "Configurar" button
- Pass `onPrint={handlePrintOrder}` to each `<KitchenOrderCard />`

### What stays untouched
- `printComanda()`, `printKitchenTickets()`, `buildKitchenTicketHTML()` — no changes
- Realtime subscription for order detection still works (just no auto-print)
- All other kitchen logic (start, complete, cancel, history)

