/**
 * VALIDACIÓN REAL DE FACTURAS - ANTIFRAUDE
 * 
 * Regla absoluta: Si datos críticos están vacíos, confianza = 0
 * NUNCA mostrar "Factura procesada correctamente" si:
 * - proveedor = null/vacío
 * - total <= 0
 * - items.length = 0
 */

export type ReceiptValidationStatus = 
  | 'valid'           // Datos completos, puede proceder
  | 'needs_review'    // Datos parciales, requiere revisión humana
  | 'blocked'         // Datos críticos faltantes, NO puede proceder
  | 'error';          // Error de sistema

export interface ValidationResult {
  status: ReceiptValidationStatus;
  realConfidence: number;
  hasValidSupplier: boolean;
  hasValidTotal: boolean;
  hasValidItems: boolean;
  hasMatchingTotal: boolean;
  hasValidDate: boolean;
  issues: string[];
  canProceed: boolean;
  blockingReason?: string;
}

export interface ConfidenceBreakdown {
  supplier: number;      // 25%
  total: number;         // 25%
  items: number;         // 30%
  totalMatch: number;    // 10%
  date: number;          // 10%
  weighted: number;      // Final score
}

const CONFIDENCE_WEIGHTS = {
  supplier: 0.25,
  total: 0.25,
  items: 0.30,
  totalMatch: 0.10,
  date: 0.10
};

/**
 * Calcula confianza REAL basada en campos críticos
 * Si faltan datos críticos, la confianza es 0
 */
export function calculateRealConfidence(extractedData: any): ConfidenceBreakdown {
  const breakdown: ConfidenceBreakdown = {
    supplier: 0,
    total: 0,
    items: 0,
    totalMatch: 0,
    date: 0,
    weighted: 0
  };

  // Validar proveedor (25%)
  const supplierName = extractedData?.supplier_name?.trim();
  if (supplierName && supplierName.length > 2 && supplierName.toLowerCase() !== 'no identificado') {
    breakdown.supplier = 100;
  } else if (supplierName && supplierName.length > 0) {
    breakdown.supplier = 30; // Nombre muy corto o genérico
  }

  // Validar total (25%)
  const total = extractedData?.total;
  if (typeof total === 'number' && total > 0) {
    breakdown.total = 100;
  }

  // Validar items (30%)
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

  // Validar que suma de items ≈ total (10%)
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

  // Validar fecha (10%)
  const date = extractedData?.date;
  if (date && isValidDate(date)) {
    breakdown.date = 100;
  } else if (date) {
    breakdown.date = 50; // Fecha presente pero no válida
  }

  // Calcular score ponderado
  breakdown.weighted = Math.round(
    (breakdown.supplier * CONFIDENCE_WEIGHTS.supplier) +
    (breakdown.total * CONFIDENCE_WEIGHTS.total) +
    (breakdown.items * CONFIDENCE_WEIGHTS.items) +
    (breakdown.totalMatch * CONFIDENCE_WEIGHTS.totalMatch) +
    (breakdown.date * CONFIDENCE_WEIGHTS.date)
  );

  return breakdown;
}

/**
 * Validación BLOCKING - No permite avanzar si datos críticos faltan
 */
