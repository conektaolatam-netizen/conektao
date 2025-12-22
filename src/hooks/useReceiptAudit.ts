import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCallback } from 'react';

export type ReceiptAuditEventType = 
  | 'name_changed_from_ai'
  | 'quantity_changed_significant'
  | 'unit_changed_magnitude'
  | 'items_not_mapped_pattern'
  | 'manual_fallback_used'
  | 'low_confidence_accepted'
  | 'payment_method_unusual';

export type AuditSeverity = 'info' | 'warning' | 'critical';

interface LogReceiptAuditParams {
  eventType: ReceiptAuditEventType;
  severity: AuditSeverity;
  expenseId?: string;
  itemOriginalName?: string;
  itemModifiedName?: string;
  originalValue?: Record<string, any>;
  modifiedValue?: Record<string, any>;
  confidenceScore?: number;
  changePercentage?: number;
  receiptUrl?: string;
  notes?: string;
}

// Detect significant changes
export const detectSignificantChanges = (
  originalItems: any[],
  modifiedItems: any[]
): LogReceiptAuditParams[] => {
  const events: LogReceiptAuditParams[] = [];

  modifiedItems.forEach((modified, index) => {
    const original = originalItems[index];
    if (!original) return;

    // Check name change
    if (original.description !== modified.description) {
      const similarity = calculateSimilarity(original.description, modified.description);
      if (similarity < 0.5) {
        events.push({
          eventType: 'name_changed_from_ai',
          severity: 'critical',
          itemOriginalName: original.description,
          itemModifiedName: modified.description,
          originalValue: original,
          modifiedValue: modified,
          notes: `Nombre cambiado significativamente (similaridad: ${Math.round(similarity * 100)}%)`
        });
      }
    }

    // Check quantity change > 20%
    if (original.quantity && modified.quantity) {
      const changePercent = Math.abs(modified.quantity - original.quantity) / original.quantity * 100;
      if (changePercent > 20) {
        events.push({
          eventType: 'quantity_changed_significant',
          severity: changePercent > 50 ? 'critical' : 'warning',
          itemOriginalName: modified.description,
          originalValue: { quantity: original.quantity },
          modifiedValue: { quantity: modified.quantity },
          changePercentage: changePercent,
          notes: `Cantidad cambiada ${changePercent.toFixed(1)}% vs propuesta IA`
        });
      }
    }

    // Check unit change that changes magnitude (kg <-> g, L <-> ml)
    if (original.unit !== modified.unit) {
      const magnitudeChange = detectMagnitudeChange(original.unit, modified.unit);
      if (magnitudeChange) {
        events.push({
          eventType: 'unit_changed_magnitude',
          severity: 'critical',
          itemOriginalName: modified.description,
          originalValue: { unit: original.unit, quantity: original.quantity },
          modifiedValue: { unit: modified.unit, quantity: modified.quantity },
          notes: `Cambio de unidad con magnitud diferente: ${original.unit} -> ${modified.unit}`
        });
      }
    }
  });

  return events;
};

// Simple string similarity (Jaccard-like)
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, '');
  
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  const set1 = new Set(s1.split(''));
  const set2 = new Set(s2.split(''));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

// Detect magnitude-changing unit conversions
const detectMagnitudeChange = (unit1: string, unit2: string): boolean => {
  const magnitudePairs = [
    ['kg', 'g'],
    ['l', 'ml'],
    ['L', 'ml'],
    ['litro', 'ml'],
    ['litros', 'ml'],
    ['kilo', 'gramo'],
    ['kilos', 'gramos']
  ];

  const u1 = unit1.toLowerCase();
  const u2 = unit2.toLowerCase();

  return magnitudePairs.some(([a, b]) => 
    (u1.includes(a) && u2.includes(b)) || 
    (u1.includes(b) && u2.includes(a))
  );
};

export const useReceiptAudit = () => {
  const { user, restaurant } = useAuth();

  const logReceiptAuditEvent = useCallback(async (params: LogReceiptAuditParams) => {
    if (!user?.id || !restaurant?.id) {
      console.warn('Cannot log receipt audit: no user or restaurant context');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('receipt_audit_events')
        .insert({
          restaurant_id: restaurant.id,
          user_id: user.id,
          expense_id: params.expenseId,
          event_type: params.eventType,
          severity: params.severity,
          item_original_name: params.itemOriginalName,
          item_modified_name: params.itemModifiedName,
          original_value: params.originalValue,
          modified_value: params.modifiedValue,
          confidence_score: params.confidenceScore,
          change_percentage: params.changePercentage,
          receipt_url: params.receiptUrl,
          notes: params.notes
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging receipt audit event:', error);
      return null;
    }
  }, [user?.id, restaurant?.id]);

  const logBulkEvents = useCallback(async (events: LogReceiptAuditParams[]) => {
    if (!user?.id || !restaurant?.id || events.length === 0) return [];

    const records = events.map(e => ({
      restaurant_id: restaurant.id,
      user_id: user.id,
      expense_id: e.expenseId,
      event_type: e.eventType,
      severity: e.severity,
      item_original_name: e.itemOriginalName,
      item_modified_name: e.itemModifiedName,
      original_value: e.originalValue,
      modified_value: e.modifiedValue,
      confidence_score: e.confidenceScore,
      change_percentage: e.changePercentage,
      receipt_url: e.receiptUrl,
      notes: e.notes
    }));

    try {
      const { data, error } = await supabase
        .from('receipt_audit_events')
        .insert(records)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging bulk receipt audit events:', error);
      return [];
    }
  }, [user?.id, restaurant?.id]);

  const logManualFallback = useCallback(async (reason: string, receiptUrl?: string) => {
    return logReceiptAuditEvent({
      eventType: 'manual_fallback_used',
      severity: 'info',
      receiptUrl,
      notes: reason
    });
  }, [logReceiptAuditEvent]);

  const logLowConfidenceAccepted = useCallback(async (confidence: number, receiptUrl?: string) => {
    return logReceiptAuditEvent({
      eventType: 'low_confidence_accepted',
      severity: confidence < 50 ? 'critical' : 'warning',
      confidenceScore: confidence,
      receiptUrl,
      notes: `Usuario aceptó factura con confianza baja: ${confidence}%`
    });
  }, [logReceiptAuditEvent]);

  return {
    logReceiptAuditEvent,
    logBulkEvents,
    logManualFallback,
    logLowConfidenceAccepted,
    detectSignificantChanges
  };
};
