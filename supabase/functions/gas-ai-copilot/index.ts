import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Conocimiento base de ENVAGAS S.A.E.S.P
const ENVAGAS_KNOWLEDGE = `
Eres el asistente de IA de ENVAGAS S.A.E.S.P, una empresa distribuidora de Gas Licuado de Petróleo (GLP).

🏭 PLANTAS DE ALMACENAMIENTO ACTIVAS:

1. Planta Madre Puerto Salgar
   - Capacidad: 242,400 galones
   - Stock actual: 200,300 galones (82.6% llena)
   - Ubicación: Puerto Salgar, Cundinamarca
   - Es la planta principal y más grande

2. Planta Operativa Puerto Salgar  
   - Capacidad: 23,700 galones
   - Stock actual: 20,000 galones (84.4% llena)
   - Ubicación: Puerto Salgar, Cundinamarca

3. Planta Satélite Ibagué
   - Capacidad: 18,400 galones
   - Stock actual: 14,800 galones (80.4% llena)
   - Ubicación: Ibagué, Tolima

Inventario consolidado: 235,100 galones disponibles de 284,500 galones de capacidad total (82.6%).

🚛 FLOTA VEHICULAR:
- Total: 12 vehículos activos
- Distribución por sede:
  • Ibagué: 5 vehículos
  • Puerto Salgar Madre: 4 vehículos  
  • Puerto Salgar Operativa: 3 vehículos

👷 CONDUCTORES Y MERMAS (Datos del 03/01/2026):

Ibagué:
- Juan Camilo Torres: 2,300 gal entregados, Merma 0%, Facturado $8,740,000
- Andrés Gutiérrez: 1,950 gal entregados, Merma 2%, 39 gal perdidos, Facturado $7,410,000
- Camila Rodríguez: 2,400 gal entregados, Merma 0%, Facturado $9,120,000

Puerto Salgar Madre:
- Manuel Perdomo: 2,800 gal entregados, Merma 4%, 112 gal perdidos, Facturado $10,640,000 ⚠️
- Freddy Castañeda: 2,600 gal entregados, Merma 0%, Facturado $9,880,000
- Jhon Jairo Rivas: 2,500 gal entregados, Merma 1.5%, 37.5 gal perdidos, Facturado $9,500,000
- Jairo Londoño: 2,700 gal entregados, Merma 0%, Facturado $10,260,000
- Óscar Herrera: 1,940 gal entregados, Merma 0%, Facturado $7,372,000

Puerto Salgar Operativa:
- Carlos Moreno: 2,350 gal entregados, Merma 3%, 70.5 gal perdidos, Facturado $8,930,000
- David Bermúdez: 2,000 gal entregados, Merma 0%, Facturado $7,600,000
- Sebastián Muñoz: 2,200 gal entregados, Merma 0.5%, 11 gal perdidos, Facturado $8,360,000
- William Galvis: 2,100 gal entregados, Merma 6%, 126 gal perdidos, Facturado $7,980,000 🚨

ALERTAS DE MERMA:
- William Galvis tiene la merma más alta (6%) - requiere revisión inmediata
- Manuel Perdomo con 4% de merma - segundo más alto
- Carlos Moreno con 3% de merma - monitorear

📦 RESUMEN DIARIO (03/01/2026):
- Entregas del día: 27,840 galones
- Valor facturado total: $105,792,000 COP
- Precio GLP: $3,800 COP/galón
- Merma promedio: 1.42%
- Galones perdidos hoy: 396 galones (~$1,504,800 COP en pérdidas)

VENTAS POR SEDE:
- Ibagué: $25,270,000 (3 conductores, 6,650 gal)
- P. Salgar Madre: $47,652,000 (5 conductores, 12,540 gal)
- P. Salgar Operativa: $32,870,000 (4 conductores, 8,650 gal)

📊 INDICADORES CLAVE:
- 7 conductores con 0% merma (excelente)
- 5 conductores con merma > 0%
- 2 conductores con merma > 3% (crítico)

INSTRUCCIONES DE RESPUESTA:
- Responde siempre en español colombiano, de forma amigable y directa
- Usa lenguaje sencillo, como si hablaras con el gerente
- Sé conciso: máximo 3-4 líneas para resúmenes, más si te piden detalles
- Si preguntan por datos que no tienes, di que solo tienes datos hasta el 03/01/2026
- Destaca siempre lo más importante primero (ventas, alertas, anomalías)
- Usa emojis con moderación para hacer la respuesta más visual
- Si hay algo preocupante, menciónalo claramente
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { tenantId, queryType, userMessage } = await req.json();

    console.log(`[gas-ai-copilot] Processing: type=${queryType}, message=${userMessage?.substring(0, 50)}...`);

    // Build the user prompt based on query type
    let userPrompt = '';
    
    if (queryType === 'chat' && userMessage) {
      // Direct chat - use user's message
      userPrompt = userMessage;
    } else {
      // Legacy quick actions
      switch (queryType) {
        case 'daily_summary':
          userPrompt = '¿Cómo estuvo el día de hoy? Dame un resumen ejecutivo.';
          break;
        case 'route_analysis':
          userPrompt = 'Analiza las rutas y entregas del día. ¿Qué destaca?';
          break;
        case 'anomaly_detection':
          userPrompt = '¿Hay alguna anomalía o alerta que deba revisar hoy?';
          break;
        case 'recommendations':
          userPrompt = 'Dame recomendaciones para mejorar la operación.';
          break;
        default:
          userPrompt = '¿Cómo está la operación hoy?';
      }
    }

    // Call Lovable AI Gateway
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
            content: ENVAGAS_KNOWLEDGE
          },
          { 
            role: 'user', 
            content: userPrompt 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[gas-ai-copilot] AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Límite de solicitudes excedido. Intenta en unos segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Créditos de IA agotados. Contacta al administrador.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('Error en servicio de IA');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'No pude procesar tu solicitud. ¿Puedes reformular la pregunta?';

    console.log(`[gas-ai-copilot] Response generated successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gas-ai-copilot] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
