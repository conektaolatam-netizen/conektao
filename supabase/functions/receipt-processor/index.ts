import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// === VALIDACIÓN REAL DE CONFIANZA (ANTIFRAUDE) ===
const CONFIDENCE_WEIGHTS = {
  supplier: 0.25,
  total: 0.25,
  items: 0.30,
  totalMatch: 0.10,
  date: 0.10
};

interface ConfidenceBreakdown {
  supplier: number;
  total: number;
  items: number;
  totalMatch: number;
  date: number;
  weighted: number;
}

interface ValidationResult {
  status: 'valid' | 'needs_review' | 'blocked' | 'error';
  realConfidence: number;
  issues: string[];
  canProceed: boolean;
  blockingReason?: string;
  breakdown: ConfidenceBreakdown;
}

interface OCRBlock {
  text: string;
  position: 'top' | 'middle' | 'bottom';
  alignment: 'left' | 'center' | 'right';
  type: 'header' | 'table_row' | 'footer' | 'other';
  line_index: number;
}

interface OCRResult {
  blocks: OCRBlock[];
  raw_text: string;
  document_type: 'invoice' | 'receipt' | 'unknown';
  orientation: number;
  is_handwritten: boolean;
  quality_score: number;
}

function calculateRealConfidence(extractedData: any): ConfidenceBreakdown {
  const breakdown: ConfidenceBreakdown = {
    supplier: 0,
    total: 0,
    items: 0,
    totalMatch: 0,
    date: 0,
    weighted: 0
  };

  // Validate supplier (25%)
  const supplierName = extractedData?.supplier_name?.trim();
  if (supplierName && supplierName.length > 2 && supplierName.toLowerCase() !== 'no identificado') {
    breakdown.supplier = 100;
  } else if (supplierName && supplierName.length > 0) {
    breakdown.supplier = 30;
  }

  // Validate total (25%)
  const total = extractedData?.total;
  if (typeof total === 'number' && total > 0) {
    breakdown.total = 100;
  }

  // Validate items (30%)
  const items = extractedData?.items;
  if (Array.isArray(items) && items.length > 0) {
    const validItems = items.filter((item: any) => 
      item.description?.trim() && 
      typeof item.quantity === 'number' && 
      item.quantity > 0
    );
    
    if (validItems.length === items.length) {
      breakdown.items = 100;
    } else if (validItems.length > 0) {
      breakdown.items = (validItems.length / items.length) * 70;
    }
  }

  // Validate sum matches total (10%)
  if (Array.isArray(items) && items.length > 0 && typeof total === 'number' && total > 0) {
    const itemsSum = items.reduce((sum: number, item: any) => 
      sum + (item.subtotal || (item.quantity * item.unit_price) || 0), 0
    );
    
    const difference = Math.abs(itemsSum - total);
    const tolerancePercent = (difference / total) * 100;
    
    if (tolerancePercent <= 1) {
      breakdown.totalMatch = 100;
    } else if (tolerancePercent <= 5) {
      breakdown.totalMatch = 70;
    } else if (tolerancePercent <= 15) {
      breakdown.totalMatch = 30;
    }
  }

  // Validate date (10%)
  const date = extractedData?.date;
  if (date && isValidDate(date)) {
    breakdown.date = 100;
  } else if (date) {
    breakdown.date = 50;
  }

  // Calculate weighted score
  breakdown.weighted = Math.round(
    (breakdown.supplier * CONFIDENCE_WEIGHTS.supplier) +
    (breakdown.total * CONFIDENCE_WEIGHTS.total) +
    (breakdown.items * CONFIDENCE_WEIGHTS.items) +
    (breakdown.totalMatch * CONFIDENCE_WEIGHTS.totalMatch) +
    (breakdown.date * CONFIDENCE_WEIGHTS.date)
  );

  return breakdown;
}

function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneMonthAhead = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  
  return date >= oneYearAgo && date <= oneMonthAhead;
}

function validateReceipt(extractedData: any): ValidationResult {
  const issues: string[] = [];
  
  const supplierName = extractedData?.supplier_name?.trim();
  const hasValidSupplier = Boolean(
    supplierName && 
    supplierName.length > 2 && 
    supplierName.toLowerCase() !== 'no identificado'
  );
  
  const total = extractedData?.total;
  const hasValidTotal = typeof total === 'number' && total > 0;
  
  const items = extractedData?.items;
  const hasValidItems = Array.isArray(items) && items.length > 0 && 
    items.some((item: any) => item.description?.trim() && item.quantity > 0);

  const breakdown = calculateRealConfidence(extractedData);

  if (!hasValidSupplier) issues.push('Proveedor no identificado');
  if (!hasValidTotal) issues.push('Total no detectado o inválido');
  if (!hasValidItems) issues.push('No se detectaron productos/items');

  const isCriticalDataMissing = !hasValidSupplier || !hasValidTotal || !hasValidItems;

  if (isCriticalDataMissing) {
    return {
      status: 'blocked',
      realConfidence: breakdown.weighted,
      issues,
      canProceed: false,
      blockingReason: issues.join('. '),
      breakdown
    };
  } else if (breakdown.weighted < 60 || issues.length > 0) {
    return {
      status: 'needs_review',
      realConfidence: breakdown.weighted,
      issues,
      canProceed: true,
      breakdown
    };
  }

  return {
    status: 'valid',
    realConfidence: breakdown.weighted,
    issues: [],
    canProceed: true,
    breakdown
  };
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
      
      if (error.status === 402 || (error.status !== 429 && error.status)) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}

