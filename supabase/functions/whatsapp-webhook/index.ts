import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GLOBAL_WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") || "";
const GLOBAL_WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") || "";
const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
console.log("WA Token starts with:", GLOBAL_WA_TOKEN.substring(0, 10), "length:", GLOBAL_WA_TOKEN.length);
console.log("WA Phone ID:", GLOBAL_WA_PHONE_ID);

async function downloadMediaUrl(mediaId: string, token: string): Promise<string | null> {
  try {
    const metaRes = await fetch(`https://graph.facebook.com/v22.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${token.trim()}` },
    });
    if (!metaRes.ok) { console.error("Media meta error:", await metaRes.text()); return null; }
    const metaData = await metaRes.json();
    const mediaUrl = metaData.url;
    if (!mediaUrl) return null;

    // Download and upload to Supabase Storage
    const dlRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${token.trim()}` },
    });
    if (!dlRes.ok) { console.error("Media download error:", await dlRes.text()); return null; }
    const blob = await dlRes.blob();
    const ext = (metaData.mime_type || "image/jpeg").includes("png") ? "png" : "jpg";
    const fileName = `payment-proofs/${Date.now()}-${mediaId}.${ext}`;
    
    const { data, error } = await supabase.storage.from("whatsapp-media").upload(fileName, blob, {
      contentType: metaData.mime_type || "image/jpeg",
      upsert: true,
    });
    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }
    const { data: urlData } = supabase.storage.from("whatsapp-media").getPublicUrl(fileName);
    console.log("Payment proof uploaded:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (e) {
    console.error("Media download failed:", e);
    return null;
  }
}

async function sendWA(phoneId: string, token: string, to: string, text: string) {
  const chunks: string[] = [];
  let rem = text;
  while (rem.length > 0) {
    if (rem.length <= 4000) {
      chunks.push(rem);
      break;
    }
    let s = rem.lastIndexOf("\n", 4000);
    if (s < 2000) s = rem.lastIndexOf(". ", 4000);
    if (s < 2000) s = 4000;
    chunks.push(rem.substring(0, s));
    rem = rem.substring(s).trim();
  }
  for (const c of chunks) {
    const trimmedToken = token.trim();
    console.log(
      "Sending WA msg, token first 15 chars:",
      JSON.stringify(trimmedToken.substring(0, 15)),
      "last 10:",
      JSON.stringify(trimmedToken.substring(trimmedToken.length - 10)),
      "len:",
      trimmedToken.length,
    );
    const r = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${trimmedToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: c } }),
    });
    if (!r.ok) console.error("WA error:", await r.text());
  }
}

async function markRead(phoneId: string, token: string, msgId: string) {
  await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: msgId }),
  });
}

async function getConversation(rid: string, phone: string) {
  const { data: ex } = await supabase
    .from("whatsapp_conversations")
    .select("*")
    .eq("restaurant_id", rid)
    .eq("customer_phone", phone)
    .maybeSingle();
  if (ex) return ex;
  const { data: cr, error } = await supabase
    .from("whatsapp_conversations")
    .insert({ restaurant_id: rid, customer_phone: phone, messages: [], order_status: "none" })
    .select()
    .single();
  if (error) throw error;
  return cr;
}

function buildPrompt(products: any[], promoted: string[], greeting: string, name: string, order: any, status: string) {
  const prom =
    promoted.length > 0 ? `\nPRODUCTOS RECOMENDADOS HOY:\n${promoted.map((p: string) => `⭐ ${p}`).join("\n")}` : "";
  const ctx = status !== "none" && order ? `\n\nPEDIDO ACTUAL:\n${JSON.stringify(order)}\nEstado: ${status}` : "";
  const now = new Date();
  const co = new Date(now.getTime() + (-5 * 60 + now.getTimezoneOffset()) * 60000);
  const h = co.getHours(),
    d = co.getDay();
  const peak = (d === 5 || d === 6) && h >= 18 && h <= 22;
  const we = d === 5 || d === 6;

  return `Eres ALICIA, la asistente virtual de "La Barra Crea Tu Pizza" en Ibagué.
