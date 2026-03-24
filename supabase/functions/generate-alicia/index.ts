import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildSuggestionFlow, SuggestionFragments } from "../_shared/suggestionFlow.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * CORE SYSTEM PROMPT — Conektao immutable rules.
 * Exact copy from whatsapp-webhook to ensure consistency.
 */
function buildCoreSystemPrompt(assistantName: string, escalationPhone: string, suggestConfigs?: any, deliveryAvailable: boolean = true): string {
  const sf = buildSuggestionFlow(suggestConfigs || {}, undefined, deliveryAvailable);
  const globalRulesBlock = sf.globalRules ? `\n${sf.globalRules}\n` : "";
  return `=== CORE CONEKTAO (INMUTABLE) ===

IDENTIDAD:
- Eres ${assistantName}, una IA conversacional de pedidos por WhatsApp
- Eres amable, humana, clara y paciente
- Te enfocas en vender y subir ticket promedio según gustos y presupuesto
- Si preguntan si eres bot → admítelo: "Sí, soy una asistente virtual, pero te atiendo con todo el gusto del mundo 😊"
- NUNCA niegues ser IA. NUNCA digas "soy una persona" ni "soy humana"
- No digas espontáneamente que eres IA

ANTI-ALUCINACIÓN:
- NUNCA inventes productos, precios ni tamaños. Solo usa lo que está en el MENÚ OFICIAL
- NUNCA inventes información sobre el negocio, sedes o disponibilidad
- NUNCA digas que un pedido está listo, ni que el domiciliario llegó o está en camino. Si tipo = recoger → "Te avisamos cuando esté listo para recoger 😊"
- Si no sabes algo → redirige al número del dueño: ${escalationPhone || "el administrador"}
- Porciones: responde SOLO con el dato del menú
- Si un producto existe en múltiples versiones (ej: Personal Y Mediana), pregunta cuál quiere. Si tiene UNA SOLA versión, NO preguntes
- Antes de decir "no tenemos eso", revisa TODO el menú
- NUNCA muestres JSON ni tags al cliente

TRATO AL CLIENTE:
- PROHIBIDO: "mi amor", "mi vida", "cariño", "corazón", "cielo", "linda", "hermosa", "papi", "mami", "reina", "rey". NUNCA apodos cariñosos
- Cuando sepas el nombre → úsalo: "Claro, María" o "Listo, señor Carlos"
- Si NO sabes el nombre → tutea con amabilidad: "Claro, con gusto te ayudo"
- Sé paciente. NUNCA respondas con agresividad ni impaciencia
- Si el cliente dice algo ambiguo → pregunta con amabilidad, no asumas
- Si el cliente se frustra → pasa al humano

FORMATO:
- Primera letra MAYÚSCULA siempre. NO punto final. Siempre cierra los signos de interrogación (¿...?) y exclamación (¡...!). Mensajes CORTOS (1-2 líneas). Máximo 1 emoji cada 2-3 mensajes
- NUNCA asteriscos, negritas, markdown. NUNCA "la comunicación puede fallar"
- PROHIBIDO: "oki", "cositas ricas", "delicias", signos dobles (!!)

AUDIOS: "[Audio transcrito]:" → responde natural. "[Audio no transcrito]" → "No te escuché, me lo escribes?"
STICKERS: Responde simpático y redirige al pedido
CONTEXTO: Lee historial COMPLETO. Si ya dieron info, NO la pidas de nuevo. Max 2 veces la misma pregunta
${globalRulesBlock}
FLUJO DE PEDIDO (un paso por mensaje, NO te saltes pasos):
1. Saluda y pregunta qué quiere${sf.step1}
2. Anota cada producto. Después de cada uno pregunta: "Algo más?"${sf.step2}
${deliveryAvailable
  ? `3. Cuando diga "no", "eso es todo", "nada más" → pregunta: recoger o domicilio${sf.step3}
4. Si domicilio → pide nombre y dirección. Si recoger → pide solo nombre`
  : `3. Cuando diga "no", "eso es todo", "nada más" → indícale que el pedido es para recoger en el local y pídele el nombre. NO menciones domicilio como opción
4. Pide solo el nombre del cliente`}
5. Indica datos de pago
6. Cuando tengas TODOS los datos (productos, cantidades, tipo de entrega, dirección si aplica, nombre, forma de pago), genera el tag ---PEDIDO_CONFIRMADO---{json}---FIN_PEDIDO--- al final del mensaje. El sistema generará el resumen con precios correctos automáticamente. NO escribas un resumen de precios detallado. (Antes de generar el tag, asegúrate de que el restaurante esté ABIERTO)
7. El sistema guarda el pedido y espera confirmación del cliente automáticamente
JSON: {items:[{name,quantity,unit_price,packaging_cost}],packaging_total,subtotal,total,delivery_type,delivery_address,customer_name,payment_method,observations}
- Si NO incluyes el tag, el pedido NO se guardará. Inclúyelo siempre en el paso 6
- Incluye packaging_cost en el JSON según los datos del producto. Dirección DEBE aparecer en el JSON cuando la den

CONFIRMACIÓN (ANTI-LOOP):
- Solo pide confirmación UNA VEZ, después del resumen con TODOS los datos
- PROHIBIDO repetir el resumen o pedir confirmación si ya la pediste (order_status = pending_confirmation)
- Si el cliente dice "cambiar", "modificar", "agregar" → vuelve al flujo de edición
- Después de que confirme → despedida DEFINITIVA. NO hagas más preguntas

MODIFICACIONES (solo pedidos ya confirmados):
- CAMBIO (<25 min) → ---CAMBIO_PEDIDO---{json}---FIN_CAMBIO---
- CAMBIO (>25 min) → "Ya lo preparamos, te lo mandamos como lo pediste"
- ADICIÓN → ---ADICION_PEDIDO---{json items nuevos + nuevo total}---FIN_ADICION---

=== FIN CORE ===`;
}

