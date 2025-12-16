import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrls } = await req.json();
    
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new Error('Se requiere al menos una imagen del menú');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no configurada');
    }

    console.log(`Procesando ${imageUrls.length} imágenes de menú...`);

    // Process all images and combine results
    const allSections: any[] = [];
    
    for (const imageUrl of imageUrls) {
      console.log(`Procesando imagen: ${imageUrl.substring(0, 100)}...`);
      
      const systemPrompt = `Eres un experto en extracción de datos de menús de restaurantes colombianos.
Tu tarea es analizar la imagen del menú y extraer TODOS los productos con precisión.

REGLAS CRÍTICAS:
1. Extrae CADA producto visible en el menú
2. Los precios están en COP (pesos colombianos) - si ves "29" probablemente es "29000"
3. Si un producto tiene múltiples tamaños/presentaciones, créa variantes
4. Infiere la categoría basándote en el contexto (Entradas, Platos Fuertes, Bebidas, Postres, etc.)
5. Si hay descripción del plato, inclúyela
6. Asigna un confidence_score de 0-100 basado en la claridad de lectura

FORMATO DE RESPUESTA (JSON estricto):
{
  "sections": [
    {
      "section_name": "Nombre de la sección/categoría",
      "items": [
        {
          "name": "Nombre del producto",
          "description": "Descripción si existe, null si no",
          "variants": [
            { "size": "Normal", "price": 29000 }
          ],
          "confidence_score": 95
        }
      ]
    }
  ]
}

Si un producto no tiene variantes, usa un solo elemento con size "Normal" o "Unidad".
RESPONDE ÚNICAMENTE CON JSON VÁLIDO, sin markdown ni texto adicional.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { 
              role: 'user', 
              content: [
                { type: 'text', text: 'Analiza este menú de restaurante y extrae todos los productos en formato JSON.' },
                { type: 'image_url', image_url: { url: imageUrl } }
              ]
            }
          ],
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error de AI Gateway:', response.status, errorText);
        
        if (response.status === 429) {
          throw new Error('Límite de uso excedido. Intenta de nuevo en unos minutos.');
        }
        if (response.status === 402) {
          throw new Error('Créditos insuficientes. Contacta soporte.');
        }
        throw new Error(`Error al procesar imagen: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        console.error('Respuesta vacía de IA');
        continue;
      }

      console.log('Respuesta raw:', content.substring(0, 500));

      // Parse JSON from response
      let parsed;
      try {
        // Clean markdown code blocks if present
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.slice(7);
        }
        if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.slice(3);
        }
        if (cleanContent.endsWith('```')) {
          cleanContent = cleanContent.slice(0, -3);
        }
        
        parsed = JSON.parse(cleanContent.trim());
      } catch (parseError) {
        console.error('Error parseando JSON:', parseError);
        console.error('Contenido:', content);
        continue;
      }

      if (parsed.sections && Array.isArray(parsed.sections)) {
        allSections.push(...parsed.sections);
      }
    }

    // Merge sections with same name
    const mergedSections = allSections.reduce((acc: any[], section: any) => {
      const existing = acc.find(s => s.section_name.toLowerCase() === section.section_name.toLowerCase());
      if (existing) {
        existing.items.push(...section.items);
      } else {
        acc.push({ ...section });
      }
      return acc;
    }, []);

    // Count totals
    const totalItems = mergedSections.reduce((sum, s) => sum + (s.items?.length || 0), 0);
    const lowConfidenceItems = mergedSections.reduce((sum, s) => 
      sum + (s.items?.filter((i: any) => i.confidence_score < 70)?.length || 0), 0);

    console.log(`Extracción completada: ${mergedSections.length} categorías, ${totalItems} productos`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        sections: mergedSections,
        metadata: {
          total_sections: mergedSections.length,
          total_items: totalItems,
          low_confidence_items: lowConfidenceItems,
          images_processed: imageUrls.length,
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en menu-onboarding-parse:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
