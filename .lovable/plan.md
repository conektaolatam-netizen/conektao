
# Plan: ALICIA SaaS - Landing Page y Dashboard de Contratacion

## Resumen

Crear una experiencia completa de venta y configuracion de ALICIA como producto SaaS independiente, accesible desde la Welcome Page de Conektao. Incluye landing de venta, demo interactivo, flujo de contratacion y panel de configuracion post-compra.

## Estructura de paginas nuevas

### 1. Ruta `/alicia` - Landing Page de venta

Pagina publica con el mismo estilo visual de Welcome.tsx (fondo negro, gradientes naranja/turquesa, botones con degradados, estetica futurista IA).

**Secciones en orden:**

1. **Hero con avatar de ALICIA** - Foto de ALICIA (placeholder hasta que envies la foto con uniforme Conektao), titulo "Conoce a ALICIA" con subtitulo "Tu mejor vendedora. 24/7. Sin descansos. Sin errores."

2. **Resumen de 3 pasos** (iconos grandes, tarjetas sin bordes, fluidas):
   - Paso 1: Atiende y recomienda mejor que un vendedor humano, mas rapido y entiende lo que el cliente quiere
   - Paso 2: Toma el pedido, confirma el metodo de pago
   - Paso 3: Coordina el domicilio
   - Paso 4: Hace seguimiento al pedido y pregunta al cliente por su experiencia para que ella y tu negocio mejoren

3. **Beneficios con metricas** (estilo Conektao futurista):
   - +15% en ticket promedio (upselling inteligente)
   - 0 mensajes perdidos en WhatsApp
   - Atencion 24/7 sin costos de personal adicional
   - Seguimiento automatico post-venta

4. **Demo interactivo** - Seccion "Preguntale lo que quieras" donde el dueno puede escribirle a ALICIA en un mini-chat embebido. ALICIA responde usando el edge function existente (o un endpoint dedicado) explicando como funciona, sus capacidades, y respondiendo dudas del negocio. No es el WhatsApp real, es un chat web que llama a Gemini con un prompt de "modo demo/ventas".

5. **Planes**:
   - **Plan ALICIA** - $450.000 COP/mes - 1 sucursal, atencion ilimitada a clientes
   - **Plan Enterprise** - Precio personalizado - Multiples sucursales, dashboards gerenciales, reportes IA semanales

6. **CTA final** - Boton "Contratar a ALICIA" que lleva al flujo de contratacion

### 2. Boton en Welcome.tsx

Agregar en la seccion de IA (donde estan ConektAI y ContAI) una tercera tarjeta para ALICIA, o mejor aun, un boton/banner destacado en el hero que diga "Conoce a ALICIA - Tu vendedora IA por WhatsApp" con link a `/alicia`.

### 3. Ruta `/alicia/setup` - Dashboard de configuracion (post-contratacion)

Panel protegido (requiere auth) donde el dueno configura a ALICIA:

- **Subir carta/menu** - Acepta Word/PDF. El sistema usa Gemini vision para extraer productos, precios, descripciones y adiciones. El dueno revisa y confirma.
- **Entrenamiento personalizado** - Campo de texto libre donde el dueno explica: como funciona su negocio, preguntas frecuentes de clientes, experiencias especiales, tono preferido, productos destacados. Esto se guarda como parte del prompt de ALICIA.
- **Panel de rendimiento** - Metricas de ALICIA: pedidos tomados, ticket promedio, tasa de conversion, mensajes atendidos.
- **Recomendaciones semanales** - ALICIA analiza patrones y muestra insights como "Los pedidos se demoran mucho y la gente se queja, considera otra empresa de domicilios o contratar mas personal de domicilios".

## Detalle tecnico

### Archivos nuevos
- `src/pages/AliciaLanding.tsx` - Landing page publica
- `src/pages/AliciaSetup.tsx` - Dashboard de configuracion
- `src/components/alicia-saas/AliciaHero.tsx` - Hero con avatar
- `src/components/alicia-saas/AliciaSteps.tsx` - Los 4 pasos
- `src/components/alicia-saas/AliciaBenefits.tsx` - Metricas de beneficios
- `src/components/alicia-saas/AliciaDemoChat.tsx` - Chat demo interactivo
- `src/components/alicia-saas/AliciaPlans.tsx` - Planes y precios
- `src/components/alicia-saas/AliciaSetupMenu.tsx` - Subida de menu
- `src/components/alicia-saas/AliciaSetupTraining.tsx` - Entrenamiento libre
- `src/components/alicia-saas/AliciaPerformance.tsx` - Panel de rendimiento
- `supabase/functions/alicia-demo-chat/index.ts` - Edge function para el chat demo

### Archivos modificados
- `src/App.tsx` - Agregar rutas `/alicia` y `/alicia/setup`
- `src/pages/Welcome.tsx` - Agregar boton/banner de ALICIA en el hero o seccion IA

### Base de datos
- Tabla `alicia_subscriptions` - restaurant_id, plan, status, created_at
- Tabla `alicia_training_docs` - restaurant_id, document_type (menu/training), content (text), file_url, processed_data (jsonb)
- Tabla `alicia_performance` - restaurant_id, date, orders_taken, avg_ticket, conversion_rate, messages_handled

### Sobre el reto de automatizar la configuracion en Meta

Tu pregunta sobre si un agente de IA deberia llenar los datos en Meta automaticamente vs tener personas: Recomiendo un enfoque hibrido para la primera fase. La verificacion de negocio en Meta tiene pasos que requieren documentos legales y aprobaciones que no se pueden automatizar al 100%. La mejor estrategia inicial es:
1. El cliente sube sus datos en el dashboard de ALICIA
2. Un agente humano (o semi-automatizado) configura Meta Business con esos datos
3. A medida que el volumen crezca, se automatizan los pasos que Meta permita via API

Esto es mas realista que intentar automatizar un proceso que Meta no facilita completamente via API.

## Orden de implementacion

1. Landing page `/alicia` con hero, pasos, beneficios y planes (visual completo)
2. Boton en Welcome.tsx
3. Chat demo interactivo con edge function
4. Rutas en App.tsx
5. Dashboard de configuracion (siguiente fase)
