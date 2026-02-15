import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
Formato: {"type": "schedule_change|menu_change|delivery_change|general", "instruction": "texto claro de la instrucción para que la IA del restaurante lo entienda"}
Ejemplos:
- "hoy cerramos a las 9" → {"type":"schedule_change","instruction":"Hoy cerramos a las 9:00 PM en vez del horario normal"}
- "no hay domicilio hoy" → {"type":"delivery_change","instruction":"Hoy NO hay servicio de domicilio. Solo recogida en local"}
- "se acabó la pepperoni" → {"type":"menu_change","instruction":"Hoy NO hay pizza Pepperoni. Está agotada"}`,
          },
          { role: "user", content: message },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!aiRes.ok) throw new Error("AI parsing failed");
    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response (handle markdown wrapping)
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse AI response");
    
    const parsed = JSON.parse(jsonMatch[0]);
    const today = new Date().toISOString().split("T")[0];

    // Get current overrides
    const { data: config } = await supabase
      .from("whatsapp_configs")
      .select("daily_overrides")
      .eq("restaurant_id", restaurant_id)
      .maybeSingle();

    const current = Array.isArray(config?.daily_overrides) ? config.daily_overrides : [];
    
    // Add new override
    const newOverride = {
      id: crypto.randomUUID(),
      type: parsed.type || "general",
      instruction: parsed.instruction || message,
      created_at: new Date().toISOString(),
      expires: today,
    };

    const updated = [...current, newOverride];

    await supabase
      .from("whatsapp_configs")
      .update({ daily_overrides: updated })
      .eq("restaurant_id", restaurant_id);

    return new Response(JSON.stringify({ success: true, override: newOverride }), {
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