// Generate SHA-256 hash for fraud detection
async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== TWO-PHASE AI PROCESSING ====================

/**
 * PHASE 1: Extract raw text with layout/position data
 * Focus ONLY on reading text accurately - no interpretation
 */
async function phase1_OCRWithLayout(
  imageBase64: string, 
  lovableApiKey: string
): Promise<OCRResult> {
  console.log("📖 [Phase 1] Starting OCR with layout extraction...");
  
  const ocrPrompt = `Eres un OCR experto. Tu ÚNICO trabajo es LEER todo el texto visible en esta imagen con información de posición.

INSTRUCCIONES CRÍTICAS:
1. EXTRAE TODO el texto visible, exactamente como aparece
2. NO interpretes ni normalices el texto - copia exactamente lo que ves
3. Para cada bloque de texto, indica:
   - La posición vertical (top/middle/bottom)
   - La alineación (left/center/right)
   - El tipo probable (header/table_row/footer/other)
   - El número de línea aproximado

FORMATO JSON OBLIGATORIO:
{
  "blocks": [
    {
      "text": "texto exacto como aparece",
      "position": "top|middle|bottom",
      "alignment": "left|center|right",
      "type": "header|table_row|footer|other",
      "line_index": numero
    }
  ],
  "raw_text": "todo el texto concatenado con saltos de línea",
  "document_type": "invoice|receipt|unknown",
  "orientation": 0,
  "is_handwritten": boolean,
  "quality_score": numero 0-100 (calidad de legibilidad)
}

REGLAS:
- Si un texto está borroso pero legible, inclúyelo con quality_score bajo
- Los headers suelen estar en top con info de empresa/fecha
- Las filas de tabla están en middle con productos/cantidades/precios
- Los footers tienen totales/subtotales/impuestos
- NO inventes texto que no puedas leer`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: ocrPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "LEE todo el texto de esta imagen con información de posición. NO interpretes, solo lee." },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ],
      max_completion_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const error: any = new Error(`OCR Phase failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Phase 1: No JSON in OCR response");
  }
  
  const ocrResult = JSON.parse(jsonMatch[0]) as OCRResult;
  console.log(`✅ [Phase 1] OCR complete: ${ocrResult.blocks?.length || 0} blocks, quality: ${ocrResult.quality_score}`);
  
  return ocrResult;
}

/**
 * PHASE 2: Extract structured invoice fields using OCR results + layout context
 * Uses layout hints to understand document structure
 */
async function phase2_ExtractFields(
  ocrResult: OCRResult,
  ingredientContext: string,
  mappingContext: string,
  lovableApiKey: string
): Promise<any> {
  console.log("🔍 [Phase 2] Starting field extraction with layout context...");
  
  // Group blocks by position for layout hints
  const headerBlocks = ocrResult.blocks?.filter(b => b.position === 'top' || b.type === 'header') || [];
  const tableBlocks = ocrResult.blocks?.filter(b => b.position === 'middle' || b.type === 'table_row') || [];
  const footerBlocks = ocrResult.blocks?.filter(b => b.position === 'bottom' || b.type === 'footer') || [];
  
  const layoutContext = `
=== DATOS OCR ESTRUCTURADOS POR POSICIÓN ===

ENCABEZADO (top - contiene proveedor, NIT, fecha):
${headerBlocks.map(b => `[${b.alignment}] ${b.text}`).join('\n') || 'No se detectó encabezado'}

CUERPO/TABLA (middle - contiene productos, cantidades, precios):
${tableBlocks.map(b => `[línea ${b.line_index}] ${b.text}`).join('\n') || 'No se detectaron productos'}

PIE/TOTALES (bottom - contiene subtotal, IVA, total):
${footerBlocks.map(b => `[${b.alignment}] ${b.text}`).join('\n') || 'No se detectaron totales'}

=== TEXTO COMPLETO ===
${ocrResult.raw_text}
`;

  const extractionPrompt = `Eres un experto extractor de datos de facturas colombianas.

INGREDIENTES EXISTENTES DEL USUARIO: ${ingredientContext}
ASOCIACIONES APRENDIDAS: ${mappingContext}

${layoutContext}

=== INSTRUCCIONES DE EXTRACCIÓN ===

Usando los datos OCR estructurados arriba, extrae los campos de la factura.

PISTAS DE LAYOUT:
- ENCABEZADO: Busca nombre de empresa/proveedor, NIT, número de factura, fecha
- CUERPO: Cada línea es un producto. Busca patrones: [cantidad] [descripción] [precio unitario] [subtotal]
- PIE: Busca "Subtotal", "IVA", "Total", "Total a pagar" y sus valores numéricos

MATCHING INTELIGENTE DE INGREDIENTES:
- Compara cada producto con los ingredientes existentes del usuario
- Ignora mayúsculas, tildes, abreviaturas, tamaños/presentaciones
- "Coca Cola", "Coke", "coca cla 500ml" → son el mismo ingrediente
- "Queso mozzarella", "Mozza", "Mozzarella 1kg" → son el mismo ingrediente
- Solo marca needs_mapping=true si NO hay ningún ingrediente similar

FORMATO JSON OBLIGATORIO:
{
  "success": true,
  "confidence": numero (0-100),
  "supplier_name": "nombre exacto del proveedor o null",
  "supplier_nit": "NIT si visible o null",
  "invoice_number": "número factura o null",
  "date": "YYYY-MM-DD o null",
  "currency": "COP",
  "subtotal": numero o null,
  "tax": numero o 0,
  "total": numero o 0,
  "items": [
    {
      "description": "nombre normalizado del ingrediente",
      "quantity": numero,
      "unit": "kg/g/ml/L/unidades",
      "unit_price": numero,
      "subtotal": numero,
      "matched_ingredient": "nombre EXACTO del ingrediente existente si hay match",
      "confidence_score": numero (0-100),
      "needs_mapping": boolean,
      "product_name_on_receipt": "texto exacto de la factura",
      "match_reason": "explicación breve del match"
    }
  ],
  "is_handwritten": ${ocrResult.is_handwritten},
  "quality_issues": ["lista de problemas"]
}

REGLA CRÍTICA: Si no puedes leer un campo claramente, déjalo null o vacío. NO inventes datos.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: extractionPrompt },
        { role: "user", content: "Extrae los datos estructurados de la factura usando la información OCR proporcionada." }
      ],
      max_completion_tokens: 1200,
    }),
  });

  if (!response.ok) {
    const error: any = new Error(`Extraction Phase failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "";
  
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Phase 2: No JSON in extraction response");
  }
  
  const extractedData = JSON.parse(jsonMatch[0]);
  console.log(`✅ [Phase 2] Extraction complete: ${extractedData.items?.length || 0} items, supplier: ${extractedData.supplier_name}`);
  
  return extractedData;
}

// ==================== MAIN SERVER ====================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "Lovable AI key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      imageBase64, 
      userId, 
      conversationId, 
      userMessage, 
      receiptUrl, 
      sourceType,
      captureHashes 
    } = await req.json();

    // Handle conversation messages (existing logic)
    if (userMessage && conversationId) {
      console.log("Processing conversation message:", userMessage);

      if (
        userMessage.toLowerCase().includes("sí") ||
        userMessage.toLowerCase().includes("confirmo") ||
        userMessage.toLowerCase().includes("acepto")
      ) {
        return new Response(
          JSON.stringify({
            type: "inventory_confirmed",
            message: "✅ ¡Perfecto! Actualizando inventario de ingredientes automáticamente...",
            action: "update_inventory",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          type: "chat_response",
          message: "He recibido tu mensaje. ¿Podrías darme más detalles?",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Process receipt image
    if (!imageBase64 || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("🚀 [Receipt Processor] Starting TWO-PHASE processing for user:", userId, "Source:", sourceType);

    // Generate hash for fraud detection
    const imageHash = await generateHash(imageBase64);
    console.log("Image hash:", imageHash.substring(0, 16));

    // Check for duplicate/manipulated images if multi-capture
    if (captureHashes && captureHashes.length > 0) {
      const uniqueHashes = new Set(captureHashes);
      if (uniqueHashes.size !== captureHashes.length) {
        console.warn("FRAUD ALERT: Duplicate images detected in multi-capture");
        await supabase.from('audit_logs').insert({
          user_id: userId,
          table_name: 'receipts',
          action: 'FRAUD_DUPLICATE_IMAGES',
          new_values: { captureHashes, uniqueHashes: Array.from(uniqueHashes) },
          is_sensitive: true
        });
      }
    }

    // Get user's existing ingredients for context
    const { data: ingredients } = await supabase
      .from("ingredients")
      .select("id, name, cost_per_unit, unit")
      .eq("user_id", userId)
      .eq("is_active", true);

    const { data: mappings } = await supabase
      .from("ingredient_product_mappings")
      .select("product_name, ingredient_id, ingredients(name)")
      .eq("user_id", userId);

    const ingredientContext = ingredients?.map((i) => `${i.name} (${i.unit})`).join(", ") || "No ingredients found";
    const mappingContext = mappings?.map((m: any) => `"${m.product_name}" -> ${m.ingredients?.name}`).join(", ") || "No mappings yet";

    // ==================== TWO-PHASE PROCESSING ====================
    
    let extractedData: any;
    let ocrResult: OCRResult | null = null;
    
    try {
      // PHASE 1: OCR with layout data
      ocrResult = await retryWithBackoff(() => 
        phase1_OCRWithLayout(imageBase64, lovableApiKey)
      );
      
      // PHASE 2: Field extraction with layout context
      extractedData = await retryWithBackoff(() => 
        phase2_ExtractFields(ocrResult!, ingredientContext, mappingContext, lovableApiKey)
      );
      
      console.log("✅ [Receipt Processor] Two-phase processing complete");
      
    } catch (phaseError: any) {
      console.error("❌ [Receipt Processor] Phase processing failed:", phaseError);
      
      if (phaseError.status === 429 || phaseError.status === 402) {
        throw phaseError;
      }
      
      // Return BLOCKED status - cannot proceed without valid data
      return new Response(
        JSON.stringify({
          type: "blocked",
          status: "blocked",
          data: { items: [], total: 0, supplier_name: null },
          validation: {
            status: "blocked",
            realConfidence: 0,
            issues: ["No se pudo procesar la imagen con IA."],
            canProceed: false,
            blockingReason: "Error al procesar la imagen"
          },
          message: "⚠️ No pudimos leer esta factura. Usa el modo manual.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // === VALIDACIÓN REAL OBLIGATORIA ===
    const validation = validateReceipt(extractedData);
    
    // Log AI reported confidence vs real confidence for audit
    console.log(`Confidence - AI reported: ${extractedData.confidence}, Real calculated: ${validation.realConfidence}`);
    
    // Store audit trail with OCR data
    await supabase.from('audit_logs').insert({
      user_id: userId,
      table_name: 'receipts',
      action: 'AI_EXTRACTION_TWO_PHASE',
      new_values: {
        ai_confidence: extractedData.confidence,
        real_confidence: validation.realConfidence,
        validation_status: validation.status,
        issues: validation.issues,
        items_count: extractedData.items?.length || 0,
        total: extractedData.total,
        supplier: extractedData.supplier_name,
        source_type: sourceType,
        image_hash: imageHash.substring(0, 32),
        ocr_blocks_count: ocrResult?.blocks?.length || 0,
        ocr_quality: ocrResult?.quality_score || 0,
        is_handwritten: ocrResult?.is_handwritten || false
      }
    });

    // === RESPUESTA BASADA EN VALIDACIÓN REAL ===
    if (!validation.canProceed) {
      // BLOCKED: Critical data missing
      return new Response(
        JSON.stringify({
          type: "blocked",
          status: "blocked",
          data: extractedData,
          validation: validation,
          confidence: validation.realConfidence,
          message: `⚠️ No pudimos leer esta factura correctamente. ${validation.blockingReason}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (validation.status === 'needs_review') {
      // NEEDS REVIEW: Partial data, human review required
      return new Response(
        JSON.stringify({
          type: "needs_review",
          status: "needs_review",
          data: extractedData,
          validation: validation,
          confidence: validation.realConfidence,
          has_low_confidence_items: extractedData.items?.some((i: any) => i.confidence_score < 80),
          message: `⚠️ Revisión requerida (${validation.realConfidence}% confianza). Verifica los datos antes de confirmar.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // VALID: Good data, still requires user confirmation
    return new Response(
      JSON.stringify({
        type: "pending_confirmation",
        status: "pending_confirmation",
        data: extractedData,
        validation: validation,
        confidence: validation.realConfidence,
        message: `✅ Factura procesada (${validation.realConfidence}% confianza). Confirma los datos para continuar.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error: any) {
    console.error("Error in receipt-processor:", error);
    
    if (error.status === 429) {
      return new Response(JSON.stringify({ 
        error: 'Sistema ocupado. Por favor intenta en unos segundos.',
        code: 'RATE_LIMIT',
        type: 'error'
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (error.status === 402) {
      return new Response(JSON.stringify({ 
        error: 'Servicio de IA no disponible. Contacta soporte.',
        code: 'PAYMENT_REQUIRED',
        type: 'error'
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: "Error interno del servidor", 
      details: error.message,
      type: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
