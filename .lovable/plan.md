

# Plan: Secure /alicia-dashboard with auth + multi-tenant filtering

## Summary
Three changes: (1) wrap route with ProtectedRoute, (2) filter all queries by restaurant_id, (3) remove PasswordGate.

## Changes

### 1. `src/App.tsx` — Route protection + remove PasswordGate

- Import `ProtectedRoute`
- Change the `/alicia-dashboard` route from:
  ```tsx
  <Route path="/alicia-dashboard" element={<PasswordGate><WhatsAppDashboard /></PasswordGate>} />
  ```
  to:
  ```tsx
  <Route path="/alicia-dashboard" element={<ProtectedRoute><WhatsAppDashboard /></ProtectedRoute>} />
  ```
- Remove the `PasswordGate` import (it can stay as a file but won't be used)

### 2. `src/pages/WhatsAppDashboard.tsx` — Filter all queries by restaurant_id

The dashboard already fetches `restaurantId` from the user's profile. The problems:
- **Conversations query** (line 227-230): no `restaurant_id` filter — fetches ALL conversations globally
- **Conversations polling** starts before `restaurantId` is available
- **OrdersPanel** receives no `restaurantId` prop — fetches ALL orders globally
- **TemplatesPanel** already receives `wabaId` (OK)
- **Nudge check** fires globally without restaurant context

Changes:
- Pass `restaurantId` to the conversations query: `.eq("restaurant_id", restaurantId)`
- Wait for `restaurantId` before fetching conversations (move fetch into effect that depends on `restaurantId`)
- Pass `restaurantId` as prop to `<OrdersPanel>`
- Pass `restaurantId` to nudge check endpoint
- Use `useAuth()` hook instead of manual `supabase.auth.getUser()` for consistency

### 3. `src/components/alicia-dashboard/OrdersPanel.tsx` — Filter orders by restaurant_id

- Accept `restaurantId` prop
- Add `.eq("restaurant_id", restaurantId)` to the orders query
- Filter realtime subscription to the restaurant's orders
- Don't fetch until `restaurantId` is available

### 4. No DB changes needed
Both `whatsapp_conversations` and `whatsapp_orders` already have `restaurant_id` columns with foreign keys.

## Files modified
- `src/App.tsx`
- `src/pages/WhatsAppDashboard.tsx`
- `src/components/alicia-dashboard/OrdersPanel.tsx`

