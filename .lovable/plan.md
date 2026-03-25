

# Plan: Unify Kitchen Ticket Printing into a Single Comanda

## What Changes

Modify `printKitchenTickets()` in `src/lib/printComanda.ts` so it prints **one single ticket** with all products listed together (customer name, address, items with quantities, and total at the bottom) instead of opening one window per product.

## Implementation

### File: `src/lib/printComanda.ts`

Replace `printKitchenTickets()` (lines 355-391) to reuse the existing `buildComandaHTML()` function (which already generates exactly the format you want: customer name, address, all items, total) and open a single print window — identical to how `printComanda()` works.

The `buildKitchenTicketHTML()` function (per-item ticket) can remain in the file for reference but will no longer be called.

### No other files change

All three call sites (`OrdersPanel.tsx`, `KitchenDashboard.tsx`, `PrinterSettings.tsx`) already call `printKitchenTickets(data: ComandaData)` with the full order data — no signature change needed. The print button stays as-is.

## Summary

- One function change in one file
- Single comanda per order with: client name, phone, delivery address (if delivery), all products with quantities, total
- All existing print buttons remain untouched

