# Plan: Clone Restaurant Configuration (899cb → 993aa)

## Current State

- **Source** (899cb): 12 categories, ~120+ products (mix of active/inactive), fully configured `whatsapp_configs` with delivery, payments, personality, operating hours, custom rules, promoted products, and suggest configs.
- **Target** (993aa): 12 categories already exist with matching names (from a previous clone), 113 products exist (stale), `whatsapp_configs` row exists but is mostly empty/pending.

## What Will Be Done

### Step 1: Delete all existing products in target restaurant

Remove all 113 products from `993aa` to start clean.

### Step 2: Clone products and categories from source to target

For each product in `899cb`, insert a new row in `products` with:

- New UUID
- `restaurant_id` = `993aa`
- `category_id` mapped from source category name → target category ID (both have identical category names)
- copy categories and use them with new products.(avoid use the categories from restaurant with id: 899cb7a7-7de1-47c7-a684-f24658309755)
- All other fields copied as-is (name, price, description, is_active, is_recommended, portions, packaging_price, requires_packaging, cost_price, sku, image_url)

### Step 3: Update whatsapp_configs for target

Copy these fields from source config to target config (ID `8b681788`):

- `restaurant_name` → "La Barra Crea Tu Pizza El Vergel"
- `restaurant_description` (same brand story)
- `location_address` / `location_details` → Will need El Vergel address (use placeholder or copy source for now)
- `operating_hours` (same schedule)
- `delivery_config` (same zones/rules)
- `payment_config` (same methods/bank details)
- `personality_rules` (same tone/vocabulary)
- `escalation_config` (same phone)
- `custom_rules` (same brand rules)
- `suggest_configs` (same suggestion behavior)
- `promoted_products` → Rebuilt with **new product IDs** from target (matched by product name)
- `greeting_message` (same greeting)
- `menu_link` (same PDF)
- `reservation_config` (same settings)
- `delivery_enabled` → true

**NOT copied** (you handle these):

- `whatsapp_phone_number_id`, `whatsapp_access_token`, `verify_token`, `waba_id` — Meta connection
- `is_active` — stays false until you activate
- `setup_completed` — stays false until you complete setup
- `order_email` — keeps `labarracreatupizzaelvergel@gmail.com`

### Step 4: Rebuild promoted_products with new IDs

The `promoted_products` JSONB references specific product UUIDs. After cloning products, the new UUIDs must be looked up by name and substituted.

## Technical Detail

- All operations use the Supabase insert tool (data operations, not schema changes)
- No schema migrations needed
- No changes to source restaurant `899cb` or any other restaurant
- Category mapping is by name (exact match confirmed: both have identical 12 category names)