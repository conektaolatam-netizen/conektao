

## Fix: Horarios de La Barra + Historia + Chat de ajustes diarios

### Problema detectado

1. **Horarios**: El prompt de La Barra NO tiene horario de apertura/cierre. El campo `operating_hours.schedule` solo dice "Todos los días" sin horas. ALICIA inventa que abre a las 5pm.
2. **Historia**: No hay info de fundador ni marca en el prompt. ALICIA inventa que "es de un grupo de amigos".
3. **Falta**: Un canal donde el dueno pueda decirle a ALICIA cosas temporales como "hoy cerramos temprano".

---

### Cambio 1: Actualizar prompt hardcoded de La Barra

En `supabase/functions/whatsapp-webhook/index.ts`, agregar al `buildLaBarraPrompt`:

- Bloque de HORARIO con reglas claras:
  - Abre todos los dias a las 3:00 PM
  - Desde las 3pm puede tomar pedidos
  - Si piden antes de las 3pm: tomar el pedido y decir "a partir de las 3:30 pm empezamos a preparar tu pedido"
  - Si es muy temprano (ej: 9am): calcular cuantas horas faltan y decirle al cliente
  - Cierra usualmente a las 11 PM, a veces se extiende
  
- Bloque de HISTORIA E IDENTIDAD:
  - Fundador: Santiago Cuartas Hernandez
  - Historia: durante la pandemia, pasion familiar por la pizza, pizzero italiano vino 15 dias a ensenar la receta ganadora
  - Sedes oficiales: La Samaria y El Vergel
  - La Estacion es una franquicia en proceso legal de retiro, no representa la marca
  - Reglas de manejo de quejas sobre La Estacion (respuesta empatica, invitar a sedes oficiales)

### Cambio 2: Actualizar datos en DB

Actualizar la fila de La Barra en `whatsapp_configs`:
- `operating_hours` con horario estructurado: apertura 15:00, cierre 23:00, pre_order_message, etc.
- `restaurant_description` ampliado con la historia
- Agregar `custom_rules` con reglas de marca/franquicia

### Cambio 3: Mejorar Step7Schedule.tsx

Reemplazar el input de texto libre por campos estructurados:
- Hora de apertura (selector de hora)
- Hora de cierre (selector de hora)
- Mensaje si piden antes de abrir (texto)
- Dias de operacion (checkboxes Lun-Dom)
- Checkbox: "Podemos tomar pedidos antes de abrir?"
- Si si: a que hora empiezan a preparar

### Cambio 4: Mejorar buildDynamicPrompt para horarios

Actualizar la logica dinamica para usar horarios estructurados y generar reglas inteligentes:
- Calcular si el restaurante esta abierto/cerrado basado en la hora actual de Colombia
- Si esta cerrado, instruir a ALICIA sobre como responder (tomar pedido para despues o decir que faltan X horas)

### Cambio 5: Agregar seccion "daily_overrides" (Chat de ajustes del dia)

Crear una nueva columna `daily_overrides` (JSONB) en `whatsapp_configs` para cambios temporales del dia (ej: "hoy cerramos a las 9pm", "hoy no hay domicilio").

Crear un componente `AliciaDailyChat.tsx` que se muestre en el dashboard:
- Input tipo chat donde el dueno escribe en lenguaje natural: "Alicia hoy cerramos a las 9"
- Una edge function `alicia-daily-override` que:
  - Recibe el mensaje del dueno
  - Usa IA para extraer la instruccion (tipo: schedule_change, value: "cierre a las 9pm", expires: fin del dia)
  - Guarda en `daily_overrides` con expiracion automatica (fin del dia)
- El `buildPrompt` lee `daily_overrides` y los inyecta como reglas temporales
- Los overrides se limpian automaticamente al dia siguiente

Agregar este componente al `WhatsAppDashboard` como una seccion visible.

---

### Archivos a modificar

```text
supabase/functions/whatsapp-webhook/index.ts
  - Agregar horarios y historia al buildLaBarraPrompt
  - Mejorar buildDynamicPrompt para horarios estructurados
  - Leer daily_overrides y agregarlos al prompt

src/components/alicia-setup/Step7Schedule.tsx
  - Campos estructurados en vez de texto libre

Migracion SQL
  - UPDATE whatsapp_configs SET operating_hours, restaurant_description, custom_rules para La Barra
  - ALTER TABLE whatsapp_configs ADD COLUMN daily_overrides JSONB DEFAULT '[]'

src/components/alicia-setup/AliciaDailyChat.tsx (NUEVO)
  - Chat simple para ajustes del dia

supabase/functions/alicia-daily-override/index.ts (NUEVO)
  - Edge function que procesa instrucciones del dueno con IA

src/pages/WhatsAppDashboard.tsx
  - Agregar seccion AliciaDailyChat
```

### Resultado

- ALICIA sabra que La Barra abre a las 3pm y cierra a las 11pm
- Si alguien pide a las 10am, dira que puede tomar el pedido pero empiezan a preparar a las 3:30pm
- ALICIA conocera la historia real de Santiago y la marca
- Sabra manejar quejas sobre La Estacion con empatia
- El dueno podra decirle "Alicia hoy cerramos a las 9" desde el dashboard
- El Step7 del wizard sera mas facil de llenar con selectores de hora
