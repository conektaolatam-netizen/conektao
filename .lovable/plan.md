

## ALICIA SaaS: Registro simplificado + Setup wizard post-plan

### Flujo completo del usuario

```text
/alicia (landing) 
  → Ve el demo, entiende el valor
  → Elige plan ("Contratar a ALICIA")
  → /alicia/registro?plan=alicia (o enterprise)
  → Registro ultra-simple: nombre, email, contraseña, WhatsApp del negocio (4 campos)
  → Auto-login inmediato
  → Redirige a /alicia/setup (wizard de configuracion)
  → Wizard guiado paso a paso para crear su ALICIA
```

### Fase 1: Base de datos - Ampliar whatsapp_configs

Agregar columnas al `whatsapp_configs` para almacenar la configuracion que hoy esta hardcodeada:

- `restaurant_name` (text) - nombre del negocio
- `restaurant_description` (text) - descripcion corta
- `location_address` (text) - direccion
- `location_details` (text) - como se la dice a clientes
- `menu_data` (jsonb) - menu completo estructurado
- `menu_link` (text) - link a carta si tiene
- `delivery_config` (jsonb) - zonas, tarifas, politica
- `payment_config` (jsonb) - metodos, datos bancarios
- `packaging_rules` (jsonb) - reglas de empaque
- `operating_hours` (jsonb) - horarios por dia
- `time_estimates` (jsonb) - tiempos de preparacion
- `personality_rules` (jsonb) - tono, palabras prohibidas
- `sales_rules` (jsonb) - estrategia de venta
- `escalation_config` (jsonb) - telefono humano, cuando escalar
- `custom_rules` (text[]) - reglas especificas del negocio
- `setup_completed` (boolean default false)
- `setup_step` (integer default 0)
- `selected_plan` (text) - plan elegido (alicia/enterprise)

Tambien: migrar los datos actuales de La Barra a las nuevas columnas.

### Fase 2: Registro simplificado exclusivo para ALICIA

Crear `AliciaRegisterPage.tsx` en `/alicia/registro`:

- Solo 4 campos: Nombre, Email, Contraseña, WhatsApp del negocio
- Sin selector de tipo de cuenta (es siempre "alicia_saas")
- Recibe `?plan=alicia` o `?plan=enterprise` como query param
- Usa la edge function `register-user` existente con account_type "alicia_saas"
- Auto-login tras registro
- Redirige directo a `/alicia/setup`
- Estetica: fondo negro con gradientes naranja/turquesa (coherente con la landing)
- Si ya tiene cuenta: link a login que tambien redirige a /alicia/setup

### Fase 3: Setup Wizard - "Crea tu ALICIA"

Crear `AliciaSetupPage.tsx` en `/alicia/setup` con 7 pasos guiados:

**Paso 1 - Tu restaurante** (obligatorio)
- Nombre del negocio
- Direccion
- Descripcion corta ("pizzeria artesanal en Cali")

**Paso 2 - Tu menu** (obligatorio)
- Opcion A: Subir archivo (PDF/Word/foto) para extraccion con IA
- Opcion B: Agregar manual: categorias con productos, precios, tamaños
- Marcar productos estrella/recomendados

**Paso 3 - Domicilio y recogida**
- Ofreces domicilio? si/no
- Zonas gratis (lista de barrios)
- Costo domicilio para otras zonas
- Solo recogida? detalles

**Paso 4 - Pagos**
- Metodos: efectivo, transferencia, datafono
- Datos bancarios para transferencia
- Pedir comprobante? si/no

**Paso 5 - Empaques** (opcional, skip si no aplica)
- Tipos con recargo
- Que productos llevan empaque

**Paso 6 - Personalidad de Alicia**
- Tono: cercana/profesional/muy casual
- Palabras prohibidas
- Contacto de escalamiento (telefono humano)

**Paso 7 - Horarios**
- Dias y horas de operacion
- Tiempos estimados semana vs fin de semana

Cada paso guarda inmediatamente en Supabase. Si el usuario cierra, retoma donde quedo.

Al completar: boton "Activar ALICIA" que marca setup_completed = true y redirige al dashboard.

### Fase 4: buildPrompt dinamico

Reescribir `buildPrompt()` en el edge function para leer la config de la DB:

- Bloque fijo: Regla #0 (parecer humana) - estandar para todos
- Bloques dinamicos: identidad, menu, delivery, pagos, empaques, horarios, personalidad - desde whatsapp_configs
- Fallback: si no hay config dinamica, usar el comportamiento actual (La Barra hardcodeado)

### Fase 5: Conectar AliciaPlans con el nuevo flujo

Modificar `AliciaPlans.tsx`:
- Boton "Contratar a ALICIA" → navega a `/alicia/registro?plan=alicia`
- Boton "Contactar ventas" (enterprise) → sigue igual (WhatsApp)

### Fase 6: Rutas nuevas en App.tsx

- `/alicia/registro` → AliciaRegisterPage
- `/alicia/setup` → AliciaSetupPage (protegida, requiere auth)

### Archivos a crear

```text
src/pages/AliciaRegisterPage.tsx - registro simplificado
src/pages/AliciaSetupPage.tsx - wizard principal
src/components/alicia-setup/Step1Restaurant.tsx
src/components/alicia-setup/Step2Menu.tsx
src/components/alicia-setup/Step3Delivery.tsx
src/components/alicia-setup/Step4Payments.tsx
src/components/alicia-setup/Step5Packaging.tsx
src/components/alicia-setup/Step6Personality.tsx
src/components/alicia-setup/Step7Schedule.tsx
```

### Archivos a modificar

```text
src/App.tsx - agregar rutas nuevas
src/components/alicia-saas/AliciaPlans.tsx - cambiar destino del boton
supabase/functions/whatsapp-webhook/index.ts - buildPrompt dinamico
Migracion SQL - nuevas columnas + datos La Barra
```

### Lo que NO cambia

- La landing /alicia sigue igual
- El demo interactivo sigue igual
- El dashboard /alicia-dashboard sigue igual
- Las reglas de humanizacion (Regla #0) quedan como estandar fijo
- La Barra sigue funcionando exactamente igual (datos migrados a DB)
