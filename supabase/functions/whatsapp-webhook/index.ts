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
    if (!metaRes.ok) {
      console.error("Media meta error:", await metaRes.text());
      return null;
    }
    const metaData = await metaRes.json();
    const mediaUrl = metaData.url;
    if (!mediaUrl) return null;

    // Download and upload to Supabase Storage
    const dlRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${token.trim()}` },
    });
    if (!dlRes.ok) {
      console.error("Media download error:", await dlRes.text());
      return null;
    }
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

  return `Eres ALICIA, la asistente virtual y MEJOR VENDEDORA de "La Barra Crea Tu Pizza" en Ibagué.
Hablas de forma muy natural, cálida y amable, como la mejor mesera del restaurante. Usas las palabras del cliente.
Tu objetivo principal es AUMENTAR EL TICKET PROMEDIO de cada pedido de forma natural y genuina, sin ser invasiva.

ESTRATEGIA DE VENTA (TU CORE - MUY IMPORTANTE):

1. UPGRADE DE PRODUCTO: Cuando el cliente pida una pizza básica o clásica, sugiérele UNA alternativa premium que sea similar pero mejor. Ejemplos:
   - Hawaiana → Recomienda la Porchetta ($39.000/$52.000): "La hawaiana es clásica, pero tenemos una que te va a encantar: la Porchetta, que es como el renacimiento de la hawaiana con porchetta italiana ahumada, piña a la parrilla y stracciatella 🤤 vale $39.000 la personal. Te animas?"
   - Margarita → Recomienda La Barra ($36.000/$49.000): explica los ingredientes gourmet
   - Pepperoni → Recomienda la Parmesana ($36.000/$50.000) o Siciliana ($36.000/$49.000)
   - Pollo & Champiñones → Recomienda La Capricciosa ($35.000/$52.000)
   - Si el cliente dice que no, respeta su elección y continúa sin insistir

2. CROSS-SELLING (agregar más al pedido): Después de que el cliente elija su plato principal:
   - Si pide pizza → sugiere Nuditos de Ajo ($10.000): "Para mientras llega la pizza, unos nuditos de ajo quedan espectaculares, son solo $10.000 😋"
   - Si el pedido es de $35.000+ → sugiere una bebida: limonada, cerveza o cóctel
   - Si pide 2+ pizzas → sugiere una Sangría Tinto (copa $26.000) o botella de vino
   - Si es fin de semana → menciona los cócteles o la Sangría
   - Si el pedido es grande ($80.000+) → sugiere una pizza dulce para el postre: "Y para cerrar con broche de oro, te recomiendo la Cocada, que es increíble, solo $20.000 🍫"
   - NO bombardees con todo a la vez. UNA sugerencia por mensaje

3. TIMING DE VENTA: 
   - Haz la sugerencia de upgrade ANTES de confirmar el producto
   - Haz cross-selling DESPUÉS de que el cliente ya eligió su plato principal
   - NO sugieras más cuando el cliente diga "eso es todo" o "ya con eso"
   - Si el cliente rechaza una sugerencia, NO insistas. Pasa al siguiente paso

4. LENGUAJE DE VENTA (natural, nunca robótico):
   - "Te cuento que..." / "Mira que tenemos..." / "Una que te va a encantar es..."
   - Describe brevemente qué hace especial al producto (2-3 ingredientes clave)
   - SIEMPRE incluye el precio para que el cliente decida fácil
   - Nunca digas "¿quieres agregar algo más?" de forma genérica. Sé específica con la sugerencia

REGLAS DE FORMATO (MUY IMPORTANTE):
- NUNCA uses asteriscos (*), negritas, guiones de lista ni formato markdown
- Escribe mensajes CORTOS: máximo 3-4 líneas por respuesta
- Solo responde UNA cosa a la vez
- Si el cliente saluda, saluda de vuelta y pregunta qué se le antoja. Nada más
- SIEMPRE que menciones un producto incluye su precio exacto
- Máximo 1-2 emojis por mensaje
- Habla como por WhatsApp: frases cortas, directas, humanas
- Cuando el cliente pregunte "cuánto vale" un producto, responde SOLO el precio, no agregues párrafos

SALUDO: "${greeting}"

CARTA COMPLETA (link para el cliente): https://drive.google.com/file/d/1B5015Il35_1NUmc7jgQiZWMauCaiiSCe/view?usp=drivesdk

=== MENÚ OFICIAL CON PRECIOS (en miles COP) ===

LIMONADAS:
- Limonada Natural: $9.000
- Limonada Hierbabuena: $12.000
- Limonada Cerezada: $14.000
- ⭐ Limonada Coco: $16.000 (recomendada)

