

# Plan: Ver y reactivar productos inactivos en la pestaña Menú

## Resumen

Agregar un toggle/botón "Ver productos inactivos" que muestre los productos desactivados agrupados por categoría, con un botón para reactivar cada uno (`is_active = true`).

## Cambios — único archivo: `AliciaConfigMenu.tsx`

### 1. Nuevo estado y carga de inactivos

- Agregar estados: `showInactive` (boolean toggle), `inactiveCategories` (misma estructura `CategoryWithProducts[]`), `loadingInactive` (boolean).
- Nueva función `loadInactiveProducts()` — misma query pero con `.eq("is_active", false)`. Se llama al activar el toggle.

### 2. Reactivar producto

- Nueva función `handleReactivateProduct(product)` — ejecuta `supabase.from("products").update({ is_active: true }).eq("id", product.id)`, recarga ambas listas (activos e inactivos), muestra toast de confirmación.
- Confirmación con `AlertDialog` similar al de eliminar, pero con texto y botón verde de "Reactivar".

### 3. UI

- Agregar import de `RotateCcw` (o `Undo2`) y `EyeOff` de lucide-react.
- Botón "Ver inactivos" junto al botón "Actualizar", con badge del conteo si hay inactivos.
- Cuando `showInactive` es true, mostrar debajo de la lista activa una sección con borde punteado/opacidad reducida con las categorías inactivas en acordeones idénticos, pero:
  - En lugar del botón trash, un botón con icono de reactivar (verde).
  - Los nombres aparecen con opacidad reducida para distinguirlos visualmente.
- Si no hay productos inactivos, mostrar mensaje "No hay productos inactivos".

### Sin cambios en
- Lógica de importación, edge functions, base de datos, otros componentes.

