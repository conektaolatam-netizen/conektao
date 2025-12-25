/**
 * Receipt State Manager
 * Manages receipt lifecycle and deferred inventory impact
 * Only affects inventory/cash when receipt is APPROVED + PAID
 */

// Import types and functions from receiptValidation
import type { ReceiptState as ReceiptStateType } from './receiptValidation';
import { canTransition as canTransitionFn, ALLOWED_TRANSITIONS } from './receiptValidation';

// Re-export with proper names
export type ReceiptState = ReceiptStateType;
export const canTransition = canTransitionFn;
export { ALLOWED_TRANSITIONS };

// Constants for state values
export const RECEIPT_STATES = {
  UPLOADED: 'uploaded' as const,
  EXTRACTED: 'extracted' as const,
  BLOCKED: 'blocked' as const,
  NEEDS_REVIEW: 'needs_review' as const,
  PENDING_CONFIRMATION: 'pending_confirmation' as const,
  APPROVED: 'approved' as const,
  APPLIED_INVENTORY: 'applied_inventory' as const,
  PAYMENT_PENDING: 'payment_pending' as const,
  PAID: 'paid' as const,
  ARCHIVED: 'archived' as const,
};

export type ReceiptStateValue = typeof RECEIPT_STATES[keyof typeof RECEIPT_STATES];

export interface ReceiptData {
  id: string;
  state: ReceiptStateValue;
  supplier_name: string;
  total_amount: number;
  items: ReceiptItem[];
  document_date: string;
  invoice_number?: string;
  receipt_url?: string;
  
  // Extraction tracking
  original_extraction: any;
  user_corrected?: any;
  has_manual_edits: boolean;
  
  // Validation
  confidence: number;
  validation_status: 'valid' | 'needs_review' | 'blocked';
  
  // Audit
  capture_hashes?: string[];
  capture_source: 'camera' | 'upload' | 'multi_capture';
  
  // Timestamps
  created_at: string;
  extracted_at?: string;
  confirmed_at?: string;
  approved_at?: string;
  paid_at?: string;
  inventory_applied_at?: string;
  archived_at?: string;
  
  // User tracking
  user_id: string;
  restaurant_id: string;
}

export interface ReceiptItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  matched_ingredient_id?: string;
  inventory_type?: string;
}

export interface StateTransitionResult {
  success: boolean;
  newState?: ReceiptStateValue;
  error?: string;
  canApplyInventory?: boolean;
}

/**
 * Attempt to transition a receipt to a new state
 */
export function transitionState(
  currentState: ReceiptStateValue,
  targetState: ReceiptStateValue,
  validationPassed: boolean = true
): StateTransitionResult {
  // Check if transition is allowed
  if (!canTransition(currentState, targetState)) {
    return {
      success: false,
      error: `Transición no permitida: ${currentState} → ${targetState}`
    };
  }

  // Special validation for critical transitions
  if (targetState === RECEIPT_STATES.APPROVED && !validationPassed) {
    return {
      success: false,
      error: 'No se puede aprobar: validación de datos críticos fallida'
    };
  }

  return {
    success: true,
    newState: targetState,
    canApplyInventory: targetState === RECEIPT_STATES.PAID
  };
}

/**
 * Check if a receipt can affect inventory and cash
 * ONLY when state is PAID
 */
export function canAffectInventory(state: ReceiptStateValue): boolean {
  return state === RECEIPT_STATES.PAID;
}

/**
 * Check if a receipt can be confirmed by user
 */
export function canConfirm(receipt: Partial<ReceiptData>): { 
  allowed: boolean; 
  reason?: string;
} {
  // Validate critical data
  if (!receipt.supplier_name || receipt.supplier_name.length < 2) {
    return { allowed: false, reason: 'Proveedor no identificado' };
  }
  
  if (!receipt.total_amount || receipt.total_amount <= 0) {
    return { allowed: false, reason: 'Total inválido' };
  }
  
  if (!receipt.items || receipt.items.length === 0) {
    return { allowed: false, reason: 'Sin items detectados' };
  }
  
  // Validate items have positive quantities
  const invalidItems = receipt.items.filter(i => i.quantity <= 0 || i.subtotal <= 0);
  if (invalidItems.length > 0) {
    return { allowed: false, reason: `${invalidItems.length} items con datos inválidos` };
  }
  
  return { allowed: true };
}