export function validateReceipt(extractedData: any): ValidationResult {
  const issues: string[] = [];
  
  // Verificar campos críticos
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

  // Verificar si suma de items coincide con total
  let hasMatchingTotal = false;
  if (hasValidItems && hasValidTotal) {
    const itemsSum = items.reduce((sum: number, item: any) => 
      sum + (item.subtotal || (item.quantity * item.unit_price) || 0), 0
    );
    const tolerance = total * 0.15; // 15% tolerancia
    hasMatchingTotal = Math.abs(itemsSum - total) <= tolerance;
  }

  // Fecha válida
  const date = extractedData?.date;
  const hasValidDate = Boolean(date && isValidDate(date));

  // Calcular confianza REAL
  const breakdown = calculateRealConfidence(extractedData);
  const realConfidence = breakdown.weighted;

  // Determinar issues
  if (!hasValidSupplier) {
    issues.push('Proveedor no identificado');
  }
  if (!hasValidTotal) {
    issues.push('Total no detectado o inválido');
  }
  if (!hasValidItems) {
    issues.push('No se detectaron productos/items');
  }
  if (hasValidItems && hasValidTotal && !hasMatchingTotal) {
    issues.push('Suma de items no coincide con total');
  }
  if (!hasValidDate) {
    issues.push('Fecha no identificada');
  }

  // REGLA BLOCKING: Si falta cualquier campo crítico -> BLOCKED
  const isCriticalDataMissing = !hasValidSupplier || !hasValidTotal || !hasValidItems;
  
  let status: ReceiptValidationStatus;
  let canProceed: boolean;
  let blockingReason: string | undefined;

  if (isCriticalDataMissing) {
    status = 'blocked';
    canProceed = false;
    blockingReason = issues.join('. ');
  } else if (realConfidence < 60 || issues.length > 0) {
    status = 'needs_review';
    canProceed = true; // Puede proceder pero requiere revisión manual
  } else {
    status = 'valid';
    canProceed = true;
  }

  return {
    status,
    realConfidence,
    hasValidSupplier,
    hasValidTotal,
    hasValidItems,
    hasMatchingTotal,
    hasValidDate,
    issues,
    canProceed,
    blockingReason
  };
}

function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  
  // Fecha no puede ser más de 1 año atrás ni en el futuro lejano
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneMonthAhead = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  
  return date >= oneYearAgo && date <= oneMonthAhead;
}

/**
 * Genera hash SHA-256 de un string (para antifraude)
 */
export async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Estado de máquina de facturas
 */
export type ReceiptState = 
  | 'uploaded'              // Imagen subida, pendiente procesamiento
  | 'extracted'             // Datos extraídos por IA
  | 'blocked'               // Datos críticos faltantes, no puede avanzar
  | 'needs_review'          // Requiere revisión humana
  | 'pending_confirmation'  // Esperando confirmación del usuario
  | 'approved'              // Usuario confirmó los datos
  | 'applied_inventory'     // Inventario actualizado
  | 'payment_pending'       // Esperando registro de pago
  | 'paid'                  // Pago registrado
  | 'archived';             // Archivado (cierre de día)

export interface ReceiptStateTransition {
  from: ReceiptState;
  to: ReceiptState;
  allowedConditions: string[];
}

export const ALLOWED_TRANSITIONS: ReceiptStateTransition[] = [
  { from: 'uploaded', to: 'extracted', allowedConditions: ['ai_processed'] },
  { from: 'uploaded', to: 'blocked', allowedConditions: ['critical_data_missing'] },
  { from: 'extracted', to: 'blocked', allowedConditions: ['validation_failed'] },
  { from: 'extracted', to: 'needs_review', allowedConditions: ['low_confidence', 'unmapped_items'] },
  { from: 'extracted', to: 'pending_confirmation', allowedConditions: ['validation_passed'] },
  { from: 'needs_review', to: 'pending_confirmation', allowedConditions: ['user_reviewed'] },
  { from: 'needs_review', to: 'blocked', allowedConditions: ['user_rejected'] },
  { from: 'pending_confirmation', to: 'approved', allowedConditions: ['user_confirmed'] },
  { from: 'pending_confirmation', to: 'needs_review', allowedConditions: ['user_edit_requested'] },
  { from: 'approved', to: 'applied_inventory', allowedConditions: ['inventory_updated'] },
  { from: 'applied_inventory', to: 'payment_pending', allowedConditions: ['inventory_success'] },
  { from: 'payment_pending', to: 'paid', allowedConditions: ['payment_registered'] },
  { from: 'paid', to: 'archived', allowedConditions: ['day_closed'] },
];

export function canTransition(from: ReceiptState, to: ReceiptState): boolean {
  return ALLOWED_TRANSITIONS.some(t => t.from === from && t.to === to);
}
