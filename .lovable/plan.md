

## Dashboard de Configuracion de Alicia — Rediseno UX Onboarding

### Objetivo

Transformar el dashboard actual (8 componentes con Cards genericas) en una experiencia tipo "onboarding de empleado nuevo" con branding Conektao (degradado turquesa + naranja, fondo blanco limpio), secciones faltantes, y preguntas simples tipo formulario guiado.

---

### Que existe hoy

8 componentes funcionales que guardan en `whatsapp_configs`:
- AliciaConfigBusiness, Menu, Delivery, Payments, Packaging, Personality, Schedule, Connection

Problemas actuales:
- Cards sin identidad visual (fondo oscuro generico)
- Faltan secciones: Productos Estrella, Upselling, Restricciones, Informacion Especial
- UX tecnica, no conversacional (labels + inputs planos)
- No hay progreso visual ni flujo guiado
- Pagos no pregunta "datafono en domicilio" como pregunta simple

---

### Cambios de diseno

#### 1. AliciaConfigPage.tsx — Rediseno completo

- Fondo blanco limpio (`bg-white`)
- Header con degradado turquesa-naranja sutil (barra superior)
- Progreso visual: indicador de secciones completadas (checks verdes)
- Navegacion lateral en desktop (sidebar con iconos + labels), acordeon en mobile
- Cada seccion muestra estado: completada (check verde), pendiente (circulo gris)
- Boton "Generar mi Alicia" al final (activa `is_active + setup_completed`)

#### 2. Componentes existentes — Rediseno UX conversacional

Cada componente se redisena con:
- Fondo blanco, bordes suaves, sombra minima
- Titulo con icono + degradado turquesa-naranja en el header
- Preguntas simples en lenguaje humano
- Inputs agrupados logicamente

Cambios especificos por componente:

**AliciaConfigBusiness** — sin cambios funcionales, solo visual

**AliciaConfigPayments** — agregar pregunta:
```
"Puedes llevar datafono a domicilio?"
[ ] Si, siempre
[ ] A veces (Alicia confirma disponibilidad)
[ ] No
```
Nuevo campo: `delivery_card_terminal` en `payment_config`

**AliciaConfigDelivery** — agregar:
- Radio de domicilio (texto libre o predefinido)
- Costo de domicilio para zonas con cobro (numerico)

**AliciaConfigSchedule** — sin cambios funcionales, solo visual

**AliciaConfigPersonality** — sin cambios funcionales, solo visual

**AliciaConfigPackaging** — sin cambios funcionales, solo visual

**AliciaConfigConnection** — sin cambios funcionales, solo visual (ya tiene warning amarillo)

**AliciaConfigMenu** — sin cambios funcionales (futuro: import IA)

#### 3. Nuevos componentes

**AliciaConfigStarProducts** (NUEVO)
- Titulo: "Productos estrella"
- Pregunta: "Cuales son tus productos mas vendidos o que quieres impulsar?"
- Lista editable con autocomplete desde productos existentes
- Guarda en `promoted_products: string[]`

**AliciaConfigUpselling** (NUEVO)
- Titulo: "Sugerencias inteligentes"
- Pregunta: "Quieres que Alicia sugiera algo extra en cada pedido?"
- Switch on/off
- Maximo sugerencias por pedido (1-2)
- Reglas por tipo: "Si piden pizza sola, sugerir bebida"
- Guarda en `sales_rules: { enabled, max_per_order, rules[] }`

**AliciaConfigRestrictions** (NUEVO)
- Titulo: "Restricciones del negocio"
- Preguntas tipo checkbox:
  - "Hay productos que NO vendes en domicilio?"
  - "Hay horarios donde ciertos productos no estan disponibles?"
  - "Hay tamanos o presentaciones que no manejas?"
- Campo de texto libre para restricciones adicionales
- Guarda en `custom_rules[]` (se agregan como reglas al array existente, marcadas con tag `[RESTRICCION]`)