/**
 * Track manual edits by comparing original extraction with user corrections
 */
export function trackManualEdits(
  originalExtraction: any,
  userCorrected: any
): { hasEdits: boolean; editedFields: string[] } {
  const editedFields: string[] = [];
  
  // Compare supplier
  if (originalExtraction.supplier_name !== userCorrected.supplier_name) {
    editedFields.push('supplier_name');
  }
  
  // Compare total
  if (originalExtraction.total !== userCorrected.total) {
    editedFields.push('total');
  }
  
  // Compare items count
  const origItems = originalExtraction.items || [];
  const corrItems = userCorrected.items || [];
  
  if (origItems.length !== corrItems.length) {
    editedFields.push('items_count');
  } else {
    // Check for individual item changes
    for (let i = 0; i < origItems.length; i++) {
      const orig = origItems[i];
      const corr = corrItems[i];
      
      if (
        orig.description !== corr.description ||
        orig.quantity !== corr.quantity ||
        orig.unit_price !== corr.unit_price
      ) {
        editedFields.push(`item_${i}`);
      }
    }
  }
  
  return {
    hasEdits: editedFields.length > 0,
    editedFields
  };
}

/**
 * Prepare receipt data for inventory application
 * Only call this when state is PAID
 */
export function prepareForInventoryApplication(receipt: ReceiptData): {
  canApply: boolean;
  reason?: string;
  data?: any;
} {
  if (receipt.state !== RECEIPT_STATES.PAID) {
    return {
      canApply: false,
      reason: `Estado actual: ${receipt.state}. Solo se puede aplicar en estado PAID.`
    };
  }
  
  if (receipt.inventory_applied_at) {
    return {
      canApply: false,
      reason: 'El inventario ya fue aplicado para esta factura.'
    };
  }
  
  return {
    canApply: true,
    data: {
      supplier_name: receipt.supplier_name,
      invoice_number: receipt.invoice_number,
      date: receipt.document_date,
      total: receipt.total_amount,
      items: receipt.items,
      receipt_url: receipt.receipt_url,
      has_manual_edits: receipt.has_manual_edits,
      user_id: receipt.user_id,
      restaurant_id: receipt.restaurant_id
    }
  };
}

/**
 * Get display status for UI
 */
export function getDisplayStatus(state: ReceiptStateValue): {
  label: string;
  color: 'destructive' | 'warning' | 'default' | 'secondary' | 'success';
  icon: string;
} {
  const statuses: Record<ReceiptStateValue, { label: string; color: any; icon: string }> = {
    [RECEIPT_STATES.UPLOADED]: { label: 'Subido', color: 'secondary', icon: '📤' },
    [RECEIPT_STATES.EXTRACTED]: { label: 'Procesando', color: 'secondary', icon: '🔄' },
    [RECEIPT_STATES.BLOCKED]: { label: 'Bloqueado', color: 'destructive', icon: '🚫' },
    [RECEIPT_STATES.NEEDS_REVIEW]: { label: 'Revisión requerida', color: 'warning', icon: '⚠️' },
    [RECEIPT_STATES.PENDING_CONFIRMATION]: { label: 'Pendiente confirmación', color: 'default', icon: '👀' },
    [RECEIPT_STATES.APPROVED]: { label: 'Aprobado', color: 'success', icon: '✅' },
    [RECEIPT_STATES.APPLIED_INVENTORY]: { label: 'Inventario aplicado', color: 'success', icon: '📦' },
    [RECEIPT_STATES.PAYMENT_PENDING]: { label: 'Pago pendiente', color: 'warning', icon: '💰' },
    [RECEIPT_STATES.PAID]: { label: 'Pagado', color: 'success', icon: '🎉' },
    [RECEIPT_STATES.ARCHIVED]: { label: 'Archivado', color: 'secondary', icon: '📁' },
  };
  
  return statuses[state] || { label: state, color: 'secondary', icon: '📄' };
}