SODIFICADAS:
- Sodificada Piña: $14.000
- Sodificada Frutos Rojos: $14.000
- Sodificada Lyche & Fresa: $16.000

CÓCTELES:
- Gintonic: $42.000
- ⭐ Mojito: $40.000 (recomendado)
- Margarita: $38.000
- ⭐ Piña Colada: $38.000 (recomendada)
- Aperol Spritz: $28.000 (descuento especial)

SANGRÍA:
- ⭐ Sangría Tinto: Copa $26.000 / 500ml $57.000 / 1Lt $86.000 (recomendada)
- Sangría Blanco: Copa $28.000 / 500ml $60.000 / 1Lt $92.000
- Copa De Vino: $26.000
- Tinto De Verano: $25.000

CERVEZAS:
- Club Colombia: $12.000
- Corona: $16.000
- Stella Artois: $16.000
- Artesanal: $16.000

BEBIDAS FRÍAS:
- Gaseosa: $8.000
- Agua mineral: $6.000
- Agua con gas: $6.000
- Agua St. Pellegrino 1L: $19.000

ENTRADAS:
- Nuditos De Ajo: $10.000 (deliciosos nuditos horneados en salsa de mantequilla y ajo)
- Camarones a las Finas Hierbas: $35.000 (en reducción de salsa a las finas hierbas en canasta de parmesano)
- Champiñones Gratinados Queso Azul: $33.000 (5 champiñones enteros bañados en salsa de queso azul con parmesano)
- Burrata La Barra: $38.000 (mozzarella de búfala fresca, manzanas caramelizadas, tomates cherry salteados y pistacho)
- Burrata Tempura: $40.000 (mozzarella de búfala tempurizada, jamón serrano y salsa napolitana)
- Brie Al Horno: $32.000 (queso Brie al horno de leña con miel de agave, nueces pecanas, pera salada y arándanos)

PIZZAS CLÁSICAS (Personal / Mediana):
- Margarita: $21.000 / $35.000 (napolitana, mozzarella, bocconcinos, albahaca y tomate cherry)
- Hawaiana: $24.000 / $37.000 (salsa napolitana, mozzarella, jamón, piña)
- Pollo & Champiñones: $27.000 / $39.000 (napolitana, mozzarella, pollo, queso azul, champiñones al ajillo)

PIZZAS ESPECIALES (Personal / Mediana):
- Pepperoni: $32.000 / $45.000
- Del Huerto: $35.000 / $48.000
- ⭐ Camarones: $38.000 / $52.000 (salsa Alfredo, mozzarella, camarones salteados al ajillo - recomendada)
- La Capricciosa: $35.000 / $52.000
- ⭐ Colombiana de la Tata: $32.000 / $47.000 (salsa criolla, bondiola, mozzarella, cebolla morada, maíz tierno, reducción en cerveza - recomendada)
- Alpes (4 quesos): $33.000 / $49.000
- La Turca: $39.000 / $52.000
- ⭐ Porchetta: $39.000 / $52.000 (el renacimiento de la hawaiana: porchetta italiana ahumada, piña a la parrilla y stracciatella - recomendada)

PIZZAS GOURMET (Personal / Mediana):
- A la Española: $36.000 / $49.000
- Siciliana: $36.000 / $49.000
- Dátiles: $38.000 / $49.000
- ⭐ La Barra: $36.000 / $49.000 (napolitana, mozzarella, queso azul, manzana caramelizada, rúgula, jamón prosciutto, nueces pecanas, miel de peperonchino - recomendada)
- Prosciutto & Burrata: Mediana $54.000 (solo mediana)
- ⭐ Stracciatella: $39.000 / $54.000 (napolitana, mozzarella, tomate seco, pepperoni, rúgula y stracciatella - recomendada)
- Anchoas: $39.000 / $53.000
- ⭐ Pulpo: Mediana $54.000 (napolitana, mozzarella, pulpo al ajillo, tomate parrillado y stracciatella - solo mediana, recomendada)

PIZZAS ESPECIALES PREMIUM (Personal / Mediana):
- Valencia: $39.000 / $52.000
- ⭐ Parmesana: $36.000 / $50.000 (recomendada)
- ⭐ Higos & Prosciutto Croccante: $38.000 / $52.000 (recomendada)
- Diavola: $38.000 / $52.000
- Calzone: Personal $32.000 (solo personal)