**AliciaConfigSpecialInfo** (NUEVO)
- Titulo: "Informacion especial"
- Pregunta: "Hay algo mas que Alicia deba saber de tu negocio?"
- Ejemplos guia: "Tenemos dos sedes", "No vendemos alcohol", "Solo abrimos fines de semana"
- Textarea con max 500 caracteres
- Guarda como entradas adicionales en `custom_rules[]` con tag `[INFO_ESPECIAL]`

---

### Estructura de tabs actualizada

| # | Tab | Componente | Campo BD |
|---|---|---|---|
| 1 | Tu Negocio | AliciaConfigBusiness | restaurant_name, etc. |
| 2 | Menu | AliciaConfigMenu | menu_data |
| 3 | Pagos | AliciaConfigPayments | payment_config |
| 4 | Horarios | AliciaConfigSchedule | operating_hours, time_estimates |
| 5 | Domicilios | AliciaConfigDelivery | delivery_config |
| 6 | Empaques | AliciaConfigPackaging | packaging_rules |
| 7 | Estrella | AliciaConfigStarProducts | promoted_products |
| 8 | Sugerencias | AliciaConfigUpselling | sales_rules |
| 9 | Restricciones | AliciaConfigRestrictions | custom_rules |
| 10 | Info especial | AliciaConfigSpecialInfo | custom_rules |
| 11 | Personalidad | AliciaConfigPersonality | personality_rules, etc. |
| 12 | WhatsApp | AliciaConfigConnection | whatsapp credentials |

---

### Archivos a modificar

| Archivo | Accion |
|---|---|
| `src/pages/AliciaConfigPage.tsx` | Rediseno completo: fondo blanco, sidebar navegacion, progreso visual, degradados Conektao, boton "Generar mi Alicia" |
| `src/components/alicia-config/AliciaConfigBusiness.tsx` | Rediseno visual (fondo blanco, header degradado) |
| `src/components/alicia-config/AliciaConfigPayments.tsx` | Rediseno visual + pregunta "datafono en domicilio" |
| `src/components/alicia-config/AliciaConfigDelivery.tsx` | Rediseno visual + radio de domicilio + costo |
| `src/components/alicia-config/AliciaConfigPackaging.tsx` | Rediseno visual |
| `src/components/alicia-config/AliciaConfigPersonality.tsx` | Rediseno visual |
| `src/components/alicia-config/AliciaConfigSchedule.tsx` | Rediseno visual |
| `src/components/alicia-config/AliciaConfigConnection.tsx` | Rediseno visual |
| `src/components/alicia-config/AliciaConfigMenu.tsx` | Rediseno visual |
| `src/components/alicia-config/AliciaConfigStarProducts.tsx` | NUEVO: productos estrella |
| `src/components/alicia-config/AliciaConfigUpselling.tsx` | NUEVO: sugerencias inteligentes |
| `src/components/alicia-config/AliciaConfigRestrictions.tsx` | NUEVO: restricciones |
| `src/components/alicia-config/AliciaConfigSpecialInfo.tsx` | NUEVO: informacion especial |

### Lo que NO se toca

- Edge function webhook (prompt ya lee `promoted_products`, `sales_rules`, `custom_rules`)
- Esquema de BD (todos los campos ya existen en `whatsapp_configs` como JSONB)
- Flujo de produccion de La Barra
- Logica de pedidos, confirmacion, dedup

### Detalle tecnico — Estilo visual

Paleta de colores:
- Fondo principal: `bg-white` (modo claro forzado para este dashboard)
- Header degradado: `bg-gradient-to-r from-teal-500 to-orange-500` (turquesa Conektao + naranja)
- Cards: `bg-white border border-gray-100 shadow-sm rounded-xl`
- Botones primarios: degradado turquesa-naranja
- Checks de progreso: circulo verde con check blanco
- Texto: `text-gray-900` principal, `text-gray-500` secundario

El dashboard fuerza tema claro independientemente del tema global de la app.
