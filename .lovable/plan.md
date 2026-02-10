

# ALICIA WhatsApp: Asistente de IA para clientes de restaurantes

## Resumen

Crear el flujo completo de ALICIA como asistente conversacional por WhatsApp que atiende a los clientes finales de cualquier restaurante registrado en Conektao. El pedido se envía por email al negocio.

---

## Arquitectura del flujo

```text
Cliente WhatsApp
       |
       v
[Meta Webhook] ──> Edge Function: whatsapp-webhook
       |
       ├── Extrae mensaje + numero de telefono
       ├── Identifica el restaurante (por numero de WhatsApp Business)
       ├── Carga productos activos del restaurante
       ├── Carga historial de conversacion (ultimos N mensajes)
       |
       v
[Lovable AI Gateway] (gemini-2.5-flash)
       |
       ├── Asesora al cliente segun menu
       ├── Sugiere productos que el dueno quiere impulsar
       ├── Detecta cuando el pedido esta completo
       |
       v
[Responde por WhatsApp] via Meta Cloud API
       |
       └── Si pedido confirmado:
            ├── Guarda pedido en DB
            ├── Envia email al restaurante (Resend)
            └── (Opcional) Notifica empresa de domicilios
```

---

## Secrets / API Keys necesarios

Ya tienes:
- **LOVABLE_API_KEY** (auto-configurado) - Para la IA
- **RESEND_API_KEY** - Para enviar emails

Necesito que me proporciones:
1. **WHATSAPP_VERIFY_TOKEN** - Un texto aleatorio que tu defines (ej: "conektao_2026") para verificar el webhook de Meta
2. **WHATSAPP_ACCESS_TOKEN** - Token de acceso permanente de Meta Cloud API (lo sacas de developers.facebook.com > Tu App > WhatsApp > API Setup > Permanent token)
3. **WHATSAPP_PHONE_NUMBER_ID** - ID del numero de telefono de WhatsApp Business (lo sacas del mismo panel de API Setup)

---

## Lo que voy a crear

### 1. Tabla: `whatsapp_configs` (configuracion por restaurante)
| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | uuid | PK |
| restaurant_id | uuid | FK a restaurants |
| whatsapp_phone_number_id | text | ID del numero de Meta |
| whatsapp_access_token | text | Token de acceso (encriptado) |
| verify_token | text | Token de verificacion del webhook |
| order_email | text | Email donde llegan los pedidos |
| delivery_enabled | boolean | Si notifica empresa de domicilios |
| delivery_company_email | text | Email de la empresa de domicilios |
| promoted_products | text[] | Productos a impulsar |
| greeting_message | text | Mensaje de bienvenida personalizado |
| is_active | boolean | Si esta activo |

### 2. Tabla: `whatsapp_conversations`
| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | uuid | PK |
| restaurant_id | uuid | FK |
| customer_phone | text | Telefono del cliente |
| customer_name | text | Nombre si lo proporciona |
| messages | jsonb | Historial de mensajes |
| current_order | jsonb | Pedido en construccion |
| order_status | text | none/building/confirmed/sent |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### 3. Tabla: `whatsapp_orders`
| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | uuid | PK |
| restaurant_id | uuid | FK |
| conversation_id | uuid | FK |
| customer_phone | text | |
| customer_name | text | |
| items | jsonb | Array de items del pedido |
| total | numeric | Total estimado |
| delivery_type | text | pickup/delivery |
| delivery_address | text | Direccion si es domicilio |
| status | text | received/preparing/ready/delivered |
| email_sent | boolean | Si se envio al restaurante |
| created_at | timestamptz | |

### 4. Edge Function: `whatsapp-webhook`
- **GET**: Verificacion del webhook de Meta (challenge response)
- **POST**: Recibe mensajes entrantes
  - Identifica el restaurante por `whatsapp_phone_number_id`
  - Carga/crea conversacion
  - Carga productos del restaurante
  - Envia a Lovable AI Gateway con contexto del menu + productos promocionados
  - Responde al cliente por WhatsApp API
  - Si detecta pedido confirmado: guarda orden + envia email con Resend

### 5. Edge Function: `whatsapp-send-order-email`
- Formatea el pedido en HTML bonito
- Envia al `order_email` del restaurante
- Opcionalmente envia a `delivery_company_email`

---

## Prompt del sistema para ALICIA (WhatsApp)

La IA recibira:
- Menu completo del restaurante con precios
- Productos que el dueno quiere impulsar (con instrucciones de sugerirlos naturalmente)
- Historial de la conversacion
- Estado actual del pedido

Comportamiento:
- Saluda calidamente, presenta el menu
- Sugiere productos promocionados de forma natural
- Construye el pedido paso a paso
- Confirma el pedido completo con resumen y total
- Pregunta si es para recoger o domicilio
- Envia confirmacion final

---

## Configuracion de Meta (lo que tu haces manualmente)

1. Ir a developers.facebook.com
2. Crear app de tipo "Business" 
3. Agregar producto "WhatsApp"
4. En API Setup: obtener el **Access Token** permanente y el **Phone Number ID**
5. En Webhooks: configurar la URL del webhook que te dare despues de crear la edge function
6. Suscribirse a los campos: `messages`

---

## Orden de implementacion

1. Crear las 3 tablas en Supabase
2. Crear edge function `whatsapp-webhook` (GET para verificacion + POST para mensajes)
3. Pedir los 3 secrets (WHATSAPP_VERIFY_TOKEN, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID)
4. Desplegar y darte la URL del webhook para configurar en Meta
5. Probar enviando un mensaje desde WhatsApp
6. El dashboard de configuracion lo hacemos despues, como acordamos

---

## Detalles tecnicos

- **verify_jwt = false** en el webhook (Meta no envia JWT)
- Se usa el WHATSAPP_ACCESS_TOKEN global inicialmente (para tu numero). Cuando haya multi-tenant, cada restaurante tendra su propio token en `whatsapp_configs`
- Memoria conversacional: se guardan los ultimos 20 mensajes en `whatsapp_conversations.messages` como JSONB
- Rate limiting: el mismo retry con backoff que ya usas en `conektao-ai`