/**
 * Build the Business Config prompt from whatsapp_configs data + products
 */
function buildBusinessConfigPrompt(config: any, products: any[]): string {
  const personality = config.personality_rules || {};
  const delivery = config.delivery_config || {};
  const payment = config.payment_config || {};
  // packaging_rules removed — packaging context now built dynamically from products
  const hours = config.operating_hours || {};
  const times = { weekday: hours.weekday_waiting_time, weekend: hours.weekend_waiting_time, peak: hours.peak_waiting_time };
  const escalation = config.escalation_config || {};
  const customRules = config.custom_rules || [];
  const suggestConfigs = config.suggest_configs || {};
  const tone = personality.tone || "casual_professional";
  const promoted = config.promoted_products || [];

  // Schedule
  let scheduleBlock = "";
  if (hours.open_time && hours.close_time) {
    scheduleBlock = `HORARIO: ${hours.open_time} - ${hours.close_time}`;
    if (hours.accept_pre_orders) {
      scheduleBlock += `. Pre-pedidos: "${hours.pre_order_message || `Empezamos a preparar a las ${hours.preparation_start || hours.open_time}`}"`;
    }
    if (hours.may_extend) scheduleBlock += ". A veces nos extendemos";
  }

  // Menu — always from products table (single source of truth)
  let menuBlock = "";
  if (products?.length > 0) {
    // Build index for anti-hallucination
    let indexBlock = "=== ÍNDICE DEL MENÚ ===\n";
    const byCategory: Record<string, any[]> = {};
    for (const p of products) {
      const cat = p.category_name || p.categories?.name || "Otros";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(p);
    }
    for (const [cat, items] of Object.entries(byCategory)) {
      const itemNames = items.map((i: any) => i.name).filter(Boolean).join(", ");
      if (itemNames) indexBlock += `- ${cat.toUpperCase()}: ${itemNames}\n`;
    }
    indexBlock += "=== FIN ÍNDICE ===\n\nREGLA: ANTES de decir 'no tenemos eso', revisa el índice completo.\n\n";

    menuBlock = indexBlock + "=== MENÚ OFICIAL (COP) ===\n";
    for (const [cat, items] of Object.entries(byCategory)) {
      menuBlock += `\n${cat.toUpperCase()}:\n`;
      for (const p of items) {
        const portionsInfo = (p.portions || 1) > 1 ? ` | ${p.portions} porciones` : "";
        menuBlock += `- ${p.name}: $${Number(p.price || 0).toLocaleString("es-CO")}${p.description ? ` (${p.description})` : ""}${portionsInfo}\n`;
      }
    }
    menuBlock += "\n=== FIN MENÚ ===\n";
  }

  // Promoted — supports legacy string[] and new categorized format
  let promBlock = "";
  if (promoted.length > 0) {
    const lines: string[] = [];
    for (const item of promoted) {
      if (item.category && Array.isArray(item.products)) {
        for (const p of item.products) {
          lines.push(p.note ? `⭐ ${p.name} — ${p.note}` : `⭐ ${p.name}`);
        }
      }
    }
    if (lines.length > 0) promBlock = `\nPRODUCTOS RECOMENDADOS HOY:\n${lines.join("\n")}`;
  }

  // Delivery
  const radiusInfo = delivery.radius && delivery.radius !== "" ? ` Radio de cobertura: ${delivery.radius}.` : "";
  let deliveryBlock = "";
  if (delivery.enabled) {
    const freeZones = (delivery.free_zones || []).join(", ");
    deliveryBlock = freeZones
      ? `DOMICILIO GRATIS: ${freeZones}.${radiusInfo} ${delivery.paid_delivery_note || "Otras zonas se pagan aparte."}`
      : `DOMICILIO:${radiusInfo} ${delivery.paid_delivery_note || "Se paga al domiciliario."}`;
  } else {
    deliveryBlock = `Solo recogida. ${delivery.pickup_only_details || ""}`;
  }

  // Payment
  const safeMethods = (payment.methods || []).filter((m: string) => !/dat[aá]fono|terminal/i.test(m));
  const methods = (safeMethods.length > 0 ? safeMethods : ["efectivo"]).join(", ");
  let paymentBlock = `PAGO: ${methods}.`;
  if (payment.bank_details) paymentBlock += ` Datos: ${payment.bank_details}.`;
  if (payment.require_proof) paymentBlock += " Pedir foto del comprobante.";
  paymentBlock += "\nDATÁFONO: NO lo ofrezcas proactivamente. Si el cliente lo pide → responde: 'No siempre podemos llevar datáfono, te confirmo disponibilidad'.";

  // Packaging — built dynamically from products table (single source of truth)
  const packagingProducts = products.filter((p: any) => p.requires_packaging && p.packaging_price > 0);
  const packagingBlock = packagingProducts.length > 0
    ? "EMPAQUES (aplica siempre que el producto lo requiera):\n" +
      packagingProducts.map((p: any) => `- ${p.name}: +$${Number(p.packaging_price).toLocaleString("es-CO")}`).join("\n")
    : "";

  // Times
  const timeBlock = times.weekday
    ? `TIEMPOS: Semana ${times.weekday}. Finde ${times.weekend || times.weekday}. Pico ${times.peak || times.weekday}.`
    : "";

  // Escalation
  const escalationBlock = escalation.human_phone
    ? `ESCALAMIENTO: Si insiste en persona → "${escalation.escalation_message || `Comunícate al ${escalation.human_phone}`}".`
    : "";

  // Custom rules
  const rulesBlock = customRules.length > 0 ? "REGLAS DEL NEGOCIO:\n" + customRules.map((r: string) => `- ${r}`).join("\n") : "";

  // Tone
  let toneBlock = "";
  if (tone === "very_casual") toneBlock = "Habla MUY casual, como una amiga. Usa jerga local.";
  else if (tone === "formal") toneBlock = "Habla profesional. Trato de usted.";
  else toneBlock = "Habla cercana y profesional. Natural, cálida pero con respeto.";

  const menuLinkBlock = config.menu_link ? `\nCARTA: ${config.menu_link}` : "";

  // Upselling now injected directly into the core flow steps (buildCoreSystemPrompt)

  return `=== CONFIG DEL NEGOCIO ===

NEGOCIO: "${config.restaurant_name}"
${config.restaurant_description ? `HISTORIA: ${config.restaurant_description}` : ""}
UBICACIÓN: ${config.location_details || config.location_address || "Consulta con el equipo"}

${scheduleBlock}

TONO: ${toneBlock}
- Varía: ${(personality.preferred_vocabulary || ["dale", "listo", "va", "claro", "bueno", "perfecto", "con gusto"]).join(", ")}

SALUDO: "${config.greeting_message || `¡Hola! Bienvenido a ${config.restaurant_name} 😊 ¿En qué te puedo ayudar?`}"
${menuLinkBlock}

${menuBlock}
${promBlock}
${rulesBlock}
${packagingBlock}
${deliveryBlock}
${timeBlock}
${paymentBlock}
${escalationBlock}

=== FIN CONFIG ===`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authenticate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get user's restaurant
    const { data: profile } = await supabase.from("profiles").select("restaurant_id, role").eq("id", user.id).single();
    if (!profile?.restaurant_id || !["owner", "admin"].includes(profile.role || "")) {
      return new Response(JSON.stringify({ error: "Sin permisos" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const restaurantId = profile.restaurant_id;

    // Load config for THIS business only
    const { data: config, error: configError } = await supabase
      .from("whatsapp_configs")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: "No se encontró configuración" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load products for this business
    const { data: products } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true);

    // Build final prompt
    const personality = config.personality_rules || {};
    const escalation = config.escalation_config || {};
    const assistantName = personality.name || "Alicia";

    const deliveryAvailable = config.delivery_config?.enabled !== false;
    const suggestConfigs = config.suggest_configs || {};
    const corePrompt = buildCoreSystemPrompt(assistantName, escalation.human_phone || "", suggestConfigs, deliveryAvailable);
    const businessPrompt = buildBusinessConfigPrompt(config, products || []);
    const finalPrompt = corePrompt + "\n\n" + businessPrompt;

    // Save to THIS business's config only — does NOT affect other Alicias
    const { error: updateError } = await supabase
      .from("whatsapp_configs")
      .update({
        generated_system_prompt: finalPrompt,
        prompt_generated_at: new Date().toISOString(),
        is_active: true,
        setup_completed: true,
      })
      .eq("id", config.id);

    if (updateError) {
      console.error("Error saving prompt:", updateError);
      return new Response(JSON.stringify({ error: "Error al guardar" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const stats = {
      assistant_name: assistantName,
      prompt_length: finalPrompt.length,
      products_count: products?.length || 0,
      categories_count: new Set((products || []).map((p: any) => p.category_name || p.categories?.name).filter(Boolean)).size,
      has_delivery: !!(config.delivery_config?.enabled),
      has_payments: !!(config.payment_config?.methods?.length),
      has_packaging: !!(products?.some((p: any) => p.requires_packaging)),
      has_schedule: !!(config.operating_hours?.open_time),
      has_custom_rules: !!(config.custom_rules?.length),
      generated_at: new Date().toISOString(),
    };

    console.log(`✅ Alicia generated for restaurant ${restaurantId}: ${finalPrompt.length} chars, ${products?.length || 0} products`);

    return new Response(JSON.stringify({
      success: true,
      stats,
      preview: finalPrompt.substring(0, 500) + "...",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Generate Alicia error:", err);
    return new Response(JSON.stringify({ error: "Error interno" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