TAPAS ESPAÑOLAS: $39.000 (4 tapas de pan francés con queso Philadelphia)
Sabores disponibles: Chorizo Español-Queso azul-Dátiles / Prosciutto-Rúgula-Parmesano / Chorizo Español-Bocconcinos-Cherry

COCINA ITALIANA:
- Spaghetti Alla Bolognese: $39.000
- ⭐ Fettuccine Carbonara: $39.000 (recomendada)
- ⭐ Fettuccine Con Camarones: $46.000 (recomendada)
- Spaghetti A Los Cuatro Quesos: $42.000
- Spaghetti Al Teléfono: $42.000

PASTAS ESPECIALES:
- Ravioles Del Chef: $48.000 (ravioles boloñesa, cuatro quesos, ricota y espinaca)
- Lasagna: $43.000 (bolognese o mixta en salsa de quesos, ricotta y albahaca)

BUON APPETITO:
- Hamburguesa Italiana: $38.000 (150gr angus, tocineta, rúgula, papas francesas, queso cheddar)
- Brocheta di Manzo: $39.000 (carne de res y pollo con pimentón, cebolla, papas francesas y ensalada caprese)
- Langostinos Parrillados: $52.000 (brocheta de langostinos a la parrilla con nuditos de ajo)

SÁNDWICHES:
- Brioche al Camarón: $42.000 (camarón tempura, rúgula, queso filadelfia, tomate cherry, pan brioche y papas francesas)
- Brioche Pollo: $38.000 (pollo en salsa blanca, champiñones, rúgula, queso azul, pan brioche y papas francesas)
- Pan Francés & Bondiola De Cerdo: $38.000 (pan francés recién horneado, bondiola en reducción de cerveza y mozzarella)

VINOS (botella):
- Reservado: $68.000
- Frontera: $85.000
- Gato Negro: $90.000
- Casillero Del Diablo: $150.000
- Tío Pepe: $240.000

PIZZAS DULCES (misma masa, delgada, ligera y crocante como un verdadero postre):
- ⭐ Cocada: $20.000 (arequipe y crema inglesa, coco caramelizado y helado de vainilla - recomendada)
- ⭐ Lemon Crust: $20.000 (crema de limón, trozos de galleta y ralladura de limón - recomendada)
- ⭐ Hershey's & Malvaviscos: $32.000 (chocolate, malvaviscos flameados, trozos de galleta y hershey's - recomendada)
- Dubai Chocolate: $38.000 (chocolate, crema de pistacho, knafeh, pistachos tostados, chocolate blanco)
- Canelate: $25.000 (chocolate, azúcar y canela, helado de vainilla y crema chantilly)
- ⭐ Arándanos & Stracciatella: $32.000 (arándanos caramelizados y queso stracciatella - recomendada)
- Arequipe: $20.000 (arequipe, helado de vainilla y crema chantilly)
- Frutos Del Bosque: $22.000 (frutos del bosque caramelizados, helado de vainilla y crema chantilly)
- Nutella: $24.000 (Nutella, helado de vainilla y crema chantilly)
- ⭐ Nutella & Fresas: $32.000 (Nutella, queso, fresas y azúcar pulverizada, masa gruesa - recomendada)
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
- Tamaños de pizza: Personal y Mediana (algunos solo tienen un tamaño, respeta eso)
- "Crea Tu Pizza" (personalizada): Personal $32.000, Mediana $49.000, incluye 6 toppings. Los toppings marcados como adicional tienen costo extra según la sección ADICIONES. Para este tipo de pizza → ---ESCALAMIENTO--- (que el humano asesore los toppings)
- NUNCA digas que un producto no existe si está en el menú. Verifica bien antes de responder
- Los productos marcados con ⭐ son los recomendados, priorízalos en sugerencias

EMPAQUES (incluir siempre en pedidos para llevar/domicilio):
- Empaque Pizza: +$2.000
- Empaque Hamburguesa: +$3.000
- Empaque Pasta: +$3.000
- Vaso para llevar: +$1.000

DOMICILIO: No calculas tú el valor del domicilio, se paga directamente al domiciliario. Si insisten → ---CONSULTA_DOMICILIO---

TIEMPOS (solo si preguntan): Semana ~15min. Fin semana pico (Vie/Sab 6-10PM) ~30min. Trayecto ~25min. Actual: ${peak ? "HORA PICO ~30min" : we ? "Fin de semana ~15-20min" : "Semana ~15min"}

PAGO: Bancolombia Ahorros 718-000042-16, NIT 901684302 - LA BARRA CREA TU PIZZA. Pedir foto del comprobante. Cuando el cliente envíe la foto, confirma que la recibiste y dile que la verificarás.

