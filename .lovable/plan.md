

# Plan: Eliminar redundancia de `menu_data` — Fuente única desde `products`

## Principio
Seguir el patrón DB-first: `products` + `categories` son la única fuente de verdad del menú. Eliminar la dependencia de `menu_data` en todo el sistema.

## Cambios

### 1. `AliciaConfigMenu.tsx` — Cargar productos desde DB
- En vez de leer `config.menu_data`, hacer query a `products` + `categories` filtrando por `restaurant_id`
- Agrupar productos por categoría y mostrarlos igual que ahora (nombre categoría + count)
- Mantener el botón "Importar menú con IA" (que ya escribe a `products`/`categories`)

### 2. `AliciaConfigPage.tsx` — Cambiar check de completitud
- Cambiar `checkFields: ["menu_data"]` por una verificación dinámica: contar productos activos del restaurante
- Si hay ≥1 producto activo → sección completada

### 3. `generate-alicia/index.ts` — Eliminar rama `menu_data`
- Eliminar el bloque `if (config.menu_data?.length > 0)` (líneas 133-156)
- Usar SIEMPRE la rama de `products` (líneas 157-173), que ya funciona correctamente
- Mejorar esa rama para incluir índice del menú (como lo hace la rama de `menu_data`)

### 4. `whatsapp-webhook/index.ts` — Eliminar rama `menu_data`
- Eliminar el bloque `if (config.menu_data?.length > 0)` (líneas 1264-1293)
- Usar SIEMPRE `buildMenuFromProducts(products)` (línea 1295)
- Asegurar que `buildMenuFromProducts` genera el índice del menú

### 5. `Step2Menu.tsx` — Adaptar setup wizard
- En vez de guardar en `menu_data`, el wizard ya debería escribir a `products`/`categories` (como hace el import con IA)
- Marcar completitud basándose en productos existentes

### No se elimina la columna `menu_data`
- Se deja la columna en la DB por compatibilidad, simplemente se deja de usar
- Se puede limpiar en una migración futura

## Resultado
- Un solo lugar donde viven los productos: tabla `products`
- Sin desincronización posible
- Editar productos en el ProductManager se refleja automáticamente en Alicia
- El menú en `/alicia/config` siempre muestra datos reales

