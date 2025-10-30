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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data }: { data: AnalysisData } = await req.json();

    console.log('Analyzing business data for:', data.date, 'Type:', data.type);

    // Preparar el prompt según el tipo de análisis
    let prompt = '';
    let analysisTitle = '';

    if (data.type === 'daily_summary') {
      analysisTitle = `Resumen Diario - ${data.date}`;
      prompt = `Analiza los siguientes datos de ventas del día ${data.date}:

VENTAS:
${JSON.stringify(data.sales, null, 2)}

GASTOS:
${JSON.stringify(data.expenses, null, 2)}

PRODUCTOS:
${JSON.stringify(data.products, null, 2)}

Proporciona un análisis detallado incluyendo:
1. Resumen ejecutivo del día
2. Productos más vendidos y menos vendidos
3. Análisis de rentabilidad (si hay datos de costos)
4. Recomendaciones para mejorar
5. Comparaciones y tendencias
6. Alertas importantes

Formato: JSON con la estructura:
{
  "resumen_ejecutivo": "texto",
  "productos_top": [],
  "productos_bajo_rendimiento": [],
  "rentabilidad": "análisis",
  "recomendaciones": [],
  "alertas": [],
  "metricas_clave": {}
}`;
    }

    // Llamar a OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un analista experto en datos de restaurantes. Proporciona análisis detallados y prácticos en español.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    let analysis;

    try {
      // Intentar parsear como JSON
      const content = aiResponse.choices[0].message.content;
      analysis = JSON.parse(content);
    } catch (e) {
      // Si no es JSON válido, usar como texto
      analysis = {
        analisis_completo: aiResponse.choices[0].message.content,
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