import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Global fallback tokens (used when restaurant doesn't have its own)
const GLOBAL_WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || "";
const GLOBAL_WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "";
const GLOBAL_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "conektao_2026";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── Send WhatsApp text message ───
async function sendWhatsAppMessage(phoneNumberId: string, accessToken: string, to: string, text: string) {
  // WhatsApp API has a 4096 char limit per message
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= 4000) {
      chunks.push(remaining);
      break;
    }
    // Find a good split point
    let splitAt = remaining.lastIndexOf("\n", 4000);
    if (splitAt < 2000) splitAt = remaining.lastIndexOf(". ", 4000);
    if (splitAt < 2000) splitAt = 4000;
    chunks.push(remaining.substring(0, splitAt));
    remaining = remaining.substring(splitAt).trim();
  }

  for (const chunk of chunks) {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: chunk },
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error("WhatsApp API error:", err);
    }
  }
}

// ─── Mark message as read ───
async function markAsRead(phoneNumberId: string, accessToken: string, messageId: string) {
  await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}

// ─── Get or create conversation ───
async function getOrCreateConversation(restaurantId: string, customerPhone: string) {
  const { data: existing } = await supabase
    .from("whatsapp_conversations")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("customer_phone", customerPhone)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("whatsapp_conversations")
    .insert({
      restaurant_id: restaurantId,
      customer_phone: customerPhone,
      messages: [],
      order_status: "none",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
  return created;
}

// ─── Load restaurant products ───
async function loadProducts(restaurantId: string) {
  const { data } = await supabase
    .from("products")
    .select("id, name, price, description, category_id")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .order("name");

  return data || [];
}

// ─── Build system prompt ───
function buildSystemPrompt(
  products: any[],
  promotedProducts: string[],
  greetingMessage: string,
  restaurantName: string,
  currentOrder: any,
  orderStatus: string
) {
  const menuText = products
    .map((p) => `- ${p.name}: $${p.price?.toLocaleString("es-CO")}${p.description ? ` (${p.description})` : ""}`)
    .join("\n");

  const promotedText =
    promotedProducts.length > 0
      ? `\n\nPRODUCTOS PROMOCIONADOS (recomienda estos de forma natural cuando sea oportuno, como si fuera tu recomendación personal):\n${promotedProducts.map((p) => `⭐ ${p}`).join("\n")}`
      : "";

  const orderContext =
    orderStatus !== "none" && currentOrder
      ? `\n\nPEDIDO ACTUAL EN CONSTRUCCIÓN:\n${JSON.stringify(currentOrder, null, 2)}\nEstado: ${orderStatus}`
      : "";

  // Get current time info for prep time logic
  const now = new Date();
  const colombiaOffset = -5;
  const colombiaTime = new Date(now.getTime() + (colombiaOffset * 60 + now.getTimezoneOffset()) * 60000);
  const hour = colombiaTime.getHours();
  const dayOfWeek = colombiaTime.getDay(); // 0=Sun, 1=Mon...6=Sat
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Fri or Sat
  const isPeakHours = isWeekend && hour >= 18 && hour <= 22;

  return `Eres ALICIA, la asistente virtual de "${restaurantName}" en Ibagué. 
Hablas de forma muy natural, cálida y amable, como una persona real que atiende con cariño. Usas las palabras del cliente para comunicarte. Eres fluida, no robótica.

SALUDO INICIAL: "${greetingMessage}"

CARTA COMPLETA / MENÚ:
El menú completo está disponible en: https://drive.google.com/file/d/1B5015Il35_1NUmc7jgQiZWMauCaiiSCe/view?usp=drivesdk
Si el cliente quiere ver la carta, envíale este link.

MENÚ CON PRECIOS (usa estos para calcular):
${menuText}
${promotedText}

REGLAS DE PIZZAS:
- Solo UN sabor por pizza, NO dividimos en dos sabores
- Dos tamaños disponibles: Personal y Mediana
- Si piden "Crea Tu Pizza" (personalizada), dile al cliente que alguien del restaurante se va a comunicar con él en unos minutos para armarla juntos. Usa: ---ESCALAMIENTO--- para que le escriban.

EMPAQUES (OBLIGATORIO incluir en el total):
- Pizza: $2.000 por empaque
- Vaso: $1.000 por vaso
- Empaque de hamburguesa, pasta o pincho: $3.000 por empaque
Siempre calcula los empaques según la cantidad de items y súmalos al total. Si el cliente pregunta, explica los precios de empaque.

DOMICILIO:
- El valor del domicilio NO lo calculas tú, se le paga directo al domiciliario al recibir
- Si el cliente insiste en saber el costo del domicilio, dile que vas a consultar con la empresa de domicilios y que te espere un momento. Usa: ---CONSULTA_DOMICILIO--- para que el restaurante consulte
- Empresas de domicilio: Domitol (+57 3183659918) y otra empresa (+57 3045449758)
- ALICIA le pide a la empresa de domicilios que envíe a "La Barra de la Samaria" para llevar al lugar que el cliente indique

TIEMPOS DE PREPARACIÓN (INFORMACIÓN DELICADA - solo mencionar SI EL CLIENTE PREGUNTA):
- Si son las 3:00 PM en punto: el horno se demora 1 hora en prender + 10 minutos de preparación = ~1 hora 10 minutos
- Entre semana (lunes a jueves) a cualquier hora: ~15 minutos por pizza
- Fin de semana (viernes y sábado) de 6 PM a 10 PM: ~30 minutos por pizza
- Tiempo de trayecto promedio en Ibagué: ~25 minutos adicionales después de que sale
- Estado actual: ${isPeakHours ? "HORA PICO fin de semana (~30 min por pizza)" : isWeekend ? "Fin de semana fuera de hora pico (~15-20 min)" : "Entre semana (~15 min por pizza)"}
- Si el cliente pregunta "cómo va mi pedido" y ya pasaron los tiempos estimados, usa ---ESCALAMIENTO--- para que lo llamen

PAGO POR TRANSFERENCIA:
- Cuenta: Ahorros Bancolombia 718-000042-16
- NIT: 901684302 - LA BARRA CREA TU PIZZA
- Cuando el cliente diga que va a pagar por transferencia, envíale los datos de la cuenta y el NIT
- Pídele que envíe la foto del comprobante de pago
- Cuando envíe el comprobante, confirma que lo recibiste y que el restaurante lo va a verificar

SI NO PUEDES RESOLVER ALGO:
- Si no sabes responder una pregunta o el cliente tiene un problema que no puedes resolver, usa ---ESCALAMIENTO--- en tu respuesta y dile amablemente que la administradora se va a comunicar con él/ella

REGLAS DE CONVERSACIÓN:
1. Construye el pedido paso a paso, confirmando cada item
2. Cuando el cliente termine de pedir, haz un RESUMEN con:
   - Lista de productos y cantidades con precios
   - Empaques correspondientes
   - TOTAL (productos + empaques)
   - Pregunta si es para RECOGER en La Barra de la Samaria o DOMICILIO
3. Si es domicilio, pide la dirección
4. Pregunta nombre del cliente
5. Ofrece pago por transferencia y envía los datos de la cuenta
6. Cuando TODO esté confirmado (pedido + tipo entrega + pago), responde con:
   ---PEDIDO_CONFIRMADO---
   {json con: items (array de {name, quantity, unit_price, packaging_cost}), packaging_total, subtotal, total, delivery_type ("pickup" o "delivery"), delivery_address (null si pickup), customer_name, payment_method, observations}
   ---FIN_PEDIDO---
7. Usa emojis con moderación, máximo 1-2 por mensaje
8. NUNCA inventes productos que no estén en el menú
9. Sé concisa pero cálida, como una persona real
10. Los precios están en pesos colombianos (COP)
11. Si el cliente hace preguntas sobre la carta, asesóralo con conocimiento y pasión por los productos
${orderContext}`;
}

// ─── Send escalation email ───
async function sendEscalationEmail(config: any, customerPhone: string, reason: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey || !config.order_email) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ALICIA Alertas <onboarding@resend.dev>",
        to: [config.order_email],
        subject: `⚠️ ALICIA necesita ayuda - Cliente ${customerPhone}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:24px;color:white;text-align:center;">
              <h1 style="margin:0;font-size:24px;">⚠️ Escalamiento - ALICIA</h1>
              <p style="margin:8px 0 0;opacity:0.9;">Un cliente necesita atención humana</p>
            </div>
            <div style="padding:24px;">
              <p><strong>📱 Número del cliente:</strong> +${customerPhone}</p>
              <p><strong>📝 Motivo:</strong> ${reason}</p>
              <p style="margin-top:16px;color:#6b7280;">Por favor comunícate con el cliente lo antes posible.</p>
            </div>
            <div style="background:#f9fafb;padding:16px;text-align:center;color:#6b7280;font-size:12px;">
              Alerta enviada por ALICIA · Conektao
            </div>
          </div>`,
      }),
    });
    console.log("Escalation email sent for", customerPhone);
  } catch (e) {
    console.error("Escalation email error:", e);
  }
}