Hablas de forma muy natural, cálida y amable, como una mesera amigable. Usas las palabras del cliente.

REGLAS DE FORMATO (MUY IMPORTANTE):
- NUNCA uses asteriscos (*), negritas, guiones de lista ni formato markdown
- Escribe mensajes CORTOS: máximo 2-3 líneas por respuesta
- Solo responde UNA cosa a la vez. NO listes todo el menú ni muchos productos de golpe
- Si el cliente saluda, saluda de vuelta y pregunta qué se le antoja. Nada más
- Si pide recomendación, recomienda MÁXIMO 2-3 productos con su precio
- SIEMPRE que menciones un producto incluye su precio exacto
- Máximo 1-2 emojis por mensaje
- Habla como por WhatsApp: frases cortas, directas, humanas
- Cuando el cliente pregunte "cuánto vale" un producto, responde SOLO el precio, no agregues párrafos

SALUDO: "${greeting}"

CARTA COMPLETA (link para el cliente): https://drive.google.com/file/d/1B5015Il35_1NUmc7jgQiZWMauCaiiSCe/view?usp=drivesdk

=== MENÚ OFICIAL CON PRECIOS (en miles COP) ===

LIMONADAS:
- Limonada Natural: Copa $9.000 / 500ml $26.000 / 1Lt $57.000
- Limonada Hierbabuena: Copa $12.000 / 500ml $28.000 / 1Lt $60.000
- Limonada Cerezada: Copa $14.000 / 1Lt $92.000
- Limonada Coco: Copa $16.000

SODIFICADAS:
- Sodificada Piña: $14.000
- Sodificada Frutos Rojos: $14.000
- Sodificada Lyche & Fresa: $16.000

CERVEZAS:
- Club Colombia: $12.000
- Corona: $16.000
- Stella Artois: $16.000
- Artesanal: $16.000

CÓCTELES:
- Gintonic: $42.000
- Mojito: $40.000
- Margarita: $38.000
- Piña Colada: $38.000
- Aperol Spritz: $28.000 (descuento especial)

BEBIDAS FRÍAS:
- Gaseosa: $8.000
- Agua mineral: $6.000
- Agua con gas: $6.000
- Agua St. Pellegrino 1L: $19.000

ENTRADAS:
- Nuditos De Ajo: $10.000
- Camarones a las Finas Hierbas: $35.000
- Champiñones Gratinados Queso Azul: $33.000
- Burrata La Barra: $38.000
- Burrata Tempura: $40.000
- Brie Al Horno: $32.000

PIZZAS CLÁSICAS (Personal / Mediana):
- Margarita: $21.000 / $35.000
- Hawaiana: $24.000 / $37.000
- Pollo & Champiñones: $27.000 / $39.000

PIZZAS PREMIUM (Personal / Mediana):
- Pepperoni: $32.000 / $45.000
- Del Huerto: $35.000 / $48.000
- Camarones: $38.000 / $52.000
- La Capricciosa: $35.000 / $52.000
- Colombiana de la Tata: $32.000 / $47.000
- Alpes (4 quesos): $33.000 / $49.000
- La Turca: $39.000 / $52.000
- Porchetta: $39.000 / $52.000
- A la Española: $36.000 / $49.000
- Siciliana: $36.000 / $49.000
- Dátiles: $38.000 / $49.000
- La Barra: Mediana $49.000 (consultar personal)
- Prosciutto & Burrata: Mediana $54.000 (consultar personal)
- Stracciatella: $39.000 / $54.000
- Anchoas: $39.000 / $53.000
- Pulpo: Mediana $54.000 (consultar personal)
- Valencia: $39.000 / $52.000
- Parmesana (Ganadora Pizza Master): $36.000 / $50.000
- Higos & Prosciutto Croccante: $38.000 / $52.000
- Diavola: $38.000 / $52.000
- Calzone: Personal $32.000 (solo personal)

TAPAS ESPAÑOLAS: Consultar precio

COCINA ITALIANA:
- Spaghetti Alla Bolognese: $39.000
- Fettuccine Carbonara: $39.000
- Fettuccine Con Camarones: $46.000
- Spaghetti A Los Cuatro Quesos: $42.000
- Spaghetti Al Teléfono: $42.000
- Ravioles Del Chef: Consultar precio
- Lasagna: Consultar precio

