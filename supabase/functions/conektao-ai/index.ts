import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function for retry with exponential backoff
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on 402 (payment required) or non-rate-limit errors
      if (error.status === 402 || (error.status !== 429 && error.status)) {
        throw error;
      }

      // Wait before retrying (exponential backoff: 1s, 2s, 4s)
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Authorization required");
    }

    const { message } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("Lovable AI key not configured");
    }

    // Initialize Supabase client using ANON key and end-user JWT so RLS applies correctly
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get authenticated user's profile and restaurant (robust handling)
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userResult, error: userError } = await supabase.auth.getUser(jwt);
    const user = userResult?.user ?? null;

    // Don't hard-fail if user can't be resolved; continue with limited context
    let restaurantId: string | null = null;
    let teamUserIds: string[] = [];

    if (user) {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", user.id)
        .maybeSingle();

      restaurantId = userProfile?.restaurant_id ?? null;

      if (restaurantId) {
        // Get all team members (users in the same restaurant)
        const { data: teamMembers } = await supabase.from("profiles").select("id").eq("restaurant_id", restaurantId);
        teamUserIds = teamMembers?.map((m: any) => m.id) ?? [user.id];
      } else {
        teamUserIds = [];
      }
    }

    console.log(`Fetching data for restaurant: ${restaurantId}`);

    // Get inventory data with product details - for ALL team members
    const { data: inventory } = await supabase
      .from("products")
      .select(
        `
        name, 
        price,
        cost_price,
        inventory(current_stock, min_stock, unit)
      `,
      )
      .eq("is_active", true)
      .in("user_id", teamUserIds);

    // Get recent sales data with intelligent fallback
    let salesData = null;
    let analysisWindow = "7 días";

    // Try last 7 days first
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSales } = await supabase
      .from("sale_items")
      .select(
        `
        quantity,
        unit_price,
        subtotal,
        sales!inner(created_at, payment_method, table_number, user_id),
        products!inner(name, price, cost_price)
      `,
      )
      .gte("sales.created_at", sevenDaysAgo.toISOString())
      .in("sales.user_id", teamUserIds);

    // If no recent sales, fallback to 30 days
    if (!recentSales || recentSales.length === 0) {
      console.log("No sales in last 7 days, falling back to 30 days");
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: olderSales } = await supabase
        .from("sale_items")
        .select(
          `
          quantity,
          unit_price,
          subtotal,
          sales!inner(created_at, payment_method, table_number, user_id),
          products!inner(name, price, cost_price)
        `,
        )
        .gte("sales.created_at", thirtyDaysAgo.toISOString())
        .in("sales.user_id", teamUserIds);

      salesData = olderSales;
      analysisWindow = "30 días";
    } else {
      salesData = recentSales;
    }

    // Process and analyze sales performance by product
    const productPerformance = {};
    const sales =
      salesData?.map((item) => {
        const productName = item.products.name;
        const revenue = parseFloat(item.subtotal);
        const quantity = item.quantity;
        const unitPrice = parseFloat(item.unit_price);
        const costPrice = parseFloat(item.products.cost_price || 0);
        const margin = costPrice > 0 ? ((unitPrice - costPrice) / unitPrice) * 100 : 0;

        // Track product performance
        if (!productPerformance[productName]) {
          productPerformance[productName] = {
            total_units_sold: 0,
            total_revenue: 0,
            avg_unit_price: unitPrice,
            cost_price: costPrice,
            margin_percentage: margin,
            sales_frequency: 0,
          };
        }

        productPerformance[productName].total_units_sold += quantity;
        productPerformance[productName].total_revenue += revenue;
        productPerformance[productName].sales_frequency += 1;

        return {
          date: new Date(item.sales.created_at).toISOString().split("T")[0],
          product: productName,
          units_sold: quantity,
          unit_price: unitPrice,
          total_revenue: revenue,
          margin_percentage: margin,
          payment_method: item.sales.payment_method,
          table_number: item.sales.table_number,
        };
      }) || [];

    // Identify underperforming products (bottom 30% by sales volume and frequency)
    const productStats = Object.entries(productPerformance)
      .map(([name, stats]) => ({
        product_name: name,
        ...stats,
      }))
      .sort((a, b) => a.total_units_sold - b.total_units_sold);

    const underperformingProducts = productStats.slice(0, Math.ceil(productStats.length * 0.3));

    // Calculate KPIs for comprehensive analysis
    const totalSales = sales?.reduce((sum, sale) => sum + sale.total_revenue, 0) || 0;
    const avgTicket = sales?.length > 0 ? totalSales / sales.length : 0;
    const topProducts = productStats?.slice(0, 5) || [];
    const lowStock =
      inventory?.filter((item) => (item.inventory?.[0]?.current_stock || 0) <= (item.inventory?.[0]?.min_stock || 0)) ||
      [];

    // Format comprehensive data for AI analysis
    const apiData = {
      restaurant_id: restaurantId,
      analysis_period: analysisWindow,
      team_size: teamUserIds.length,
      kpis: {
        total_sales: totalSales,
        avg_ticket: avgTicket,
        total_transactions: sales?.length || 0,
        products_count: inventory?.length || 0,
        low_stock_alerts: lowStock.length,
      },
      inventory: (inventory?.slice(0, 30) || []).map((item) => ({
        product: item.name,
        price: item.price,
        cost: item.cost_price,
        stock: item.inventory?.[0]?.current_stock || 0,
        min_stock: item.inventory?.[0]?.min_stock || 0,
        status: (item.inventory?.[0]?.current_stock || 0) <= (item.inventory?.[0]?.min_stock || 0) ? "critical" : "ok",
        margin:
          item.cost_price && item.price
            ? (((item.price - item.cost_price) / item.price) * 100).toFixed(1) + "%"
            : "N/A",
      })),
      recent_sales: sales?.slice(0, 15) || [],
      top_products: topProducts,
      low_performers: underperformingProducts?.slice(0, 3) || [],
      critical_stock: lowStock.map((item) => item.name),
    };

    console.log("Secure restaurant data fetched");

    // Enhanced system prompt for comprehensive analysis (token-optimized)
    const summaryForAI = `KPIs: total_sales=${totalSales.toFixed(2)}, avg_ticket=${avgTicket.toFixed(2)}, tx=${sales?.length || 0}, products=${inventory?.length || 0}, low_stock_alerts=${lowStock.length}. Top: ${(
      topProducts || []
    )
      .map((p: any) => p.product_name || p.product)
      .slice(0, 3)
      .join(", ")}. Low: ${(underperformingProducts || [])
      .map((p: any) => p.product_name)
      .slice(0, 3)
      .join(", ")}. Critical stock: ${lowStock
      .map((i: any) => i.name)
      .slice(0, 5)
      .join(", ")}`;
    const systemPrompt = `Eres Conektao AI Pro, asesor de alto nivel para restaurantes. 
    Responde con emojis al inicio. Usa un tono claro, directo y profesional, pero cálido. 
    Evita responder de forma genérica, se específico basado en los datos del negocio.
    Mezcla datos internos del negocio (ventas, costos, nómina, inventario, etc.) 
    con análisis y estrategias externas (marketing, tendencias, competencia, fechas clave). 
    Nada de párrafos largos, a menos que sea necesario. Evita tablas, usalas solo de ser necesario. 
    Cada respuesta debe poder inspirar acción rápida y entendible para el dueño.

RESUMEN DE DATOS:
${summaryForAI}

Si faltan datos, da mejores prácticas del sector con foco en ROI.
Período: ${analysisWindow} | Equipo: ${teamUserIds.length} personas`;

    // Check if this is a cost calculation request
    const isCostCalculationRequest =
      message.toLowerCase().includes("calcular el costo") ||
      message.toLowerCase().includes("costo unitario") ||
      message.toLowerCase().includes("costo del producto");

    let enhancedSystemPrompt = systemPrompt;

    if (isCostCalculationRequest) {
      enhancedSystemPrompt += `

**SPECIAL TASK: PRODUCT COST CALCULATION**
When the user asks you to calculate product costs, you MUST:
1. Analyze the ingredients/components mentioned
2. Estimate realistic costs based on Colombian market prices
3. Provide a detailed breakdown of the calculation
4. At the end of your response, include a JSON block with the calculated cost:

IMPORTANT: If you calculate a cost, you MUST end your response with:
[CALCULATED_COST]
{
  "product_name": "exact product name",
  "calculated_cost": numeric_value,
  "breakdown": "brief explanation",
  "confidence": "high|medium|low"
}
[/CALCULATED_COST]

This JSON will be used to automatically update the product in the database.`;
    }

    // Send request to Lovable AI Gateway with retry logic
    console.log("Sending request to Lovable AI Gateway...");
    const aiResponse = await retryWithBackoff(async () => {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: enhancedSystemPrompt },
            { role: "user", content: message },
          ],
        }),
      });

      if (response.status === 429) {
        const error: any = new Error("Rate limit exceeded");
        error.status = 429;
        throw error;
      }

      if (response.status === 402) {
        const error: any = new Error("Payment required - please add credits to your Lovable AI workspace");
        error.status = 402;
        throw error;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lovable AI error:", errorText);
        throw new Error(`Lovable AI error: ${errorText}`);
      }

      return response;
    });

    const data = await aiResponse.json();
    const aiResponseText = data.choices[0].message.content;

    console.log("AI response generated successfully");

    // Check if the response contains a cost calculation
    let productUpdated = false;
    const costCalculationMatch = aiResponseText.match(/\[CALCULATED_COST\](.*?)\[\/CALCULATED_COST\]/s);

    if (costCalculationMatch) {
      try {
        const costData = JSON.parse(costCalculationMatch[1].trim());
        console.log("Cost calculation found:", costData);

        // Update the product in the database
        const { data: updateResult, error: updateError } = await supabase
          .from("products")
          .update({
            cost_price: costData.calculated_cost,
            updated_at: new Date().toISOString(),
          })
          .eq("name", costData.product_name)
          .eq("is_active", true)
          .select();

        if (!updateError && updateResult && updateResult.length > 0) {
          productUpdated = true;
          console.log("✅ Product cost updated automatically:", updateResult[0]);
        } else {
          console.log("No product found to update or update failed:", updateError);
        }
      } catch (parseError) {
        console.error("Error parsing cost calculation:", parseError);
      }
    }

    return new Response(
      JSON.stringify({
        response: aiResponseText,
        dataUsed: apiData,
        productUpdated,
        underperforming_product: underperformingProducts.length > 0 ? underperformingProducts[0].product_name : null,
        marketing_insights: {
          total_products: productStats.length,
          underperforming_count: underperformingProducts.length,
          daily_sales_analysis: sales.filter((s) => s.date === new Date().toISOString().split("T")[0]).length,
          recommended_action:
            underperformingProducts.length > 0 ? "implement_discount_strategy" : "maintain_current_performance",
        },
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error in conektao-ai function:", error);

    // Handle specific error types
    if (error.status === 429) {
      return new Response(
        JSON.stringify({
          error: "Sistema ocupado procesando muchas consultas. Por favor intenta en unos segundos.",
          code: "RATE_LIMIT",
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (error.status === 402) {
      return new Response(
        JSON.stringify({
          error: "Servicio de IA temporalmente no disponible. Por favor contacta soporte.",
          code: "PAYMENT_REQUIRED",
        }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