// ─── Call AI ───
async function callAI(systemPrompt: string, messages: any[]) {
  const aiMessages = messages.slice(-20).map((m: any) => ({
    role: m.role === "customer" ? "user" : "assistant",
    content: m.content,
  }));

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...aiMessages,
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("AI API error:", err);
    throw new Error(`AI error: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Lo siento, no pude procesar tu mensaje. ¿Podrías repetirlo?";
}

// ─── Parse confirmed order from AI response ───
function parseConfirmedOrder(aiResponse: string): { order: any; cleanResponse: string } | null {
  const match = aiResponse.match(/---PEDIDO_CONFIRMADO---\s*([\s\S]*?)\s*---FIN_PEDIDO---/);
  if (!match) return null;

  try {
    const order = JSON.parse(match[1].trim());
    const cleanResponse = aiResponse
      .replace(/---PEDIDO_CONFIRMADO---[\s\S]*?---FIN_PEDIDO---/, "")
      .trim();
    return { order, cleanResponse };
  } catch (e) {
    console.error("Error parsing order JSON:", e);
    return null;
  }
}

// ─── Save order and send email ───
async function saveOrderAndNotify(
  restaurantId: string,
  conversationId: string,
  customerPhone: string,
  order: any,
  config: any
) {
  // Save order
  const { data: savedOrder, error } = await supabase
    .from("whatsapp_orders")
    .insert({
      restaurant_id: restaurantId,
      conversation_id: conversationId,
      customer_phone: customerPhone,
      customer_name: order.customer_name || "Cliente WhatsApp",
      items: order.items || [],
      total: order.total || 0,
      delivery_type: order.delivery_type || "pickup",
      delivery_address: order.delivery_address || null,
      status: "received",
      email_sent: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving order:", error);
    return;
  }

  // Update conversation status
  await supabase
    .from("whatsapp_conversations")
    .update({ order_status: "confirmed", current_order: order })
    .eq("id", conversationId);

  // Send email notification
  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey || !config.order_email) {
      console.log("No Resend key or order_email configured, skipping email");
      return;
    }

    const itemsHtml = (order.items || [])
      .map(
        (item: any) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${(item.unit_price || 0).toLocaleString("es-CO")}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${((item.unit_price || 0) * (item.quantity || 1)).toLocaleString("es-CO")}</td>
          </tr>`
      )
      .join("");

    const deliveryInfo =
      order.delivery_type === "delivery"
        ? `<p><strong>🏍️ Tipo:</strong> Domicilio</p><p><strong>📍 Dirección:</strong> ${order.delivery_address || "No proporcionada"}</p>`
        : `<p><strong>🏪 Tipo:</strong> Recoger en local</p>`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:24px;color:white;text-align:center;">
          <h1 style="margin:0;font-size:24px;">🛒 Nuevo Pedido WhatsApp</h1>
          <p style="margin:8px 0 0;opacity:0.9;">Pedido recibido por ALICIA</p>
        </div>
        <div style="padding:24px;">
          <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="margin:0;"><strong>👤 Cliente:</strong> ${order.customer_name || "Cliente"}</p>
            <p style="margin:4px 0;"><strong>📱 Teléfono:</strong> ${customerPhone}</p>
            ${deliveryInfo}
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="padding:8px;text-align:left;">Producto</th>
                <th style="padding:8px;text-align:center;">Cant.</th>
                <th style="padding:8px;text-align:right;">Precio</th>
                <th style="padding:8px;text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr style="font-weight:bold;font-size:18px;">
                <td colspan="3" style="padding:12px 8px;text-align:right;">TOTAL:</td>
                <td style="padding:12px 8px;text-align:right;color:#059669;">$${(order.total || 0).toLocaleString("es-CO")}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;color:#6b7280;font-size:12px;">
          Pedido enviado automáticamente por ALICIA · Conektao
        </div>
      </div>`;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ALICIA Pedidos <onboarding@resend.dev>",
        to: [config.order_email],
        subject: `🛒 Nuevo Pedido - ${order.customer_name || "Cliente"} - $${(order.total || 0).toLocaleString("es-CO")}`,
        html,
      }),
    });

    if (emailRes.ok) {
      await supabase
        .from("whatsapp_orders")
        .update({ email_sent: true })
        .eq("id", savedOrder.id);
      console.log("Order email sent successfully");
    } else {
      console.error("Email send error:", await emailRes.text());
    }

    // Optional: send to delivery company
    if (config.delivery_enabled && config.delivery_company_email && order.delivery_type === "delivery") {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "ALICIA Domicilios <onboarding@resend.dev>",
          to: [config.delivery_company_email],
          subject: `🏍️ Recogida de pedido - ${order.delivery_address || "Sin dirección"}`,
          html: `<p>Nuevo pedido para recoger y entregar:</p>
            <p><strong>Dirección de entrega:</strong> ${order.delivery_address}</p>
            <p><strong>Cliente:</strong> ${order.customer_name} (${customerPhone})</p>
            <p><strong>Total:</strong> $${(order.total || 0).toLocaleString("es-CO")}</p>`,
        }),
      });
    }
  } catch (emailError) {
    console.error("Email notification error:", emailError);
  }
}

// ─── Main Handler ───
Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ─── GET: Webhook verification ───
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    console.log("Webhook verification request:", { mode, token });

    if (mode === "subscribe" && token === GLOBAL_VERIFY_TOKEN) {
      console.log("Webhook verified successfully");
      return new Response(challenge, { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  }

  // ─── POST: Incoming messages ───
  if (req.method === "POST") {
    try {
      const body = await req.json();

      // Meta sends different types of webhooks, we only care about messages
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      // Ignore status updates
      if (!value?.messages || value.messages.length === 0) {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const message = value.messages[0];
      const phoneNumberId = value.metadata?.phone_number_id;
      const customerPhone = message.from;
      const messageText = message.text?.body || message.button?.text || "";
      const messageId = message.id;

      console.log(`Incoming message from ${customerPhone} to ${phoneNumberId}: "${messageText}"`);

      if (!messageText.trim()) {
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find restaurant config by phone number ID
      let config: any = null;
      let accessToken = GLOBAL_WA_TOKEN;
      let usedPhoneId = phoneNumberId || GLOBAL_WA_PHONE_ID;

      const { data: configData } = await supabase
        .from("whatsapp_configs")
        .select("*")
        .eq("whatsapp_phone_number_id", phoneNumberId)
        .eq("is_active", true)
        .maybeSingle();

      if (configData) {
        config = configData;
        if (config.whatsapp_access_token && config.whatsapp_access_token !== 'ENV_SECRET') accessToken = config.whatsapp_access_token;
      } else {
        // Fallback: use first active config (for initial setup with single restaurant)
        const { data: fallbackConfig } = await supabase
          .from("whatsapp_configs")
          .select("*")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (fallbackConfig) {
          config = fallbackConfig;
          if (config.whatsapp_access_token) accessToken = config.whatsapp_access_token;
        }
      }

      if (!config) {
        console.error("No whatsapp_config found for phone_number_id:", phoneNumberId);
        // Still respond to the user
        await sendWhatsAppMessage(
          usedPhoneId,
          accessToken,
          customerPhone,
          "Lo siento, este número aún no está configurado. Por favor contacta al restaurante directamente. 🙏"
        );
        return new Response(JSON.stringify({ status: "no_config" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark message as read
      await markAsRead(usedPhoneId, accessToken, messageId);

      // Get restaurant info
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id, name")
        .eq("id", config.restaurant_id)
        .single();

      const restaurantName = restaurant?.name || "Restaurante";
      const restaurantId = config.restaurant_id;

      // Get or create conversation
      const conversation = await getOrCreateConversation(restaurantId, customerPhone);

      // Load products
      const products = await loadProducts(restaurantId);

      // Build messages history
      const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
      messages.push({ role: "customer", content: messageText, timestamp: new Date().toISOString() });

      // Build system prompt
      const systemPrompt = buildSystemPrompt(
        products,
        config.promoted_products || [],
        config.greeting_message || "¡Hola! Bienvenido 👋",
        restaurantName,
        conversation.current_order,
        conversation.order_status
      );

      // Call AI
      const aiResponse = await callAI(systemPrompt, messages);

      // Check if there's a confirmed order in the response
      const parsedOrder = parseConfirmedOrder(aiResponse);
      let responseToSend = aiResponse;

      if (parsedOrder) {
        responseToSend = parsedOrder.cleanResponse || "✅ ¡Tu pedido ha sido registrado! Te contactaremos pronto. 🍽️";
        await saveOrderAndNotify(restaurantId, conversation.id, customerPhone, parsedOrder.order, config);
      }

      // Check for escalation triggers
      if (responseToSend.includes("---ESCALAMIENTO---")) {
        responseToSend = responseToSend.replace(/---ESCALAMIENTO---/g, "").trim();
        await sendEscalationEmail(config, customerPhone, "ALICIA no pudo resolver la solicitud del cliente o se requiere atención humana (Crea Tu Pizza, tiempo excedido, etc.)");
      }

      // Check for delivery cost inquiry
      if (responseToSend.includes("---CONSULTA_DOMICILIO---")) {
        responseToSend = responseToSend.replace(/---CONSULTA_DOMICILIO---/g, "").trim();
        await sendEscalationEmail(config, customerPhone, "El cliente pregunta por el costo del domicilio. Por favor consultar con Domitol (3183659918) o la otra empresa (3045449758) y responder al cliente.");
      }

      // Update conversation
      messages.push({ role: "assistant", content: responseToSend, timestamp: new Date().toISOString() });

      // Keep only last 30 messages
      const trimmedMessages = messages.slice(-30);

      await supabase
        .from("whatsapp_conversations")
        .update({
          messages: trimmedMessages,
          customer_name: parsedOrder?.order?.customer_name || conversation.customer_name,
          current_order: parsedOrder ? parsedOrder.order : conversation.current_order,
          order_status: parsedOrder ? "confirmed" : conversation.order_status,
        })
        .eq("id", conversation.id);

      // Send response via WhatsApp
      await sendWhatsAppMessage(usedPhoneId, accessToken, customerPhone, responseToSend);

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 200, // Always return 200 to Meta to avoid retries
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
