import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Timezone helpers ──
function parseTimezoneOffset(tz: string): number {
  if (!tz) return -5;
  const match = tz.match(/^UTC([+-]?\d+)$/i);
  return match ? parseInt(match[1]) : -5;
}
function getRestaurantTime(offsetHours: number): Date {
  const now = new Date();
  return new Date(now.getTime() + (offsetHours * 60 + now.getTimezoneOffset()) * 60000);
}
function getRestaurantDate(offsetHours: number): string {
  return getRestaurantTime(offsetHours).toISOString().split("T")[0];
}
function getRestaurantEndOfDayUTC(offsetHours: number): string {
  const local = getRestaurantTime(offsetHours);
  local.setHours(23, 59, 59, 999);
  const utc = new Date(local.getTime() - (offsetHours * 60 + new Date().getTimezoneOffset()) * 60000);
  return utc.toISOString();
}

function scoreProduct(query: string, product: { name: string; description?: string; category_name?: string }): number {
  const clean = (s: string) => (s || "").toLowerCase().replace(/[^a-záéíóúñü0-9\s]/g, "");
  const qTokens = clean(query).split(/\s+/).filter(Boolean);
  const nameTokens = clean(product.name).split(/\s+/).filter(Boolean);
  const descTokens = clean(product.description || "").split(/\s+/).filter(Boolean);
  const catTokens = clean(product.category_name || "").split(/\s+/).filter(Boolean);
  let score = 0;
  for (const t of qTokens) {
    if (nameTokens.some((n) => n.includes(t) || t.includes(n))) score += 3;
    if (descTokens.some((d) => d.includes(t) || t.includes(d))) score += 5;
    if (catTokens.some((c) => c.includes(t) || t.includes(c))) score += 4;
  }
  if (clean(product.name).includes(clean(query))) score += 2;
  const extra = nameTokens.filter((n) => !qTokens.some((q) => n.includes(q) || q.includes(n))).length;
  score -= extra;
  return score;
}

function resolveProduct(productName: string, products: any[]): { id: string; name: string } | null {
  if (!productName || products.length === 0) return null;
  let best: any = null;
  let bestScore = 0;
  for (const p of products) {
    const s = scoreProduct(productName, p);
    if (s > bestScore || (s === bestScore && best && p.name.length < best.name.length)) {
      bestScore = s;
      best = p;
    }
  }
  return bestScore >= 3 ? { id: best.id, name: best.name } : null;
}

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
  "target_type": "product|restaurant|delivery",
  "product_name": "nombre del producto si aplica, null si no",
  "value": "unavailable|closed|no_delivery|precio numérico si es cambio de precio"
}
Ejemplos:
- "hoy cerramos a las 9" → {"type":"schedule_change","instruction":"Hoy cerramos a las 9:00 PM en vez del horario normal","override_type":"disable","target_type":"restaurant","product_name":null,"value":"closed_early_9pm"}
- "no hay domicilio hoy" → {"type":"delivery_change","instruction":"Hoy NO hay servicio de domicilio. Solo recogida en local","override_type":"disable","target_type":"delivery","product_name":null,"value":"no_delivery"}
- "se acabó la pepperoni" → {"type":"menu_change","instruction":"Hoy NO hay pizza Pepperoni. Está agotada","override_type":"disable","target_type":"product","product_name":"pepperoni","value":"unavailable"}
- "hoy la pizza hawaiana vale 20000" → {"type":"menu_change","instruction":"Hoy la pizza hawaiana cuesta $20,000","override_type":"price_override","target_type":"product","product_name":"pizza hawaiana","value":"20000"}`,
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

    // ── Step 1: Insert system_override FIRST to get its ID ──
    let systemOverrideId: string | null = null;
    try {
      const overrideType = parsed.override_type || "disable";
      const targetType = parsed.target_type || "general";
      const overrideValue = parsed.value || "unavailable";

      let targetId: string | null = null;
      if (targetType === "product" && parsed.product_name) {
        const { data: products } = await supabase
          .from("products")
          .select("id, name, description, category_name:categories(name)")
          .eq("restaurant_id", restaurant_id)
          .eq("is_active", true);

        if (products && products.length > 0) {
          const flat = products.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || "",
            category_name: Array.isArray(p.category_name) ? p.category_name[0]?.name || "" : p.category_name?.name || "",
          }));
          const match = resolveProduct(parsed.product_name, flat);
          if (match) {
            targetId = match.id;
            console.log(`Product resolved: "${parsed.product_name}" → ${match.name} (${match.id})`);
          } else {
            console.log(`Product NOT resolved: "${parsed.product_name}"`);
          }
        }
      }

      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);

      const { data: soData, error: soError } = await supabase
        .from("system_overrides")
        .insert({
          restaurant_id,
          type: overrideType,
          target_type: targetType,
          target_id: targetId,
          value: String(overrideValue),
          start_time: new Date().toISOString(),
          end_time: endOfDay.toISOString(),
        })
        .select("id")
        .single();

      if (soError) {
        console.error("system_overrides insert error:", soError.message);
      } else {
        systemOverrideId = soData?.id || null;
        console.log(`system_override created: ${systemOverrideId}`);
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
