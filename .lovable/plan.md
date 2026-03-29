

## Plan: Flujo de pre-registro en 2 pasos con tabla `leads_conektao`

### 1. Crear tabla `leads_conektao` (migración SQL)

```sql
CREATE TABLE public.leads_conektao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  main_business_type text NOT NULL,
  necesidad_principal text,
  completo_flujo boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.leads_conektao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON public.leads_conektao
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous update" ON public.leads_conektao
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
```

### 2. Reescribir `src/pages/PreRegistro.tsx`

- Nuevo estado `currentStep`: `"form"` | `"needs"` | `"completed"`
- Nuevo estado `selectedNeed`: string | null
- Nuevo estado `leadId`: string | null (para actualizar el registro en paso 2)

**Paso 1 (form):** Mismo formulario visual actual. Al dar click en el botón:
  1. Valida campos
  2. Inserta en `leads_conektao` con `completo_flujo = false`
  3. Envía correo de notificación (con `completo_flujo: "No"`, sin `necesidad_principal`)
  4. Guarda `leadId` en estado
  5. Transición a `currentStep = "needs"`

**Paso 2 (needs):** Reemplaza el formulario con AnimatePresence (fade):
  - Icono 🎯, título "Una última cosa...", subtítulo
  - 3 tarjetas seleccionables con estilo gradiente naranja-teal al seleccionar
  - Botón "Finalizar y obtener mi acceso ✨"
  - Al click: actualiza `leads_conektao` con `necesidad_principal` (o `"no_respondió"`) y `completo_flujo = true`
  - Transición a `currentStep = "completed"`

**Paso 3 (completed):** Nueva pantalla de confirmación:
  - Icono 🎉, título "¡Ya estás dentro!", subtítulo con WhatsApp
  - Botón Instagram + cerrar (mismo estilo actual)

- Se elimina la inserción a `prelaunch_registrations` (se reemplaza por `leads_conektao`)
- Se mantiene la lógica de `prelaunch_partial_registrations`

### 3. Actualizar `supabase/functions/send-prelaunch-notification/index.ts`

- Agregar campos nuevos a la interfaz: `necesidad_principal`, `completo_flujo`
- Agregar campos al email dinámicamente:
  - `NECESIDAD PRINCIPAL`: valor o "No respondió paso 2"
  - `COMPLETÓ EL FLUJO`: "Sí" / "No"
- Mantener toda la lógica de filtrado de campos reales existente
- Redeploy del edge function

### Notas técnicas
- Las 3 tarjetas de necesidades usan el mismo gradiente `from-orange-500 to-teal-500` del botón actual, con opacidad reducida cuando no están seleccionadas
- La transición entre pasos usa `AnimatePresence` con `mode="wait"` para fade suave
- El correo se envía en paso 1 inmediatamente (antes de mostrar paso 2), garantizando que si el usuario abandona, los datos ya están guardados y el correo enviado

