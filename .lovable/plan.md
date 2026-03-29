

## Plan: Corregir correo de pre-registro (campos fantasma + WhatsApp sin +57)

### Problema raíz

En `src/pages/PreRegistro.tsx` líneas 118-130, `handleSubmit` construye `registrationData` con valores inventados para campos que el formulario nunca pide:

```
business_name: formData.main_business_type,  // pone tipo de negocio como nombre
city: "Por definir",
branches: "1",
email: `${phone}@pendiente.com`,
```

Estos se envían al edge function que los renderiza todos sin filtrar.

### Cambios en 2 archivos

**1. `supabase/functions/send-prelaunch-notification/index.ts`**

- Crear función helper `isRealValue(v)` que retorna `false` para: `null`, `undefined`, string vacío, `"Por definir"`, `"1"` (como branches), cualquier `@pendiente.com`
- Construir los campos del email dinámicamente: solo incluir un `<div class="field">` si el valor pasa `isRealValue()`
- En el link de WhatsApp, anteponer `57` al número limpio: `https://wa.me/57${phone.replace(/\D/g, '')}`
- En el subject del email, solo incluir `business_name` si es un valor real
- Redeploy del edge function

**2. `src/pages/PreRegistro.tsx`** (cambio mínimo, líneas 118-130)

- En `registrationData`, enviar solo los campos reales que el usuario llenó. Quitar los valores inventados:
  - `business_name`: no enviarlo (o enviar `null`)
  - `city`: no enviarlo (o enviar `null`)
  - `branches`: no enviarlo (o enviar `null`)
  - `email`: no enviarlo (o enviar `null`)
- Mantener la inserción a `prelaunch_registrations` con los defaults si la tabla los requiere, pero al body del edge function enviar solo los valores reales

Esto resuelve ambos problemas de raíz: el frontend deja de inventar datos, y el backend filtra cualquier valor no real antes de renderizar.

