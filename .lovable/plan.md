

## Plan: Actualizar textos del formulario de pre-registro

### Cambios en 2 archivos — solo textos, sin tocar lógica, colores ni estructura.

---

### 1. `src/pages/PreRegistro.tsx`

**Encabezado (líneas 222-228):**
- Título: "Conektao" → sin cambio
- Subtítulo: cambiar "Regístrate para el prelanzamiento exclusivo" → `"Descubre cómo Conektao ayuda a negocios como el tuyo a crecer con inteligencia artificial"`
- Agregar encima del subtítulo un título más grande: `"¿Listo para vender más con tecnología?"`

**Formulario card (líneas 238-241):**
- Emoji: `📝` → sin cambio (o quitar si se prefiere)
- `"Solo 3 datos rápidos"` → eliminar o reemplazar con algo neutro
- `"Te tomará menos de 30 segundos"` → eliminar

**Campos (líneas 255-359):**
- Placeholder nombre (255): ya dice "Tu nombre" → sin cambio
- Placeholder tipo de negocio (277): "Tipo de negocio" → `"¿Qué tipo de negocio tienes?"`
- Placeholder WhatsApp (359): "Tu WhatsApp (para avisarte primero) 📲" → `"Tu WhatsApp 📲"`
- Agregar texto de ayuda debajo del campo WhatsApp: `"Te llamamos para contarte cómo funciona"` (texto pequeño gris)

**Botón paso 1 (382):**
- `"¡Quiero mi acceso exclusivo! 🚀"` → `"Quiero saber cómo me ayuda Conektao →"`

**Texto bajo botón (387-390):**
- `"Prometemos no enviarte spam, solo cosas buenas"` → `"Sin compromisos. Te explicamos todo en una llamada de 10 minutos."`

**Texto seguridad (394-396):**
- Ya dice "Tus datos están seguros con nosotros 🔒" → sin cambio

**Paso 2 — needOptions (líneas 31-35):**
- Tarjeta 1: `"Mejorar la atención en domicilios"` → `"Mejorar la atención y gestión de domicilios"`
- Tarjeta 2: `"Reducir comisiones a plataformas de domicilios"` → `"Dejar de pagar tanto en comisiones a plataformas de delivery"`
- Tarjeta 3: `"Usar mis datos de ventas para tomar mejores decisiones"` → `"Entender mis ventas y tomar mejores decisiones con datos"`

**Paso 2 — títulos (líneas 419-422):**
- `"Una última cosa..."` → `"Una cosa más..."`
- `"¿Qué sientes que más necesitas mejorar en tu negocio ahora mismo?"` → `"¿Cuál es el mayor reto de tu negocio ahora mismo?"`

**Botón paso 2 (462):**
- `"Finalizar y obtener mi acceso ✨"` → `"Que me llamen →"`

**Pantalla confirmación (líneas 483-502):**
- Emoji: `🎉` → `🚀`
- Título: `"¡Ya estás dentro!"` → `"¡Listo! Te llamamos pronto"`
- Subtítulo: `"Te avisamos primero cuando abramos..."` → `"Uno de nuestros asesores te contactará para mostrarte exactamente cómo Conektao puede hacer crecer tu negocio 📈"`
- Agregar texto pequeño: `"Revisa tu WhatsApp, te escribimos primero para coordinar la llamada"`

---

### 2. `supabase/functions/send-prelaunch-notification/index.ts`

**Asunto del correo (línea 172):**
- `"🚀 Nuevo registro: ${subjectSuffix}"` → `"📞 Nuevo lead listo para llamar: ${name} - ${tipo}"`
- Construir subject con `name` y `main_business_type` en vez de `business_name`

**Encabezado HTML del correo (línea 154):**
- `"🚀 Nuevo Registro Prelanzamiento Conektao"` → `"📞 Nuevo Lead Conektao"`

**Labels de campos en el correo:**
- `"Nombre"` → sin cambio
- `"Tipo de Negocio"` → `"Negocio"`
- `"Necesidad Principal"` → `"Reto Principal"`
- `"Completó el Flujo"` → sin cambio
- `"Fecha de Registro"` → `"Hora"`

**NEED_LABELS (líneas 29-34):**
- Actualizar las etiquetas para coincidir con los nuevos textos de las tarjetas
- `no_respondió` → `"No respondió"`

**Redeploy** del edge function