OTROS PLATOS:
- Hamburguesa Italiana (Angus 150gr): Consultar precio
- Brocheta di Manzo: Consultar precio
- Langostinos Parrillados: Consultar precio
- Brioche al Camarón: Consultar precio
- Brioche Pollo: Consultar precio
- Pan Francés & Bondiola De Cerdo: Consultar precio

VINOS (botella):
- Reservado: $68.000
- Frontera: $85.000
- Gato Negro: $90.000
- Casillero Del Diablo: $150.000
- Tío Pepe: $240.000

PIZZAS DULCES:
- Cocada: $20.000
- Lemon Crust: $20.000
- Hershey's & Malvaviscos: $32.000
- Dubai Chocolate: $38.000
- Canelate: $25.000
- Arándanos & Stracciatella: $32.000
- Arequipe: $20.000
- Frutos Del Bosque: $22.000
- Nutella: $24.000
- Nutella & Fresas: $32.000
- Arequipe & Stracciatella: $32.000

ADICIONES (extras para agregar a cualquier pizza o plato):
- Aceitunas: $5.000
- Alcachofas: $4.000
- Anchoas: $7.000
- Burrata: $15.000
- Camarones: $10.000
- Cebolla Morada: $2.000
- Champiñones: $5.000
- Chorizo Español: $7.000
- Dátiles: $5.000
- Bocconcinos: $7.000
- Bondiola: $8.000
- Lychee: $4.000
- Parmegiana: $5.000
- Pulpo: $12.000
- Stracciatella: $8.000
- Doble Carne: $8.000
- Gin (extra): $18.000
- Jamón Serrano: $7.500
- Licor Mojito: $13.000
- Lychee (bebida): $1.500
- Manzana Caramelizada: $6.000
- Masa Gruesa: $3.000
- Mozzarella: $6.000
- Pepperoni: $7.000
- Piña: $4.000
- Pistacho: $4.000
- Pollo: $5.000
- Pomodoro: $3.000
- Porchetta: $14.000
- Prosciutto: $6.000
- Proteína: $7.000
- Queso Azul: $3.500
- Queso Cheddar: $8.000
- Queso Cheddar con Tocineta: $8.000
- Queso Mozzarella: $6.000
- Queso Parmesano: $4.000
- Ricotta: $3.500
- Rúgula: $3.600
- Tocineta: $5.000
- Tomate Cherry: $4.000
- Vegetal: $4.000
- Papa Francesa: $6.000

EXTRAS SUELTOS:
- Coca Cola 300ml: $8.000
${prom}

=== FIN DEL MENÚ ===

REGLAS:
- Solo UN sabor por pizza, NO mitad y mitad
- Tamaños de pizza: Personal y Mediana
- "Crea Tu Pizza" (personalizada) → ---ESCALAMIENTO---
- Si un precio dice "Consultar", dile al cliente que verificarás y usa ---ESCALAMIENTO---

EMPAQUES (incluir siempre en pedidos para llevar/domicilio):
- Empaque Pizza: +$2.000
- Empaque Hamburguesa: +$3.000
- Empaque Pasta: +$3.000
- Vaso para llevar: +$1.000

DOMICILIO: No calculas tú el valor del domicilio, se paga directamente al domiciliario. Si insisten → ---CONSULTA_DOMICILIO---

TIEMPOS (solo si preguntan): Semana ~15min. Fin semana pico (Vie/Sab 6-10PM) ~30min. Trayecto ~25min. Actual: ${peak ? "HORA PICO ~30min" : we ? "Fin de semana ~15-20min" : "Semana ~15min"}

PAGO: Bancolombia Ahorros 718-000042-16, NIT 901684302 - LA BARRA CREA TU PIZZA. Pedir foto del comprobante. Cuando el cliente envíe la foto, confirma que la recibiste y dile que la verificarás.

