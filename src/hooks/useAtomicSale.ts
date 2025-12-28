import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { Json } from '@/integrations/supabase/types';

interface SaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface ProcessSaleParams {
  totalAmount: number;
  paymentMethod: string;
  items: SaleItem[];
  tableNumber?: number | null;
  tipAmount?: number;
  customerEmail?: string | null;
}

interface SaleResult {
  success: boolean;
  saleId: string | null;
  duplicate: boolean;
  message: string;
}

/**
 * Hook para procesar ventas de forma atómica con protección contra duplicados
 * 
 * Características:
 * - Transacción atómica (todo o nada)
 * - Idempotencia (previene ventas duplicadas por doble clic)
 * - Debounce de 2 segundos entre ventas
 * - Liberación automática de mesa
 */
export const useAtomicSale = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const lastProcessedRef = useRef<number>(0);
  const idempotencyKeyRef = useRef<string | null>(null);
  
  // Generar key única para esta sesión de venta
  const generateIdempotencyKey = useCallback(() => {
    const key = `${user?.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    idempotencyKeyRef.current = key;
    return key;
  }, [user?.id]);
  
  // Limpiar key después de uso exitoso
  const clearIdempotencyKey = useCallback(() => {
    idempotencyKeyRef.current = null;
  }, []);
  
  // Procesar venta de forma atómica
  const processSale = useCallback(async (params: ProcessSaleParams): Promise<SaleResult> => {
    // DEBOUNCE: Prevenir múltiples envíos en menos de 2 segundos
    const now = Date.now();
    if (now - lastProcessedRef.current < 2000) {
      console.warn('[useAtomicSale] Debounce activado - muy rápido');
      return {
        success: false,
        saleId: null,
        duplicate: false,
        message: 'Por favor espera antes de procesar otra venta'
      };
    }
    
    if (isProcessing) {
      console.warn('[useAtomicSale] Ya hay una venta en proceso');
      return {
        success: false,
        saleId: null,
        duplicate: false,
        message: 'Ya hay una venta en proceso'
      };
    }
    
    if (!profile?.restaurant_id || !user?.id) {
      return {
        success: false,
        saleId: null,
        duplicate: false,
        message: 'Usuario no autenticado o sin restaurante'
      };
    }
    
    setIsProcessing(true);
    lastProcessedRef.current = now;
    
    // Generar o reutilizar idempotency key
    const idempotencyKey = idempotencyKeyRef.current || generateIdempotencyKey();
    
    try {
      console.log('[useAtomicSale] Procesando venta atómica...', {
        items: params.items.length,
        total: params.totalAmount,
        key: idempotencyKey
      });
      
      // Llamar a la función RPC atómica
      const { data, error } = await supabase.rpc('process_sale_atomic', {
        p_restaurant_id: profile.restaurant_id,
        p_user_id: user.id,
        p_total_amount: params.totalAmount,
        p_payment_method: params.paymentMethod,
        p_items: params.items as unknown as Json,
        p_table_number: params.tableNumber || null,
        p_tip_amount: params.tipAmount || 0,
        p_customer_email: params.customerEmail || null,
        p_idempotency_key: idempotencyKey
      });
      
      if (error) {
        console.error('[useAtomicSale] Error RPC:', error);
        throw error;
      }
      
      const result = data as unknown as SaleResult;
      
      if (result.success) {
        // Limpiar key solo si fue exitoso (para permitir reintento si falla)
        clearIdempotencyKey();
        
        if (result.duplicate) {
          console.log('[useAtomicSale] Venta duplicada detectada:', result.saleId);
          toast({
            title: "Venta ya procesada",
            description: "Esta venta ya fue registrada anteriormente",
          });
        } else {
          console.log('[useAtomicSale] Venta exitosa:', result.saleId);
        }
      } else {
        console.error('[useAtomicSale] Venta fallida:', result.message);
        toast({
          title: "Error al procesar venta",
          description: result.message,
          variant: "destructive"
        });
      }
      
      return result;
      
    } catch (error: any) {
      console.error('[useAtomicSale] Excepción:', error);
      return {
        success: false,
        saleId: null,
        duplicate: false,
        message: error.message || 'Error inesperado al procesar venta'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [user?.id, profile?.restaurant_id, isProcessing, generateIdempotencyKey, clearIdempotencyKey, toast]);
  
  // Preparar una nueva venta (genera key)
  const prepareSale = useCallback(() => {
    return generateIdempotencyKey();
  }, [generateIdempotencyKey]);
  
  // Cancelar venta preparada (limpia key)
  const cancelSale = useCallback(() => {
    clearIdempotencyKey();
  }, [clearIdempotencyKey]);
  
  return {
    processSale,
    prepareSale,
    cancelSale,
    isProcessing,
    currentIdempotencyKey: idempotencyKeyRef.current
  };
};
