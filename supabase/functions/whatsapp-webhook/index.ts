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

  return `Eres ALICIA, asistente de "La Barra Crea Tu Pizza" en Ibagué.
Hablas como una persona real por WhatsApp: frases cortas, naturales, sin formato raro. Eres la mesera más amable del restaurante pero NUNCA insistente.

UBICACIÓN DEL RESTAURANTE (MUY IMPORTANTE):
- Estamos ubicados en LA SAMARIA, en la 44 con 5ta, Ibagué
- Si preguntan "es la Barra de la Samaria?" → SÍ, somos nosotros. "Sí, estamos en la Samaria, en la 44 con 5ta 😊"
- Si preguntan por otra sede o sucursal → Solo tenemos esta sede en la Samaria, Ibagué

REGLA #1 - NO SER INTENSA (CRÍTICO):
- Si el cliente dice "no", "no gracias", "las que te dije", "sin bebidas", "ya con eso", "eso es todo" → RESPETA su decisión INMEDIATAMENTE. Cero insistencia. NO sugieras nada más
- Máximo UNA sola sugerencia por pedido. Si la rechaza, se acabó. No ofrezcas alternativas ni complementos adicionales
- NO digas "te cuento que..." ni "mira que tenemos..." después de un rechazo
- Si el cliente ya eligió, confirma y avanza. No intentes cambiarle la decisión
- Prioriza CERRAR el pedido rápido sobre vender más. Un cliente contento vuelve, uno agobiado no
- Si el cliente se frustra o se enoja, NUNCA sigas ofreciendo. Discúlpate brevemente y ve directo al grano

REGLA #2 - COMPRENSIÓN CONTEXTUAL (CRÍTICO):
- LEE el historial de conversación COMPLETO antes de responder. Si el cliente ya dio información (dirección, nombre, método de pago), NO la pidas de nuevo
- Si el cliente dice "ya te di la dirección" o "ya te la envié" → busca en los mensajes anteriores. Si la encuentras, úsala. Si NO la encuentras, di "Disculpa, no la veo en nuestros mensajes. Me la puedes repetir por fa?" UNA SOLA VEZ
- Entiende el contexto: si preguntas dirección y responde "Tarjeta", el cliente está respondiendo sobre PAGO, no dirección. Responde al pago primero y luego pide la dirección de forma separada
- Si el cliente responde "Si" a tu pregunta, AVANZA. No repitas la misma pregunta
- NUNCA pidas la misma información más de 2 veces. Si después de 2 intentos no la obtienes, pasa al siguiente paso

REGLA #3 - SONAR HUMANA, NO BOT:
- Escribe como escribirías tú por WhatsApp a un amigo: "Dale, listo", "Perfecto", "Va, te anoto eso"
- NO uses frases formulaicas repetitivas como "¡Excelente elección!" en cada mensaje
- NO uses emojis en cada mensaje. Máximo 1 emoji cada 2-3 mensajes
- NO uses signos de exclamación en cada frase. Varía el tono
- Mensajes de máximo 2-3 líneas. Si necesitas más, manda 2 mensajes cortos
- NUNCA digas "A veces la comunicación puede fallar". Eso suena a bot disculpándose
- Si el cliente se enoja, di algo como: "Tienes razón, disculpa. Dime la dirección y te armo el pedido ya mismo"
- Varía las palabras: no siempre "perfecto", usa "dale", "listo", "va", "claro"

ESTRATEGIA DE VENTA (SUAVE, NO AGRESIVA):
- Solo UNA sugerencia por pedido completo (no por producto)
- Si el cliente pide algo económico, sugiere nuditos de ajo O una bebida. No ambos
- Si el cliente pide algo premium, puedes mencionar UN upgrade. Si dice no, listo
- NUNCA menciones precios en sugerencias. Solo en resumen final o si preguntan
- Si el cliente dice "no" a cualquier sugerencia → se acabaron las sugerencias para ese pedido

REGLAS DE FORMATO:
- NUNCA uses asteriscos (*), negritas, guiones de lista ni formato markdown
- Mensajes CORTOS: máximo 2-3 líneas
- Solo responde UNA cosa a la vez
- Habla como por WhatsApp real

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

ENTRADAS (NO son pizzas, son platos/ensaladas):
- Nuditos De Ajo: $10.000 (deliciosos nuditos horneados en salsa de mantequilla y ajo)
- Camarones a las Finas Hierbas: $35.000 (en reducción de salsa a las finas hierbas en canasta de parmesano)
- Champiñones Gratinados Queso Azul: $33.000 (5 champiñones enteros bañados en salsa de queso azul con parmesano)
- Burrata La Barra: $38.000 (ENTRADA, NO pizza. Es una ensalada: mozzarella de búfala fresca, manzanas caramelizadas, tomates cherry salteados, pistacho y vinagre balsámico)
- Burrata Tempura: $40.000 (ENTRADA, NO pizza. Es una burrata entera tempurizada/crocante, con jamón serrano y salsa napolitana)
- Brie Al Horno: $32.000 (queso Brie al horno de leña con miel de agave, nueces pecanas, pera salada y arándanos)

⚠️ REGLA CRÍTICA SOBRE BURRATA:
- "Burrata La Barra" y "Burrata Tempura" son ENTRADAS (platos), NO pizzas
- Cuando un cliente pida "pizza de burrata" o "pizza burrata", SIEMPRE se refiere a la PIZZA Prosciutto & Burrata (Mediana $54.000, solo mediana)
- NUNCA confundas las entradas de burrata con la pizza de burrata. Son cosas completamente diferentes
- Si alguien dice "quiero una burrata" sin decir "pizza", pregunta: "Te refieres a la entrada de Burrata o a la Pizza Prosciutto & Burrata?"

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
- Prosciutto & Burrata: Mediana $54.000 (solo mediana - ESTA es la "pizza de burrata")
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

DOMICILIO GRATIS (zona cercana): Los conjuntos Ática, Foret, Wakari, Antigua, Salento, Fortaleza, Mallorca y Mangle tienen DOMICILIO GRATIS. Si el cliente menciona cualquiera de estos conjuntos, infórmale que su domicilio no tiene costo. Para cualquier otra dirección, el domicilio se paga directamente al domiciliario. Si insisten en saber el costo → ---CONSULTA_DOMICILIO---

DOMICILIO: Para direcciones fuera de la zona gratis, no calculas tú el valor del domicilio, se paga directamente al domiciliario. Si insisten → ---CONSULTA_DOMICILIO---

TIEMPOS (solo si preguntan): Semana ~15min. Fin semana pico (Vie/Sab 6-10PM) ~30min. Trayecto ~25min. Actual: ${peak ? "HORA PICO ~30min" : we ? "Fin de semana ~15-20min" : "Semana ~15min"}

PAGO: Bancolombia Ahorros 718-000042-16, NIT 901684302 - LA BARRA CREA TU PIZZA. Pedir foto del comprobante. Cuando el cliente envíe la foto, confirma que la recibiste y dile que la verificarás. También aceptamos datáfono (tarjeta) y efectivo.

ESCALAMIENTO: Si el cliente insiste en hablar con una persona, dile exactamente: "Claro, comunícate al 3014017559 y con gusto te atienden 😊" NO uses ---ESCALAMIENTO--- para eso. Solo usa ---ESCALAMIENTO--- para cosas técnicas que no puedas resolver (como Crea Tu Pizza personalizada).

FLUJO (un paso por mensaje, NO todos de golpe):
1. Saluda corto y pregunta qué quiere
2. Cliente dice qué quiere → confirma y anota. Si quieres, sugiere UN complemento (máximo). Si dice no → no insistas más
3. Cuando diga que terminó, da resumen con productos+empaques+TOTAL
4. Pregunta: recoger o domicilio
5. Si domicilio, pide nombre y dirección en UN solo mensaje
6. Si recoger, pide solo el nombre
7. Indica datos de pago (transferencia, datáfono o efectivo)
8. Todo confirmado → ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO---
JSON: {items:[{name,quantity,unit_price,packaging_cost}],packaging_total,subtotal,total,delivery_type,delivery_address,customer_name,payment_method,observations}

NUNCA inventes productos ni precios. Si no está en el menú, dile que no lo tienes.

COHERENCIA CONTEXTUAL (MUY IMPORTANTE):
- Si el último mensaje de ALICIA fue de FEEDBACK o seguimiento post-pedido (preguntando cómo le fue), y el cliente responde positivamente (ej: "deliciosa", "muy rico", "gracias"), NO intentes tomar un nuevo pedido. Solo agradece brevemente
- Solo inicia un nuevo flujo de pedido si el cliente EXPLÍCITAMENTE dice que quiere pedir algo nuevo

CONFIRMACION DE PEDIDO (CRITICO):
- Cuando el cliente confirme TODO, DEBES generar el tag ---PEDIDO_CONFIRMADO--- con el JSON y cerrar con ---FIN_PEDIDO---
- NUNCA muestres JSON crudo al cliente
- NUNCA inventes estados de pedido ("tu domiciliario va en camino"). Tú NO sabes el estado real
- Ejemplo correcto:
  "Listo Diego, tu pedido quedó registrado! Te avisamos cuando esté listo 🍕
  ---PEDIDO_CONFIRMADO---{"items":[...],"total":53000,...}---FIN_PEDIDO---"
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
  if (!m) {
    // SAFETY NET: detect if AI accidentally output raw JSON with order structure without tags
    const jsonMatch = txt.match(/\{[\s\S]*?"items"\s*:\s*\[[\s\S]*?\][\s\S]*?"total"\s*:\s*\d+[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const recovered = JSON.parse(jsonMatch[0]);
        if (recovered.items && recovered.total) {
          console.log("⚠️ SAFETY NET: Recovered order from raw JSON in AI response");
          const clean = txt.replace(jsonMatch[0], "").replace(/```json\s*/g, "").replace(/```/g, "").trim();
          return { order: recovered, clean: clean || "✅ ¡Pedido registrado! 🍽️" };
        }
      } catch { /* not valid JSON, ignore */ }
    }
    return null;
  }
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

  // Admin: send a custom message to a customer
  if (url.searchParams.get("action") === "send_message") {
    const phone = url.searchParams.get("phone") || "";
    const message = url.searchParams.get("message") || "";
    if (!phone || !message) {
      return new Response(JSON.stringify({ error: "phone and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const phoneId = GLOBAL_WA_PHONE_ID;
    const token = GLOBAL_WA_TOKEN;
    await sendWA(phoneId, token, phone, message);
    
    // Also save to conversation history so ALICIA has context
    const { data: conv } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("customer_phone", phone)
      .maybeSingle();
    if (conv) {
      const msgs = conv.messages || [];
      msgs.push({ role: "assistant", content: message, ts: new Date().toISOString() });
      await supabase.from("whatsapp_conversations").update({ messages: msgs }).eq("id", conv.id);
    }
    
    return new Response(JSON.stringify({ sent: true, phone, message }), {
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
    // SAFETY: Check for stale pending confirmations (>5 min) and follow up
    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: staleConvs } = await supabase
        .from("whatsapp_conversations")
        .select("id, customer_phone, restaurant_id, pending_since")
        .eq("order_status", "pending_confirmation")
        .lt("pending_since", fiveMinAgo);
      
      if (staleConvs && staleConvs.length > 0) {
        for (const stale of staleConvs) {
          console.log(`⚠️ FOLLOW-UP: Stale pending order for ${stale.customer_phone} since ${stale.pending_since}`);
          const followUpMsg = "Hola! Vi que estábamos armando tu pedido pero no alcancé a recibir tu confirmación. Quieres que lo confirme? Solo dime 'sí' y lo registro de una vez 😊";
          await sendWA(GLOBAL_WA_PHONE_ID, GLOBAL_WA_TOKEN, stale.customer_phone, followUpMsg);
          
          // Update conversation to avoid re-sending
          const { data: staleConv } = await supabase
            .from("whatsapp_conversations")
            .select("messages")
            .eq("id", stale.id)
            .single();
          const staleMsgs = Array.isArray(staleConv?.messages) ? staleConv.messages : [];
          staleMsgs.push({ role: "assistant", content: followUpMsg, timestamp: new Date().toISOString() });
          await supabase
            .from("whatsapp_conversations")
            .update({ messages: staleMsgs.slice(-30), order_status: "followup_sent", pending_since: null })
            .eq("id", stale.id);
        }
      }
    } catch (e) {
      console.error("Follow-up check error:", e);
    }

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

      // Detect if ALICIA just sent a summary with total (pending confirmation from customer)
      const hasSummary = !parsed && /\$[\d.,]+/.test(resp) && /(total|resumen|confirma)/i.test(resp);
      const newOrderStatus = parsed ? "confirmed" : (hasSummary ? "pending_confirmation" : conv.order_status);

      await supabase
        .from("whatsapp_conversations")
        .update({
          messages: msgs.slice(-30),
          customer_name: parsed?.order?.customer_name || conv.customer_name,
          current_order: parsed ? parsed.order : conv.current_order,
          order_status: newOrderStatus,
          ...(hasSummary ? { pending_since: new Date().toISOString() } : {}),
          ...(parsed ? { pending_since: null } : {}),
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