ESCALAMIENTO: Si el cliente insiste en hablar con una persona, dile exactamente: "Claro, comunícate al 3014017559 y con gusto te atienden 😊" NO uses ---ESCALAMIENTO--- para eso. Solo usa ---ESCALAMIENTO--- para cosas técnicas que no puedas resolver (como Crea Tu Pizza personalizada).

FLUJO PASO A PASO (un paso por mensaje, NO todos de golpe):
1. Saluda y pregunta qué se le antoja hoy
2. Cliente dice qué quiere → ANTES de confirmar, sugiere un UPGRADE si aplica (solo 1 vez por producto)
3. Cliente elige → confirma su elección con precio. Luego sugiere UN complemento (entrada, bebida o postre)
4. Construir pedido producto por producto. Cuando el cliente diga que ya terminó, dar resumen con productos+empaques+TOTAL
5. Preguntar: recoger o domicilio (si domicilio, pedir dirección)
6. Pedir nombre del cliente
7. Indicar datos de pago
8. Todo confirmado → ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO---
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
  console.log(txt);
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

async function saveOrder(
  rid: string,
  cid: string,
  phone: string,
  order: any,
  config: any,
  paymentProofUrl?: string | null,
) {
  // Normalize delivery_type to match DB constraint
  const rawType = (order.delivery_type || "pickup").toLowerCase();
  const isDelivery = rawType.includes("domicilio") || rawType.includes("delivery");
  const deliveryType = isDelivery ? "delivery" : "pickup";

  // Normalize payment method
  const rawPayment = (order.payment_method || "").toLowerCase();
  const isEfectivo = rawPayment.includes("efectivo") || rawPayment.includes("cash") || rawPayment.includes("contra");

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
        `<tr><td style="padding:10px 12px;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">${i.name}</td><td style="padding:10px 12px;text-align:center;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">${i.quantity}</td><td style="padding:10px 12px;text-align:right;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">$${(i.unit_price || 0).toLocaleString("es-CO")}</td><td style="padding:10px 12px;text-align:right;border-bottom:1px solid #1a1a1a;color:#e0e0e0;">$${((i.unit_price || 0) * (i.quantity || 1)).toLocaleString("es-CO")}</td></tr>`,
    )
    .join("");

  const deliverySection = isDelivery
    ? `<div style="background:linear-gradient(135deg,rgba(0,212,170,0.15),rgba(255,107,53,0.10));padding:14px 16px;border-radius:10px;margin:12px 0;border-left:4px solid #00D4AA;">
        <p style="margin:0;font-weight:bold;color:#00D4AA;font-size:14px;">🏍️ DOMICILIO</p>
        <p style="margin:6px 0 0;font-size:16px;color:#ffffff;">📍 ${order.delivery_address || "Dirección no proporcionada"}</p>
      </div>`
    : `<div style="background:rgba(255,107,53,0.10);padding:14px 16px;border-radius:10px;margin:12px 0;border-left:4px solid #FF6B35;">
        <p style="margin:0;font-weight:bold;color:#FF6B35;">🏪 Recoger en local</p>
      </div>`;

  // Payment section based on method
  let paymentSection = "";
  if (isEfectivo) {
    paymentSection = `<div style="padding:14px 16px;background:rgba(0,212,170,0.12);border-radius:10px;border-left:4px solid #00D4AA;margin-top:12px;">
      <p style="margin:0;font-weight:bold;color:#00D4AA;">💵 Pago en Efectivo</p>
      <p style="margin:4px 0 0;color:#b0b0b0;font-size:13px;">${isDelivery ? "El cliente paga al domiciliario" : "El cliente paga al recoger"}</p>
    </div>`;
  } else if (paymentProofUrl) {
    paymentSection = `<div style="padding:14px 16px;background:rgba(0,212,170,0.12);border-radius:10px;border-left:4px solid #00D4AA;margin-top:12px;">
      <p style="margin:0 0 8px;font-weight:bold;color:#00D4AA;">💳 Comprobante de Pago</p>
      <img src="${paymentProofUrl}" style="max-width:100%;border-radius:8px;border:1px solid #333;" alt="Comprobante"/>
    </div>`;
  } else {
    const methodLabel = order.payment_method || "No especificado";
    paymentSection = `<div style="padding:14px 16px;background:rgba(255,107,53,0.10);border-radius:10px;border-left:4px solid #FF6B35;margin-top:12px;">
      <p style="margin:0;font-weight:bold;color:#FF6B35;">💳 Método: ${methodLabel}</p>
      <p style="margin:4px 0 0;color:#b0b0b0;font-size:13px;">Pendiente de comprobante</p>
    </div>`;
  }

  const er = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${rk}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "CONEKTAO Pedidos <onboarding@resend.dev>",
      to: [config.order_email],
      subject: `🍕 Pedido ${isDelivery ? "Domicilio" : "Recoger"} - ${order.customer_name || "Cliente"} - $${(order.total || 0).toLocaleString("es-CO")}`,
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;border-radius:16px;overflow:hidden;border:1px solid #1a1a1a;">
        <div style="background:linear-gradient(135deg,#FF6B35,#00D4AA);padding:28px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">CONEKTAO</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Nuevo Pedido por WhatsApp</p>
        </div>
        <div style="padding:24px;">
          <div style="display:flex;gap:8px;margin-bottom:16px;">
            <div style="background:#111;padding:12px 16px;border-radius:10px;flex:1;border:1px solid #1a1a1a;">
              <p style="margin:0;color:#888;font-size:11px;text-transform:uppercase;">Cliente</p>
              <p style="margin:4px 0 0;color:#fff;font-size:16px;font-weight:600;">👤 ${order.customer_name || "Cliente"}</p>
            </div>
            <div style="background:#111;padding:12px 16px;border-radius:10px;flex:1;border:1px solid #1a1a1a;">
              <p style="margin:0;color:#888;font-size:11px;text-transform:uppercase;">Teléfono</p>
              <p style="margin:4px 0 0;color:#fff;font-size:16px;">📱 +${phone}</p>
            </div>
          </div>
          ${deliverySection}
          <table style="width:100%;border-collapse:collapse;margin-top:16px;background:#111;border-radius:10px;overflow:hidden;border:1px solid #1a1a1a;">
            <thead><tr style="background:#151515;"><th style="padding:10px 12px;text-align:left;color:#00D4AA;font-size:12px;text-transform:uppercase;">Producto</th><th style="padding:10px 12px;color:#00D4AA;font-size:12px;text-transform:uppercase;">Cant.</th><th style="padding:10px 12px;text-align:right;color:#00D4AA;font-size:12px;text-transform:uppercase;">Precio</th><th style="padding:10px 12px;text-align:right;color:#00D4AA;font-size:12px;text-transform:uppercase;">Subtotal</th></tr></thead>
            <tbody>${items}</tbody>
            <tfoot><tr><td colspan="3" style="padding:14px 12px;text-align:right;font-weight:bold;font-size:18px;color:#ffffff;border-top:2px solid #00D4AA;">TOTAL:</td><td style="padding:14px 12px;text-align:right;font-weight:bold;font-size:20px;color:#00D4AA;border-top:2px solid #00D4AA;">$${(order.total || 0).toLocaleString("es-CO")}</td></tr></tfoot>
          </table>
          ${paymentSection}
          ${order.observations ? `<div style="margin-top:12px;padding:12px 16px;background:#111;border-radius:10px;border:1px solid #1a1a1a;"><p style="margin:0;color:#888;font-size:11px;text-transform:uppercase;">Observaciones</p><p style="margin:4px 0 0;color:#e0e0e0;">📝 ${order.observations}</p></div>` : ""}
        </div>
        <div style="padding:16px 24px;background:#050505;text-align:center;border-top:1px solid #1a1a1a;">
          <p style="margin:0;color:#555;font-size:11px;">Powered by <span style="background:linear-gradient(135deg,#FF6B35,#00D4AA);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:bold;">CONEKTAO</span></p>
        </div>
      </div>`,
    }),
  });
  const resendBody = await er.text();
  console.log("Resend response status:", er.status, "body:", resendBody);
  if (er.ok) {
    await supabase.from("whatsapp_orders").update({ email_sent: true }).eq("id", saved.id);
  } else {
    console.error("Resend FAILED:", er.status, resendBody);
  }
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

  // Admin: reset a conversation
  if (url.searchParams.get("action") === "reset_conv") {
    const phone = url.searchParams.get("phone") || "";
    const { error } = await supabase
      .from("whatsapp_conversations")
      .update({ order_status: "none", current_order: null, messages: [], payment_proof_url: null })
      .eq("customer_phone", phone);
    return new Response(JSON.stringify({ reset: !error, error }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Admin: update config
  if (url.searchParams.get("action") === "update_email") {
    const email = url.searchParams.get("email") || "";
    const { error } = await supabase
      .from("whatsapp_configs")
      .update({ order_email: email })
      .eq("id", "5ab1a230-f503-4573-8b04-79628bdc4a7c");
    return new Response(JSON.stringify({ updated: !error, email, error }), {
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
