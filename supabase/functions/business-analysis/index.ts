import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisData {
  sales: any[];
  expenses: any[];
  products: any[];
  date: string;
  type: 'daily_summary' | 'sales_analysis' | 'expense_report';
}

// Helper function for retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
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
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('Lovable AI key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data }: { data: AnalysisData } = await req.json();

    console.log('Analyzing business data for:', data.date, 'Type:', data.type);

    // Preparar el prompt según el tipo de análisis
    let prompt = '';
    let analysisTitle = '';

    if (data.type === 'daily_summary') {
      analysisTitle = `Resumen del ${data.date}`;
      prompt = `Analiza estos datos del día ${data.date}:
      
Ventas: ${JSON.stringify(data.sales)}
Gastos: ${JSON.stringify(data.expenses)}
Productos: ${JSON.stringify(data.products)}

Proporciona un resumen ejecutivo que incluya:
1. Resumen de ventas y gastos del día
2. Productos más vendidos y menos vendidos
3. Análisis de rentabilidad
4. Recomendaciones específicas para mejorar

Formato: JSON con campos "resumen", "productos_destacados", "rentabilidad", "recomendaciones"`;
    } else if (data.type === 'sales_analysis') {
      analysisTitle = `Análisis de Ventas - ${data.date}`;
      prompt = `Analiza las ventas del ${data.date}:
      
Datos: ${JSON.stringify(data.sales)}

Proporciona un análisis detallado que incluya:
1. Patrones de ventas por horario
2. Productos con mejor rendimiento
3. Oportunidades de mejora
4. Proyecciones y recomendaciones

Formato: JSON con campos "patrones", "top_productos", "oportunidades", "proyecciones"`;
    } else if (data.type === 'expense_report') {
      analysisTitle = `Reporte de Gastos - ${data.date}`;
      prompt = `Analiza los gastos del ${data.date}:
      
Gastos: ${JSON.stringify(data.expenses)}

Proporciona un análisis que incluya:
1. Categorización de gastos
2. Gastos inusuales o elevados
3. Comparación con estándares del sector
4. Recomendaciones de optimización

Formato: JSON con campos "categorias", "alertas", "comparacion", "optimizacion"`;
    }

    // System message para el contexto
    const systemMessage = `Eres un experto analista de negocios especializado en restaurantes. 
Proporciona análisis detallados, precisos y accionables basados en los datos proporcionados.
Enfócate en insights prácticos que el dueño del restaurante pueda implementar inmediatamente.`;

    // Call Lovable AI Gateway with retry
    const aiResponse = await retryWithBackoff(async () => {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: systemMessage
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_completion_tokens: 1500
        }),
      });

      if (response.status === 429) {
        const error: any = new Error('Rate limit exceeded');
        error.status = 429;
        throw error;
      }

      if (response.status === 402) {
        const error: any = new Error('Payment required');
        error.status = 402;
        throw error;
      }

      if (!response.ok) {
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      return response;
    });

    const aiData = await aiResponse.json();
    let analysis;

    try {
      // Intentar parsear como JSON
      const content = aiData.choices[0].message.content;
      analysis = JSON.parse(content);
    } catch (e) {
      // Si no es JSON válido, usar como texto
      analysis = {
        analisis_completo: aiData.choices[0].message.content,
        generado_en: new Date().toISOString()
      };
    }

    console.log('AI analysis completed successfully');

    return new Response(JSON.stringify({
      success: true,
      title: analysisTitle,
      analysis: analysis,
      generated_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in business-analysis function:', error);
    
    // Handle specific error types
    if (error.status === 429) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Sistema ocupado analizando datos. Por favor intenta en unos segundos.',
        code: 'RATE_LIMIT'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (error.status === 402) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Servicio de análisis IA temporalmente no disponible. Por favor contacta soporte.',
        code: 'PAYMENT_REQUIRED'
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
