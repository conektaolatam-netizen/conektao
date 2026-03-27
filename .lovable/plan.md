

## Plan: Combos inactivos + eliminación permanente (productos y combos)

### Cambios en 2 archivos

**1. `src/components/alicia-config/AliciaConfigCombos.tsx`**

- Agregar estado para combos inactivos (`inactiveCombos`, `showInactive`, `loadingInactive`)
- Nueva función `loadInactiveCombos()` que consulta `product_combos` con `is_active = false`
- Botón "Inactivos" (mismo estilo que en productos) con badge de conteo
- Sección de combos inactivos con:
  - Cada combo muestra botón de **reactivar** (update `is_active = true`) y botón de **eliminar permanentemente**
- Función `handleReactivateCombo()`: update `is_active = true`
- Función `handlePermanentDeleteCombo()`: DELETE real de `product_combo_items` + `product_combos`
- AlertDialog de confirmacion para eliminacion permanente con texto claro: "Esta accion no se puede deshacer"

**2. `src/components/alicia-config/AliciaConfigMenu.tsx`**

- En la seccion de productos inactivos, agregar boton de **eliminar permanentemente** junto al de reactivar
- Nuevo estado `permanentDeleteTarget` y funcion `handlePermanentDeleteProduct()`
- La eliminacion permanente hace DELETE real del producto (y sus `product_ingredients`, `sale_items` relacionados podrian causar FK errors, asi que se hara solo si no tiene ventas asociadas, o se mostrara error descriptivo)
- Actualizar `CategoryList` para soportar un tercer tipo de accion o pasar dos callbacks (reactivate + permanent delete)
- AlertDialog de confirmacion con advertencia "irreversible"

### Patron visual
- Mismo patron que productos inactivos: seccion con `opacity-70`, iconos `RotateCcw` para reactivar y `Trash2` rojo para eliminar permanentemente
- Combos inactivos muestran nombre + precio + componentes en formato reducido

