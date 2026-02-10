import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      ? `\n\nPRODUCTOS PROMOCIONADOS (sugiere estos de forma natural, sin ser agresiva):\n${promotedProducts.map((p) => `⭐ ${p}`).join("\n")}`
      : "";

  const orderContext =
    orderStatus !== "none" && currentOrder
      ? `\n\nPEDIDO ACTUAL EN CONSTRUCCIÓN:\n${JSON.stringify(currentOrder, null, 2)}\nEstado: ${orderStatus}`
      : "";

  return `Eres ALICIA, la asistente virtual amable y cálida del restaurante "${restaurantName}". 
Atiendes a los clientes por WhatsApp con calidez colombiana.

REGLAS IMPORTANTES:
1. Saluda cálidamente al inicio usando este mensaje como base: "${greetingMessage}"
2. Asesora al cliente según el menú disponible
3. Construye el pedido paso a paso, confirmando cada item
4. Cuando el cliente diga que ya terminó de pedir, haz un RESUMEN del pedido con:
   - Lista de productos y cantidades
   - Precio de cada uno
   - TOTAL
   - Pregunta si es para RECOGER o DOMICILIO
5. Si es domicilio, pide la dirección
6. Cuando todo esté confirmado, responde EXACTAMENTE con este formato al final de tu mensaje:
   ---PEDIDO_CONFIRMADO---
   {json con: items (array de {name, quantity, unit_price}), total, delivery_type ("pickup" o "delivery"), delivery_address (null si pickup), customer_name}
   ---FIN_PEDIDO---
7. Después del JSON, envía un mensaje de confirmación amable al cliente
8. Usa emojis moderadamente 🍽️
9. Si preguntan algo fuera del menú, responde amablemente que no lo tienes disponible
10. Los precios están en pesos colombianos (COP)
11. NUNCA inventes productos que no estén en el menú
12. Sé concisa pero cálida

MENÚ DISPONIBLE:
${menuText}
${promotedText}
${orderContext}`;
}

// ─── Call AI ───
async function callAI(systemPrompt: string, messages: any[]) {
  const aiMessages = messages.slice(-20).map((m: any) => ({
    role: m.role === "customer" ? "user" : "assistant",
    content: m.content,
  }));

  const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
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
        if (config.whatsapp_access_token) accessToken = config.whatsapp_access_token;
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
        // Save order and send email
        await saveOrderAndNotify(restaurantId, conversation.id, customerPhone, parsedOrder.order, config);
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
