

# Dashboard Modular Desbloqueable - Plan de Implementacion

## Resumen

Transformar el dashboard actual en un sistema modular progresivo donde usuarios nuevos ven Alicia como modulo principal y el resto como bloqueado/proximo, sin romper la experiencia de clientes activos (La Barra y otros con plan existente).

---

## Fase 1: Base de Datos - Tabla de planes y registro de interes

### 1.1 Modificar `subscription_settings`

La tabla `subscription_settings` ya existe con campo `plan_type` (default `'basic'`). Se necesita:

- Agregar el valor `alicia_only` como default para nuevos usuarios
- Crear tabla `module_interest_requests` para capturar "Quiero acceso prioritario"

```text
Migracion SQL:
- ALTER subscription_settings: cambiar default de plan_type a 'alicia_only'
- CREATE TABLE module_interest_requests (
    id uuid PK,
    restaurant_id uuid FK,
    user_id uuid FK,
    module_key text NOT NULL,
    created_at timestamptz
  )
- RLS policies para ambas tablas
```

### 1.2 Mapeo de planes a modulos

```text
alicia_only  -> Solo Alicia
basic/pos_pro -> Facturacion, Inventario, Cocina, Personal, Documentos, Marketplace
full_suite   -> Todo (IA Conektao, Contabilidad IA, Auditoria, Marketing IA)
```

---

## Fase 2: Hook `useModuleAccess`

Crear `src/hooks/useModuleAccess.ts`:

- Consulta `subscription_settings.plan_type` del restaurante actual
- Expone: `canAccess(moduleKey)`, `planType`, `isLocked(moduleKey)`, `loading`
- Retorna `true` para todos los modulos si `plan_type` es `full_suite` o `pos_pro` (segun modulo)
- Clientes existentes con `plan_type = 'basic'` se tratan como `pos_pro` (no romper nada)

---

## Fase 3: Dashboard Condicional (`Dashboard.tsx`)

### 3.1 Hero Section - Alicia Card (plan `alicia_only`)

Cuando `planType === 'alicia_only'`:

- Reemplazar las 3 tarjetas de ventas por una tarjeta hero grande de Alicia
- Avatar con glow turquesa/naranja
- Boton "Configurar Alicia" (si no tiene `whatsapp_configs.setup_completed`) o "Entrar a Alicia" (si ya esta configurada)
- Click redirige a `/alicia-dashboard` o `/alicia/config`

Cuando `planType !== 'alicia_only'`:

- Mantener las tarjetas de ventas actuales (sin cambios)

### 3.2 Modulos Bloqueados

Para modulos donde `isLocked(moduleKey)` es `true`:

- Renderizar con opacidad reducida (gris)
- Icono de candado superpuesto
- Tooltip: "Disponible en el plan POS Inteligente"
- Click abre modal elegante (no navega al modulo)

### 3.3 Modal "Proximamente"

Componente `LockedModuleModal.tsx`:

- Diseno oscuro con gradientes Conektao
- Texto: "Proximamente disponible. Dejanos tus datos para activarlo primero."
- Boton: "Quiero acceso prioritario"
- Al hacer click: `INSERT INTO module_interest_requests`
- Feedback: "Listo, te avisaremos cuando este disponible"

### 3.4 Marketplace

Para `alicia_only`: mostrar tarjeta semi-transparente "En preparacion", no clickeable.

---

## Fase 4: Proteccion en `Index.tsx`

En `renderModule()`, agregar verificacion con `useModuleAccess`:

- Si el modulo esta bloqueado, no renderizar el componente
- Mostrar pantalla de "Modulo no disponible en tu plan" con CTA de upgrade
- Esto previene acceso directo via URL o sidebar

---

## Riesgos y Mitigaciones

```text
Riesgo                                  | Mitigacion
----------------------------------------|------------------------------------------
Romper clientes activos (La Barra)      | plan_type='basic' se trata como pos_pro
Acceso directo via sidebar              | Proteccion en Index.tsx renderModule()
Nuevos usuarios sin subscription_settings| Crear row automaticamente al crear restaurante
Latencia en consulta de plan            | Cache con React Query (staleTime: 5min)
```

---

## Orden de Implementacion

1. Migracion SQL (tabla + defaults)
2. Hook `useModuleAccess`
3. Componente `LockedModuleModal`
4. Modificar `Dashboard.tsx` (hero Alicia + modulos bloqueados)
5. Proteger `Index.tsx` (renderModule)

## Archivos a Crear

- `src/hooks/useModuleAccess.ts`
- `src/components/dashboard/LockedModuleModal.tsx`
- `src/components/dashboard/AliciaHeroCard.tsx`

## Archivos a Modificar

- `src/components/Dashboard.tsx` (logica condicional por plan)
- `src/pages/Index.tsx` (proteccion en renderModule)
- 1 migracion SQL

## Lo que NO se toca

- Edge functions (whatsapp-webhook, etc.)
- Logica de pedidos
- Sistema de Alicia backend
- Rutas existentes (/alicia-dashboard, /alicia/config)

