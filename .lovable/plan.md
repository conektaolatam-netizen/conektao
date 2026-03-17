

# Plan: Eliminar pestañas Restricciones e Info Especial, consolidar en Personalidad

## Cambios

### 1. `src/pages/AliciaConfigPage.tsx`
- Eliminar imports de `AliciaConfigRestrictions` y `AliciaConfigSpecialInfo` (líneas 19-20)
- Eliminar `ShieldAlert` e `Info` de los imports de lucide (línea 8)
- Eliminar las entradas `restrictions` y `special` del array `SECTIONS` (líneas 30-31)
- Eliminar los `case "restrictions"` y `case "special"` del `renderContent()` (líneas 167-168)

### 2. `src/components/alicia-config/AliciaConfigPersonality.tsx`
- Eliminar el filtro que excluye `[RESTRICCION]` y `[INFO_ESPECIAL]` al cargar `customRules` (línea 19) — ahora carga **todas** las reglas de `custom_rules`
- Eliminar la lógica en `handleSave` que preserva tagged rules (línea 29) — ahora guarda directamente `customRules` sin concatenar reglas con prefijos
- El resultado: la sección "Reglas especiales del negocio" es el único punto de escritura para `custom_rules`

### 3. Eliminar archivos
- `src/components/alicia-config/AliciaConfigRestrictions.tsx`
- `src/components/alicia-config/AliciaConfigSpecialInfo.tsx`

### Sin cambios en
- Edge functions, base de datos, lógica de sugerencias
- Otros componentes de configuración

