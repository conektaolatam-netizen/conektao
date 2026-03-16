

# Plan: Aplicar fondo oscuro de `/` a `/alicia/config`

## Problema
La página `/alicia/config` usa fondo blanco (`bg-white`) con texto oscuro, mientras que `/` usa el tema oscuro corporativo Conektao (fondo casi negro, texto claro). Los inputs y botones en las sub-secciones también son blancos con bordes claros, lo que no encaja con el tema oscuro.

## Cambios

### 1. `src/pages/AliciaConfigPage.tsx`
- Cambiar `bg-white` del contenedor principal a `bg-background` (tema oscuro)
- Cambiar `bg-gray-50` de la barra de progreso a `bg-card`
- Actualizar textos grises a usar `text-foreground`, `text-muted-foreground`
- Loading/error states: `bg-background` en vez de `bg-white`

### 2. Todas las sub-secciones (11 archivos):
Cada componente de configuración (`AliciaConfigBusiness`, `AliciaConfigMenu`, `AliciaConfigDelivery`, `AliciaConfigPayments`, `AliciaConfigPersonality`, `AliciaConfigSchedule`, `AliciaConfigConnection`, `AliciaConfigStarProducts`, `AliciaConfigUpselling`, `AliciaConfigRestrictions`, `AliciaConfigSpecialInfo`) tiene:
- Contenedor: `bg-white border-gray-100` → `bg-card border-border/20`
- Cuerpo: texto `text-gray-700` / `text-gray-500` → `text-foreground` / `text-muted-foreground`
- Inputs/Textareas: `border-gray-200` → `border-border` (heredan `bg-background` del tema)
- Fondos internos: `bg-gray-50` → `bg-muted`, `bg-gray-100` → `bg-accent`
- Badges/tags: `bg-teal-50 text-teal-700` → mantener colores de acento teal pero sobre fondo oscuro
- Los botones con gradiente teal-to-orange se mantienen igual

### 3. Sidebar nav en `AliciaConfigPage.tsx`
- Botones activos: `bg-gradient-to-r from-teal-50 to-orange-50` → `bg-gradient-to-r from-teal-900/30 to-orange-900/30`
- Bordes: `border-teal-100` → `border-teal-500/30`
- Hover: `hover:bg-gray-50` → `hover:bg-muted`
- Iconos: `bg-gray-100 text-gray-400` → `bg-muted text-muted-foreground`

El gradiente del header (teal → orange) se mantiene igual ya que funciona bien en ambos temas.

