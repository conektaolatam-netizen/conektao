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
      if (error.status === 402 || (error.status !== 429 && error.status)) {
        throw error;
      }
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Authorization required");
    }

    const { message, analysisType, dateRange } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("Lovable AI key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userResult } = await supabase.auth.getUser(jwt);
    const user = userResult?.user ?? null;

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Verify user has audit permissions (owner, admin, or view_audit_ia)
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("restaurant_id, role, permissions")
      .eq("id", user.id)
      .maybeSingle();

    if (!userProfile?.restaurant_id) {
      throw new Error("Restaurant not configured");
    }

    const hasPermission = 
      userProfile.role === 'owner' || 
      userProfile.role === 'admin' || 
      userProfile.permissions?.view_audit_ia;

    if (!hasPermission) {
      throw new Error("No tienes permisos para acceder a auditorIA");
    }

    const restaurantId = userProfile.restaurant_id;

    // Calculate date ranges
    const now = new Date();
    const startDate = dateRange?.start || new Date(now.setDate(now.getDate() - 7)).toISOString();
    const endDate = dateRange?.end || new Date().toISOString();

    console.log(`auditorIA: Analyzing data from ${startDate} to ${endDate}`);

    // Get all team members
    const { data: teamMembers } = await supabase
      .from("profiles")
      .select("id, full_name, role, email")
      .eq("restaurant_id", restaurantId);
    
    const teamUserIds = teamMembers?.map((m) => m.id) || [];

    // 1. Get sales data with voids and discounts
    const { data: salesData } = await supabase
      .from("sales")
      .select(`
        id, 
        total_amount, 
        payment_method, 
        table_number, 
        created_at, 
        user_id,
        status,
        sale_items(
          id,
          quantity,
          unit_price,
          subtotal,
          products(name, price, cost_price)
        )
      `)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .in("user_id", teamUserIds)
      .order("created_at", { ascending: false });

    // 2. Get inventory movements (entries, exits, losses, adjustments)
    const { data: inventoryMovements } = await supabase
      .from("inventory_movements")
      .select(`
        id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        notes,
        created_at,
        products(name, price, cost_price)
      `)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    // 3. Get ingredient movements
    const { data: ingredientMovements } = await supabase
      .from("ingredient_movements")
      .select(`
        id,
        movement_type,
        quantity,
        reference_type,
        reference_id,
        notes,
        waste_detected,
        created_at,
        ingredients(name, cost_per_unit, unit)
      `)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    // 4. Get cash register data
    const { data: cashRegisters } = await supabase
      .from("cash_registers")
      .select(`
        id,
        date,
        opening_balance,
        final_cash,
        cash_difference,
        is_closed,
        user_id,
        closed_by,
        notes
      `)
      .eq("restaurant_id", restaurantId)
      .gte("date", startDate.split('T')[0])
      .lte("date", endDate.split('T')[0])
      .order("date", { ascending: false });

    // 5. Get cash payments (withdrawals)
    const { data: cashPayments } = await supabase
      .from("cash_payments")
      .select(`
        id,
        amount,
        description,
        category,
        payment_method,
        created_at,
        user_id
      `)
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    // 6. Get products with recipes for theoretical inventory calculation
    const { data: productsWithRecipes } = await supabase
      .from("products")
      .select(`
        id,
        name,
        price,
        cost_price,
        product_ingredients(
          quantity_needed,
          ingredients(id, name, current_stock, cost_per_unit, unit)
        )
      `)
      .eq("is_active", true);

    // Process and analyze data for audit purposes
    const auditAnalysis = {
      dateRange: { start: startDate, end: endDate },
      
      // Sales analysis
      salesSummary: {
        totalSales: salesData?.length || 0,
        totalRevenue: salesData?.reduce((sum, s) => sum + parseFloat(s.total_amount), 0) || 0,
        byPaymentMethod: {} as Record<string, { count: number; total: number }>,
        byUser: {} as Record<string, { count: number; total: number; name: string }>,
        voidedOrCancelled: salesData?.filter(s => s.status === 'void' || s.status === 'cancelled') || [],
      },

      // Inventory discrepancies
      inventoryDiscrepancies: [] as any[],
      
      // Cash register analysis  
      cashAnalysis: {
        registers: cashRegisters || [],
        totalDifference: cashRegisters?.reduce((sum, r) => sum + parseFloat(r.cash_difference || 0), 0) || 0,
        registersWithDifference: cashRegisters?.filter(r => Math.abs(parseFloat(r.cash_difference || 0)) > 1000) || [],
      },

      // User behavior analysis
      userAnalysis: {} as Record<string, any>,
      
      // Suspicious patterns
      suspiciousPatterns: [] as any[],
      
      // Waste/loss detection
      wasteAnalysis: {
        totalWaste: ingredientMovements?.filter(m => m.waste_detected).length || 0,
        wasteByIngredient: {} as Record<string, number>,
      },
    };

    // Analyze sales by user
    salesData?.forEach(sale => {
      const userId = sale.user_id;
      const userName = teamMembers?.find(m => m.id === userId)?.full_name || 'Desconocido';
      
      if (!auditAnalysis.salesSummary.byUser[userId]) {
        auditAnalysis.salesSummary.byUser[userId] = { count: 0, total: 0, name: userName };
      }
      auditAnalysis.salesSummary.byUser[userId].count++;
      auditAnalysis.salesSummary.byUser[userId].total += parseFloat(sale.total_amount);

      // Payment method analysis
      const pm = sale.payment_method || 'otro';
      if (!auditAnalysis.salesSummary.byPaymentMethod[pm]) {
        auditAnalysis.salesSummary.byPaymentMethod[pm] = { count: 0, total: 0 };
      }
      auditAnalysis.salesSummary.byPaymentMethod[pm].count++;
      auditAnalysis.salesSummary.byPaymentMethod[pm].total += parseFloat(sale.total_amount);
    });

    // Calculate theoretical vs actual inventory
    const theoreticalUsage: Record<string, number> = {};
    salesData?.forEach(sale => {
      sale.sale_items?.forEach(item => {
        const product = productsWithRecipes?.find(p => p.name === item.products?.name);
        product?.product_ingredients?.forEach(pi => {
          const ingredientName = pi.ingredients?.name;
          if (ingredientName) {
            if (!theoreticalUsage[ingredientName]) theoreticalUsage[ingredientName] = 0;
            theoreticalUsage[ingredientName] += pi.quantity_needed * item.quantity;
          }
        });
      });
    });

    // Compare theoretical vs actual usage
    const actualUsage: Record<string, number> = {};
    ingredientMovements?.filter(m => m.movement_type === 'OUT').forEach(m => {
      const name = m.ingredients?.name;
      if (name) {
        if (!actualUsage[name]) actualUsage[name] = 0;
        actualUsage[name] += m.quantity;
      }
    });

    Object.keys(theoreticalUsage).forEach(ingredient => {
      const theoretical = theoreticalUsage[ingredient];
      const actual = actualUsage[ingredient] || 0;
      const difference = actual - theoretical;
      const differencePercent = theoretical > 0 ? (difference / theoretical) * 100 : 0;
      
      if (Math.abs(differencePercent) > 15) { // 15% threshold
        auditAnalysis.inventoryDiscrepancies.push({
          ingredient,
          theoretical: theoretical.toFixed(2),
          actual: actual.toFixed(2),
          difference: difference.toFixed(2),
          differencePercent: differencePercent.toFixed(1),
          riskLevel: Math.abs(differencePercent) > 30 ? 'high' : 'medium',
        });
      }
    });

    // Analyze user behavior for suspicious patterns
    Object.entries(auditAnalysis.salesSummary.byUser).forEach(([userId, data]) => {
      const userSales = salesData?.filter(s => s.user_id === userId) || [];
      const voidCount = userSales.filter(s => s.status === 'void' || s.status === 'cancelled').length;
      const avgSale = data.total / data.count;
      
      // Calculate standard deviation from team average
      const teamAvgSale = auditAnalysis.salesSummary.totalRevenue / auditAnalysis.salesSummary.totalSales;
      
      auditAnalysis.userAnalysis[userId] = {
        name: data.name,
        totalSales: data.count,
        totalRevenue: data.total,
        avgSale,
        voidCount,
        voidRate: (voidCount / data.count) * 100,
        deviationFromAvg: ((avgSale - teamAvgSale) / teamAvgSale) * 100,
        cashRegisterDifferences: cashRegisters?.filter(r => r.user_id === userId).map(r => parseFloat(r.cash_difference || 0)) || [],
      };

      // Detect suspicious patterns
      if (voidCount > 3 || (voidCount / data.count) > 0.1) {
        auditAnalysis.suspiciousPatterns.push({
          type: 'high_void_rate',
          userId,
          userName: data.name,
          detail: `${voidCount} anulaciones (${((voidCount / data.count) * 100).toFixed(1)}% de ventas)`,
          riskLevel: voidCount > 5 ? 'high' : 'medium',
          recommendation: 'Revisar manualmente las transacciones anuladas',
        });
      }
    });

    // Check for cash register differences
    auditAnalysis.cashAnalysis.registersWithDifference.forEach(register => {
      const userName = teamMembers?.find(m => m.id === register.user_id)?.full_name || 'Desconocido';
      const diff = parseFloat(register.cash_difference || 0);
      auditAnalysis.suspiciousPatterns.push({
        type: 'cash_difference',
        userId: register.user_id,
        userName,
        date: register.date,
        detail: `Diferencia de caja: $${Math.abs(diff).toLocaleString()} (${diff < 0 ? 'faltante' : 'sobrante'})`,
        riskLevel: Math.abs(diff) > 50000 ? 'high' : 'medium',
        recommendation: 'Verificar arqueo de caja y transacciones del turno',
      });
    });

    // Analyze waste patterns
    ingredientMovements?.filter(m => m.waste_detected).forEach(m => {
      const name = m.ingredients?.name || 'Desconocido';
      if (!auditAnalysis.wasteAnalysis.wasteByIngredient[name]) {
        auditAnalysis.wasteAnalysis.wasteByIngredient[name] = 0;
      }
      auditAnalysis.wasteAnalysis.wasteByIngredient[name] += m.quantity;
    });

    // Check for missing data and create warnings
    const dataWarnings = [];
    if (!cashRegisters || cashRegisters.length === 0) {
      dataWarnings.push("No se encontraron registros de caja para el período analizado.");
    }
    if (!ingredientMovements || ingredientMovements.length === 0) {
      dataWarnings.push("No se encontraron movimientos de ingredientes. Activa el registro de mermas para auditoría completa.");
    }

    // Build system prompt for auditorIA
    const systemPrompt = `Eres auditorIA de Conektao, un auditor profesional especializado en detección de pérdidas, robos internos y malas prácticas operativas en restaurantes.

REGLAS CRÍTICAS:
1. NUNCA uses tono optimista ni felicites. Eres un auditor, no un coach motivacional.
2. Responde SIEMPRE con datos específicos: fechas, montos, porcentajes, nombres.
3. Clasifica todo hallazgo como: 🟢 Riesgo bajo | 🟡 Riesgo medio | 🔴 Riesgo alto
4. Si faltan datos, indica EXACTAMENTE qué configurar para auditar mejor.
5. Termina SIEMPRE con 1-3 acciones concretas recomendadas.
6. Usa formato estructurado: listas numeradas, NO tablas ni párrafos largos.
7. Máximo 400 palabras por respuesta.

DATOS DEL ANÁLISIS (${auditAnalysis.dateRange.start.split('T')[0]} al ${auditAnalysis.dateRange.end.split('T')[0]}):

📊 RESUMEN VENTAS:
- Total transacciones: ${auditAnalysis.salesSummary.totalSales}
- Ingresos totales: $${auditAnalysis.salesSummary.totalRevenue.toLocaleString()}
- Anulaciones/cancelaciones: ${auditAnalysis.salesSummary.voidedOrCancelled.length}
- Por método de pago: ${JSON.stringify(auditAnalysis.salesSummary.byPaymentMethod)}

📦 DIFERENCIAS INVENTARIO VS VENTAS:
${auditAnalysis.inventoryDiscrepancies.length > 0 
  ? auditAnalysis.inventoryDiscrepancies.map(d => `• ${d.ingredient}: esperado ${d.theoretical}, real ${d.actual} (${d.differencePercent}% diferencia) [${d.riskLevel}]`).join('\n')
  : '• Sin diferencias significativas detectadas'}

💰 ANÁLISIS DE CAJA:
- Cajas con diferencia: ${auditAnalysis.cashAnalysis.registersWithDifference.length}
- Diferencia total acumulada: $${Math.abs(auditAnalysis.cashAnalysis.totalDifference).toLocaleString()}

👥 ANÁLISIS POR USUARIO:
${Object.values(auditAnalysis.userAnalysis).map((u: any) => 
  `• ${u.name}: ${u.totalSales} ventas, ${u.voidCount} anulaciones (${u.voidRate.toFixed(1)}%), desviación del promedio: ${u.deviationFromAvg.toFixed(1)}%`
).join('\n')}

⚠️ PATRONES SOSPECHOSOS DETECTADOS:
${auditAnalysis.suspiciousPatterns.length > 0
  ? auditAnalysis.suspiciousPatterns.map(p => `• [${p.riskLevel.toUpperCase()}] ${p.type}: ${p.detail} - ${p.recommendation}`).join('\n')
  : '• Ningún patrón sospechoso detectado'}

🗑️ MERMAS REGISTRADAS:
- Total movimientos de merma: ${auditAnalysis.wasteAnalysis.totalWaste}
${Object.entries(auditAnalysis.wasteAnalysis.wasteByIngredient).map(([k, v]) => `• ${k}: ${v}`).join('\n') || '• Sin mermas registradas'}

⚠️ ADVERTENCIAS DE DATOS:
${dataWarnings.length > 0 ? dataWarnings.join('\n') : '• Todos los módulos están configurados correctamente'}

Responde como un auditor profesional que busca proteger el negocio.`;

    // Send to Lovable AI Gateway
    console.log("auditorIA: Sending to AI Gateway...");
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
            { role: "system", content: systemPrompt },
            { role: "user", content: message || "Dame un resumen completo de auditoría del período analizado, identificando los principales riesgos y acciones recomendadas." },
          ],
          max_completion_tokens: 600,
        }),
      });

      if (response.status === 429) {
        const error: any = new Error("Rate limit exceeded");
        error.status = 429;
        throw error;
      }

      if (response.status === 402) {
        const error: any = new Error("Payment required");
        error.status = 402;
        throw error;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI error: ${errorText}`);
      }

      return response;
    });

    const data = await aiResponse.json();
    const aiResponseText = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        response: aiResponseText,
        auditData: auditAnalysis,
        dataWarnings,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("auditorIA error:", error);

    if (error.status === 429) {
      return new Response(
        JSON.stringify({ error: "Sistema ocupado. Intenta en unos segundos.", code: "RATE_LIMIT" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (error.status === 402) {
      return new Response(
        JSON.stringify({ error: "Servicio temporalmente no disponible.", code: "PAYMENT_REQUIRED" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
