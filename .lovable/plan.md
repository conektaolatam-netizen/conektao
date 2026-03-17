
# Plan: Unificar guardado en botón único

## Problema
Hay dos botones de guardado: "Guardar productos" (línea 148) para `promoted_products` y "Guardar" (línea 172) para `suggest_configs`. El usuario quiere un solo botón.

## Cambios — único archivo: `AliciaConfigUpselling.tsx`

### 1. Modificar `handleSave` para guardar ambos campos
El botón final "Guardar" ejecutará dos llamadas a `onSave`: una para `suggest_configs` y otra para `promoted_products`.

### 2. Eliminar botón "Guardar productos" (línea 148-150)
Remover el botón y el estado `savingStarProducts` que ya no se necesita.

### 3. Eliminar código muerto
- Remover función `handleSaveStarProducts`
- Remover estado `savingStarProducts`

### Sin cambios en
- Lógica de lectura de datos, estructura de estado, UI de productos destacados, switches, ni ninguna otra pestaña.
