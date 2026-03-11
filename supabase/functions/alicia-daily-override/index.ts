import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Timezone helpers (pure UTC arithmetic — NO getTimezoneOffset) ──

function parseTimezoneOffset(tz: string): number {
  if (!tz) return -5;
  const match = tz.match(/^UTC([+-]?\d+)$/i);
  return match ? parseInt(match[1]) : -5;
}

/** Current time in the restaurant's local timezone (as a Date whose UTC fields = local values) */
function getRestaurantTime(offsetHours: number): Date {
  const nowUTC = Date.now();
  return new Date(nowUTC + offsetHours * 3600000);
}

/** "YYYY-MM-DD" in restaurant's timezone */
function getRestaurantDate(offsetHours: number): string {
  return getRestaurantTime(offsetHours).toISOString().split("T")[0];
}

/** Convert a "local-as-UTC" Date back to real UTC */
function localToUTC(localDate: Date, offsetHours: number): Date {
  return new Date(localDate.getTime() - offsetHours * 3600000);
}

/** End of today (23:59:59.999) in restaurant local time → converted to UTC */
function getRestaurantEndOfDayUTC(offsetHours: number): string {
  const local = getRestaurantTime(offsetHours);
  local.setUTCHours(23, 59, 59, 999);
  return localToUTC(local, offsetHours).toISOString();
}

/** Convert a local "HH:mm" string (today) to a UTC ISO timestamp */
function getLocalHourAsUTC(offsetHours: number, hourStr: string): string {
  const local = getRestaurantTime(offsetHours);
  const [h, m] = hourStr.split(":").map(Number);
  local.setUTCHours(h, m || 0, 0, 0);
  return localToUTC(local, offsetHours).toISOString();
}