ESCALAMIENTO: Si el cliente insiste en hablar con una persona, dile exactamente: "Claro, comunícate al 3014017559 y con gusto te atienden 😊" NO uses ---ESCALAMIENTO--- para eso. Solo usa ---ESCALAMIENTO--- para cosas técnicas que no puedas resolver (como Crea Tu Pizza o precios de consultar).

FLUJO PASO A PASO (un paso por mensaje, NO todos de golpe):
1. Saluda y pregunta qué quiere
2. Construir pedido producto por producto, confirmando precio de cada uno
3. Cuando el cliente termine, dar resumen con productos+empaques+TOTAL
4. Preguntar: recoger o domicilio (si domicilio, pedir dirección)
5. Pedir nombre del cliente
6. Indicar datos de pago
7. Todo confirmado → ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO---
JSON: {items:[{name,quantity,unit_price,packaging_cost}],packaging_total,subtotal,total,delivery_type,delivery_address,customer_name,payment_method,observations}

NUNCA inventes productos ni precios. Si no está en el menú, dile que no lo tienes.
${ctx}`;
}

async function callAI(sys: string, msgs: any[]) {
  const m = msgs
    .slice(-20)
    .map((x: any) => ({ role: x.role === "customer" ? "user" : "assistant", content: x.content }));
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: sys }, ...m],
      temperature: 0.7,
      max_tokens: 400,
    }),
  });
  if (!r.ok) {
    const e = await r.text();
    console.error("AI err:", e);
    throw new Error(e);
  }
  const d = await r.json();
  return d.choices?.[0]?.message?.content || "Lo siento, no pude procesar tu mensaje. ¿Podrías repetirlo?";
}

function parseOrder(txt: string) {
  const m = txt.match(/---PEDIDO_CONFIRMADO---\s*([\s\S]*?)\s*---FIN_PEDIDO---/);
  if (!m) return null;
  try {
    return {
      order: JSON.parse(m[1].trim()),
      clean: txt.replace(/---PEDIDO_CONFIRMADO---[\s\S]*?---FIN_PEDIDO---/, "").trim(),
    };
  } catch {
    return null;
  }
}

async function saveOrder(rid: string, cid: string, phone: string, order: any, config: any, paymentProofBase64?: string | null) {
  // Normalize delivery_type to match DB constraint
  const rawType = (order.delivery_type || "pickup").toLowerCase();
  const deliveryType = rawType.includes("domicilio") || rawType.includes("delivery") ? "delivery" : "pickup";
  
  const { data: saved, error } = await supabase
    .from("whatsapp_orders")
    .insert({
      restaurant_id: rid,
      conversation_id: cid,
      customer_phone: phone,
      customer_name: order.customer_name || "Cliente WhatsApp",
      items: order.items || [],
      total: order.total || 0,
      delivery_type: deliveryType,
      delivery_address: order.delivery_address || null,
      status: "received",
      email_sent: false,
    })
    .select()
    .single();
  if (error) {
    console.error("Save err:", error);
    return;
  }

  await supabase
    .from("whatsapp_conversations")
    .update({ order_status: "confirmed", current_order: order })
    .eq("id", cid);

  const rk = Deno.env.get("RESEND_API_KEY");
  if (!rk || !config.order_email) return;

  const items = (order.items || [])
    .map(
      (i: any) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${i.name}</td><td style="padding:8px;text-align:center;">${i.quantity}</td><td style="padding:8px;text-align:right;">$${(i.unit_price || 0).toLocaleString("es-CO")}</td><td style="padding:8px;text-align:right;">$${((i.unit_price || 0) * (i.quantity || 1)).toLocaleString("es-CO")}</td></tr>`,
    )
    .join("");
  
  const deliverySection =
    order.delivery_type === "delivery"
      ? `<div style="background:#fff3cd;padding:12px;border-radius:8px;margin:8px 0;border-left:4px solid #ffc107;">
          <p style="margin:0;font-weight:bold;">🏍️ DOMICILIO</p>
          <p style="margin:4px 0 0;font-size:16px;">📍 ${order.delivery_address || "Dirección no proporcionada"}</p>
        </div>`
      : `<p>🏪 Recoger en local</p>`;
  
  const paymentProofSection = paymentProofBase64
    ? `<div style="margin-top:16px;padding:12px;background:#d4edda;border-radius:8px;border-left:4px solid #28a745;">
        <p style="margin:0 0 8px;font-weight:bold;">💳 Comprobante de Pago Verificado</p>
        <img src="${paymentProofBase64}" style="max-width:100%;border-radius:8px;border:1px solid #ddd;" alt="Comprobante"/>
      </div>`
    : `<div style="margin-top:16px;padding:12px;background:#fff3cd;border-radius:8px;border-left:4px solid #ffc107;">
        <p style="margin:0;">⚠️ Comprobante de pago NO recibido aún</p>
      </div>`;

  const er = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${rk}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "ALICIA Pedidos <onboarding@resend.dev>",
      to: [config.order_email],
      subject: `🛒 Pedido - ${order.customer_name || "Cliente"} - $${(order.total || 0).toLocaleString("es-CO")}`,
      html: `<div style="font-family:Arial;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:24px;color:white;text-align:center;"><h1 style="margin:0;">🛒 Nuevo Pedido WhatsApp</h1></div>
        <div style="padding:24px;">
          <p><strong>👤</strong> ${order.customer_name || "Cliente"}</p>
          <p><strong>📱</strong> ${phone}</p>
          ${deliverySection}
          <table style="width:100%;border-collapse:collapse;margin-top:12px;"><thead><tr style="background:#f9fafb;"><th style="padding:8px;text-align:left;">Producto</th><th style="padding:8px;">Cant.</th><th style="padding:8px;text-align:right;">Precio</th><th style="padding:8px;text-align:right;">Subtotal</th></tr></thead><tbody>${items}</tbody>
          <tfoot><tr style="font-weight:bold;font-size:18px;"><td colspan="3" style="padding:12px 8px;text-align:right;">TOTAL:</td><td style="padding:12px 8px;text-align:right;color:#059669;">$${(order.total || 0).toLocaleString("es-CO")}</td></tr></tfoot></table>
          ${paymentProofSection}
          ${order.observations ? `<p style="margin-top:12px;"><strong>📝</strong> ${order.observations}</p>` : ""}
        </div></div>`,
    }),
  });
  if (er.ok) await supabase.from("whatsapp_orders").update({ email_sent: true }).eq("id", saved.id);
}

