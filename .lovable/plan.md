
# Fix: Sync promoted products from DB on config reload

## Problem
`promoted` state is initialized via `useState(() => parsePromotedProducts(config.promoted_products))` which only runs once on mount. If `config` is initially empty/loading and later populated, the promoted products from DB are never reflected.

## Solution
Add a `useEffect` that syncs `promoted` state whenever `config.promoted_products` changes:

### `src/components/alicia-config/AliciaConfigUpselling.tsx`
- Add a `useEffect` watching `config.promoted_products` that calls `setPromoted(parsePromotedProducts(config.promoted_products))` to re-sync state from DB when config loads/reloads.
