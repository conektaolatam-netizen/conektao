import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

export type SensitiveAction = 
  | 'void_invoice'
  | 'void_item'
  | 'delete_sale'
  | 'edit_sale'
  | 'large_discount'
  | 'cash_discrepancy'
  | 'modify_closed_register'
  | 'delete_product'
  | 'change_price';

interface LogActionParams {
  action: string;
  tableName: string;
  recordId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  isSensitive?: boolean;
}

export const useAuditLog = () => {
  const { user, restaurant } = useAuth();

  const logAction = useCallback(async ({
    action,
    tableName,
    recordId,
    oldValues,
    newValues,
    isSensitive = false,
  }: LogActionParams) => {
    if (!user?.id || !restaurant?.id) {
      console.warn('Cannot log action: no user or restaurant context');
      return null;
    }

    try {
      // Llamar a la función RPC que registra la acción y genera alertas si es necesario
      const { data, error } = await supabase.rpc('log_action_with_alert', {
        p_user_id: user.id,
        p_restaurant_id: restaurant.id,
        p_action: action,
        p_table_name: tableName,
        p_record_id: recordId,
        p_old_values: oldValues || null,
        p_new_values: newValues || null,
        p_is_sensitive: isSensitive,
      });

      if (error) {
        console.error('Error logging action:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in logAction:', error);
      return null;
    }
  }, [user?.id, restaurant?.id]);

  // Acciones predefinidas para facilitar el uso
  const logVoidInvoice = useCallback((invoiceId: string, invoiceData: Record<string, any>) => {
    return logAction({
      action: 'void_invoice',
      tableName: 'invoices',
      recordId: invoiceId,
      oldValues: invoiceData,
      isSensitive: true,
    });
  }, [logAction]);

  const logVoidItem = useCallback((saleItemId: string, itemData: Record<string, any>) => {
    return logAction({
      action: 'void_item',
      tableName: 'sale_items',
      recordId: saleItemId,
      oldValues: itemData,
      isSensitive: true,
    });
  }, [logAction]);

  const logDeleteSale = useCallback((saleId: string, saleData: Record<string, any>) => {
    return logAction({
      action: 'delete_sale',
      tableName: 'sales',
      recordId: saleId,
      oldValues: saleData,
      isSensitive: true,
    });
  }, [logAction]);

  const logEditSale = useCallback((saleId: string, oldData: Record<string, any>, newData: Record<string, any>) => {
    return logAction({
      action: 'edit_sale',
      tableName: 'sales',
      recordId: saleId,
      oldValues: oldData,
      newValues: newData,
      isSensitive: true,
    });
  }, [logAction]);

  const logLargeDiscount = useCallback((saleId: string, discountInfo: Record<string, any>) => {
    return logAction({
      action: 'large_discount',
      tableName: 'sales',
      recordId: saleId,
      newValues: discountInfo,
      isSensitive: true,
    });
  }, [logAction]);

  const logCashDiscrepancy = useCallback((registerId: string, discrepancyInfo: Record<string, any>) => {
    return logAction({
      action: 'cash_discrepancy',
      tableName: 'cash_registers',
      recordId: registerId,
      newValues: discrepancyInfo,
      isSensitive: true,
    });
  }, [logAction]);

  return {
    logAction,
    logVoidInvoice,
    logVoidItem,
    logDeleteSale,
    logEditSale,
    logLargeDiscount,
    logCashDiscrepancy,
  };
};