async function escalate(config: any, phone: string, reason: string) {
  const rk = Deno.env.get("RESEND_API_KEY");
  if (!rk || !config.order_email) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${rk}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "ALICIA Alertas <onboarding@resend.dev>",
      to: [config.order_email],
      subject: `⚠️ ALICIA - Cliente ${phone}`,
      html: `<p><strong>📱</strong> +${phone}</p><p><strong>📝</strong> ${reason}</p>`,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);

  // Debug: subscribe app to WABA webhooks
  if (url.searchParams.get("action") === "subscribe_waba") {
    const wabaId = url.searchParams.get("waba_id") || "1203273002014817";
    const token = GLOBAL_WA_TOKEN;
    const callbackUrl = `${SUPABASE_URL}/functions/v1/whatsapp-webhook`;
    
    // Subscribe app to WABA
    const subRes = await fetch(`https://graph.facebook.com/v22.0/${wabaId}/subscribed_apps`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        override_callback_uri: callbackUrl,
        verify_token: VERIFY_TOKEN,
      }),
    });
    const subData = await subRes.json();
    console.log("Subscribe WABA result:", JSON.stringify(subData));
    
    // Also check current subscriptions
    const checkRes = await fetch(`https://graph.facebook.com/v22.0/${wabaId}/subscribed_apps`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const checkData = await checkRes.json();
    console.log("Current subscriptions:", JSON.stringify(checkData));
    
    return new Response(JSON.stringify({ subscribe_result: subData, current_subscriptions: checkData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    console.log("Verify:", { mode, token });
    if (mode === "subscribe" && token === VERIFY_TOKEN) return new Response(challenge, { status: 200 });
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const value = body.entry?.[0]?.changes?.[0]?.value;
      if (!value?.messages?.length)
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      const msg = value.messages[0];
      const phoneId = value.metadata?.phone_number_id;
      const from = msg.from;
      
      // Handle image messages (payment proofs)
      let text = msg.text?.body || msg.button?.text || "";
      let paymentProofUrl: string | null = null;
      
      if (msg.type === "image") {
        const mediaId = msg.image?.id;
        const caption = msg.image?.caption || "";
        text = caption || "Te envié una foto del comprobante de pago";
        if (mediaId) {
          paymentProofUrl = await downloadMediaUrl(mediaId, GLOBAL_WA_TOKEN);
          console.log("Payment proof uploaded to:", paymentProofUrl);
        }
      }
      
      console.log(`Msg from ${from}: "${text}" (type: ${msg.type})`);
      if (!text.trim())
        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      let config: any = null;
      let token = GLOBAL_WA_TOKEN;
      let pid = phoneId || GLOBAL_WA_PHONE_ID;

      const { data: cd } = await supabase
        .from("whatsapp_configs")
        .select("*")
        .eq("whatsapp_phone_number_id", phoneId)
        .eq("is_active", true)
        .maybeSingle();
      if (cd) {
        config = cd;
        if (cd.whatsapp_access_token && cd.whatsapp_access_token !== "ENV_SECRET") token = cd.whatsapp_access_token;
      } else {
        const { data: fb } = await supabase
          .from("whatsapp_configs")
          .select("*")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();
        if (fb) {
          config = fb;
          if (fb.whatsapp_access_token && fb.whatsapp_access_token !== "ENV_SECRET") token = fb.whatsapp_access_token;
        }
      }

      if (!config) {
        await sendWA(pid, token, from, "Lo siento, este número aún no está configurado. 🙏");
        return new Response(JSON.stringify({ status: "no_config" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await markRead(pid, token, msg.id);
      const { data: rest } = await supabase
        .from("restaurants")
        .select("id, name")
        .eq("id", config.restaurant_id)
        .single();
      const rName = rest?.name || "Restaurante";
      const rId = config.restaurant_id;
      const conv = await getConversation(rId, from);
      const { data: prods } = await supabase
        .from("products")
        .select("id, name, price, description, category_id")
        .eq("restaurant_id", rId)
        .eq("is_active", true)
        .order("name");

      const msgs = Array.isArray(conv.messages) ? conv.messages : [];
      msgs.push({ role: "customer", content: text, timestamp: new Date().toISOString(), has_image: !!paymentProofUrl });
      
      // Store payment proof URL when image received
      if (paymentProofUrl) {
        await supabase.from("whatsapp_conversations").update({ payment_proof_url: paymentProofUrl }).eq("id", conv.id);
      }

      const sys = buildPrompt(
        prods || [],
        config.promoted_products || [],
        config.greeting_message || "¡Hola! Bienvenido 👋",
        rName,
        conv.current_order,
        conv.order_status,
      );
      const ai = await callAI(sys, msgs);

      const parsed = parseOrder(ai);
      let resp = ai;
      
      // Get stored payment proof from conversation if exists
      const storedProof = paymentProofUrl || conv.payment_proof_url || null;
      
      if (parsed) {
        resp = parsed.clean || "✅ ¡Pedido registrado! 🍽️";
        await saveOrder(rId, conv.id, from, parsed.order, config, storedProof);
      }
      if (resp.includes("---ESCALAMIENTO---")) {
        resp = resp.replace(/---ESCALAMIENTO---/g, "").trim();
        await escalate(config, from, "Cliente necesita atención humana");
      }
      if (resp.includes("---CONSULTA_DOMICILIO---")) {
        resp = resp.replace(/---CONSULTA_DOMICILIO---/g, "").trim();
        await escalate(config, from, "Cliente pregunta costo domicilio");
      }

      msgs.push({ role: "assistant", content: resp, timestamp: new Date().toISOString() });
      await supabase
        .from("whatsapp_conversations")
        .update({
          messages: msgs.slice(-30),
          customer_name: parsed?.order?.customer_name || conv.customer_name,
          current_order: parsed ? parsed.order : conv.current_order,
          order_status: parsed ? "confirmed" : conv.order_status,
        })
        .eq("id", conv.id);

      await sendWA(pid, token, from, resp);
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Error:", e);
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