import { scoreProduct, resolveProduct } from "../_shared/productResolver.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { restaurant_id, message } = await req.json();
    if (!restaurant_id || !message) {
      return new Response(JSON.stringify({ error: "restaurant_id and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use AI to parse the instruction
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Eres un parser de instrucciones para un restaurante. El dueño te dice un cambio temporal para hoy. Extrae la instrucción en formato JSON.
Responde SOLO con JSON válido, sin markdown ni explicaciones.
Formato:
{
  "type": "schedule_change|menu_change|delivery_change|general",
  "instruction": "texto claro de la instrucción para que la IA del restaurante lo entienda",
  "override_type": "disable|price_override|enable",
  "target_type": "product|restaurant|delivery|pickup",
  "product_name": "nombre del producto si aplica, null si no",
  "value": "unavailable|closed|no_delivery|precio numérico si es cambio de precio",
  "start_hour": "HH:mm en formato 24h si el dueño indica una hora de INICIO, null si empieza ahora",
  "until_hour": "HH:mm en formato 24h si el dueño indica una hora límite, null si no se indica hora específica (aplica todo el día)"
}
Ejemplos:
- "hoy cerramos a las 9" → {"type":"schedule_change","instruction":"Hoy cerramos a las 9:00 PM en vez del horario normal","override_type":"disable","target_type":"restaurant","product_name":null,"value":"closed_early_9pm","start_hour":null,"until_hour":null}
- "no hay domicilio hoy" → {"type":"delivery_change","instruction":"Hoy NO hay servicio de domicilio. Solo recogida en local","override_type":"disable","target_type":"delivery","product_name":null,"value":"no_delivery","start_hour":null,"until_hour":null}
- "se acabó la pepperoni" → {"type":"menu_change","instruction":"Hoy NO hay pizza Pepperoni. Está agotada","override_type":"disable","target_type":"product","product_name":"pepperoni","value":"unavailable","start_hour":null,"until_hour":null}
- "hoy la pizza hawaiana vale 20000" → {"type":"menu_change","instruction":"Hoy la pizza hawaiana cuesta $20,000","override_type":"price_override","target_type":"product","product_name":"pizza hawaiana","value":"20000","start_hour":null,"until_hour":null}
- "cerrado hasta las 5pm" → {"type":"schedule_change","instruction":"Hoy el restaurante está cerrado hasta las 5:00 PM","override_type":"disable","target_type":"restaurant","product_name":null,"value":"closed","start_hour":null,"until_hour":"17:00"}
- "no hay domicilio hasta las 6" → {"type":"delivery_change","instruction":"Hoy NO hay servicio de domicilio hasta las 6:00 PM","override_type":"disable","target_type":"delivery","product_name":null,"value":"no_delivery","start_hour":null,"until_hour":"18:00"}
- "pizza hawaiana a 20000 hasta las 8pm" → {"type":"menu_change","instruction":"Hoy la pizza hawaiana cuesta $20,000 hasta las 8:00 PM","override_type":"price_override","target_type":"product","product_name":"pizza hawaiana","value":"20000","start_hour":null,"until_hour":"20:00"}
- "no hay pepperoni hasta las 3" → {"type":"menu_change","instruction":"Hoy NO hay pizza Pepperoni hasta las 3:00 PM","override_type":"disable","target_type":"product","product_name":"pepperoni","value":"unavailable","start_hour":null,"until_hour":"15:00"}
- "hoy el restaurante abre desde las 9pm" → {"type":"schedule_change","instruction":"Hoy el restaurante está cerrado hasta las 9:00 PM","override_type":"disable","target_type":"restaurant","product_name":null,"value":"closed","start_hour":null,"until_hour":"21:00"}
- "hoy abrimos desde la 1pm" → {"type":"schedule_change","instruction":"Hoy el restaurante está cerrado hasta la 1:00 PM","override_type":"disable","target_type":"restaurant","product_name":null,"value":"closed","start_hour":null,"until_hour":"13:00"}
- "pizza española personal a 37000 desde las 8pm hasta las 9pm" → {"type":"menu_change","instruction":"Hoy la pizza española personal cuesta $37,000 desde las 8:00 PM hasta las 9:00 PM","override_type":"price_override","target_type":"product","product_name":"pizza española personal","value":"37000","start_hour":"20:00","until_hour":"21:00"}
- "cerrado desde las 10pm hasta la 1am" → {"type":"schedule_change","instruction":"Hoy el restaurante cierra desde las 10:00 PM hasta la 1:00 AM","override_type":"disable","target_type":"restaurant","product_name":null,"value":"closed","start_hour":"22:00","until_hour":"01:00"}
- "no hay recogida hoy" → {"type":"delivery_change","instruction":"Hoy NO hay servicio de recogida en el local. Solo domicilios","override_type":"disable","target_type":"pickup","product_name":null,"value":"no_pickup","start_hour":null,"until_hour":null}
- "no hay recogida hasta las 5" → {"type":"delivery_change","instruction":"Hoy NO hay servicio de recogida hasta las 5:00 PM","override_type":"disable","target_type":"pickup","product_name":null,"value":"no_pickup","start_hour":null,"until_hour":"17:00"}
- "solo domicilio hoy" → {"type":"delivery_change","instruction":"Hoy solo manejamos domicilios. NO hay recogida en el local","override_type":"disable","target_type":"pickup","product_name":null,"value":"no_pickup","start_hour":null,"until_hour":null}`,
          },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!aiRes.ok) throw new Error("AI parsing failed");
    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse AI response");
    
    const parsed = JSON.parse(jsonMatch[0]);

    // Fetch timezone from whatsapp_configs
    const { data: tzConfig } = await supabase
      .from("whatsapp_configs")
      .select("operating_hours")
      .eq("restaurant_id", restaurant_id)
      .maybeSingle();
    const tzOffset = parseTimezoneOffset(tzConfig?.operating_hours?.timezone);
    const today = getRestaurantDate(tzOffset);

    // ── Compute start_time and end_time ──
    const startTimeUTC = parsed.start_hour
      ? getLocalHourAsUTC(tzOffset, parsed.start_hour)
      : new Date().toISOString();

    let endTimeUTC = parsed.until_hour
      ? getLocalHourAsUTC(tzOffset, parsed.until_hour)
      : getRestaurantEndOfDayUTC(tzOffset);

    // Edge case: if end <= start, assume next day (e.g., "10pm to 1am")
    if (new Date(endTimeUTC) <= new Date(startTimeUTC)) {
      const adjusted = new Date(endTimeUTC);
      adjusted.setDate(adjusted.getDate() + 1);
      endTimeUTC = adjusted.toISOString();
    }

    // ── Step 1: Insert system_override FIRST to get its ID ──
    let systemOverrideId: string | null = null;
    try {
      const overrideType = parsed.override_type || "disable";
      const targetType = parsed.target_type || "general";
      const overrideValue = parsed.value || "unavailable";

      let targetId: string | null = null;
      let matchedProductName: string | null = parsed.product_name || null;
      let matchedCategoryName: string | null = null;
      let matchedCategoryId: string | null = null;

      if (targetType === "product" && parsed.product_name) {
        const { data: products } = await supabase
          .from("products")
          .select("id, name, description, category_id, category_name:categories(name)")
          .eq("restaurant_id", restaurant_id)
          .eq("is_active", true);

        if (products && products.length > 0) {
          const flat = products.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || "",
            category_id: p.category_id || null,
            category_name: Array.isArray(p.category_name) ? p.category_name[0]?.name || "" : p.category_name?.name || "",
          }));
          const match = resolveProduct(parsed.product_name, flat);
          if (match) {
            targetId = match.id;
            matchedProductName = match.name;
            const matchedFlat = flat.find((f: any) => f.id === match.id);
            matchedCategoryName = matchedFlat?.category_name || null;
            matchedCategoryId = matchedFlat?.category_id || null;
            console.log(`Product resolved: "${parsed.product_name}" → ${match.name} (${match.id})`);
          } else {
            console.log(`Product NOT resolved: "${parsed.product_name}"`);
          }
        }
      }

      const { data: soData, error: soError } = await supabase
        .from("system_overrides")
        .insert({
          restaurant_id,
          type: overrideType,
          target_type: targetType,
          product_id: targetId,
          value: String(overrideValue),
          product_name: matchedProductName,
          category_name: matchedCategoryName,
          category_id: matchedCategoryId,
          start_time: startTimeUTC,
          end_time: endTimeUTC,
        })
        .select("id")
        .single();

      if (soError) {
        console.error("system_overrides insert error:", soError.message);
      } else {
        systemOverrideId = soData?.id || null;
        console.log(`system_override created: ${systemOverrideId} (start: ${startTimeUTC}, end: ${endTimeUTC})`);
      }
    } catch (soErr: any) {
      console.error("system_overrides error:", soErr.message);
    }

    // ── Step 2: Build daily override object WITH system_override_id ──
    const { data: config } = await supabase
      .from("whatsapp_configs")
      .select("daily_overrides")
      .eq("restaurant_id", restaurant_id)
      .maybeSingle();

    const current = Array.isArray(config?.daily_overrides) ? config.daily_overrides : [];
    
    const newOverride: Record<string, any> = {
      id: crypto.randomUUID(),
      type: parsed.type || "general",
      instruction: parsed.instruction || message,
      created_at: new Date().toISOString(),
      expires: today,
    };

    // Embed start_hour and until_hour for webhook/dashboard time-aware filtering
    if (parsed.start_hour) {
      newOverride.start_hour = parsed.start_hour;
    }
    if (parsed.until_hour) {
      newOverride.until_hour = parsed.until_hour;
    }

    // Embed the system_override_id so the frontend can expire it on removal
    if (systemOverrideId) {
      newOverride.system_override_id = systemOverrideId;
    }

    const updated = [...current, newOverride];

    await supabase
      .from("whatsapp_configs")
      .update({ daily_overrides: updated })
      .eq("restaurant_id", restaurant_id);

    return new Response(JSON.stringify({ 
      success: true, 
      override: newOverride,
      system_override_id: systemOverrideId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
