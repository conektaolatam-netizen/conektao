import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CashRegisterStatus {
  isOpen: boolean;
  hasOpeningBalance: boolean;
  isClosed: boolean;
  openingBalance: number;
  registerId: string | null;
  isLoading: boolean;
}

export const useCashRegisterStatus = () => {
  const { profile, restaurant } = useAuth();
  const [status, setStatus] = useState<CashRegisterStatus>({
    isOpen: false,
    hasOpeningBalance: false,
    isClosed: false,
    openingBalance: 0,
    registerId: null,
    isLoading: true
  });

  const checkCashRegisterStatus = useCallback(async (): Promise<{ canProcess: boolean; isOpen: boolean; isClosed: boolean }> => {
    if (!restaurant?.id) {
      setStatus(prev => ({ ...prev, isLoading: false }));
      return { canProcess: false, isOpen: false, isClosed: false };
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: register, error } = await supabase
        .from('cash_registers')
        .select('id, opening_balance, is_closed')
        .eq('restaurant_id', restaurant.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;

      if (!register) {
        // No hay registro de caja para hoy - CAJA NO ABIERTA
        const newStatus = {
          isOpen: false,
          hasOpeningBalance: false,
          isClosed: false,
          openingBalance: 0,
          registerId: null,
          isLoading: false
        };
        setStatus(newStatus);
        console.log('[CashStatus] No register found for today - canProcess: false');
        return { canProcess: false, isOpen: false, isClosed: false };
      } else {
        const openingBalance = Number(register.opening_balance) || 0;
        // La caja está abierta si existe el registro y NO está cerrada
        // (no importa si el balance es 0, lo que importa es que el registro existe)
        const isClosed = register.is_closed === true;
        const isOpen = !isClosed; // Si el registro existe y no está cerrado, está abierta
        const hasOpening = openingBalance > 0;
        
        setStatus({
          isOpen,
          hasOpeningBalance: hasOpening,
          isClosed,
          openingBalance,
          registerId: register.id,
          isLoading: false
        });
        
        const canProcess = isOpen && !isClosed;
        console.log('[CashStatus] Register found:', { isOpen, isClosed, canProcess, openingBalance });
        return { canProcess, isOpen, isClosed };
      }
    } catch (error) {
      console.error('Error checking cash register status:', error);
      setStatus(prev => ({ ...prev, isLoading: false }));
      return { canProcess: false, isOpen: false, isClosed: false };
    }
  }, [restaurant?.id]);

  useEffect(() => {
    checkCashRegisterStatus();
  }, [checkCashRegisterStatus]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!restaurant?.id) return;

    const channel = supabase
      .channel('cash_register_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cash_registers',
        filter: `restaurant_id=eq.${restaurant.id}`
      }, () => {
        checkCashRegisterStatus();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant?.id, checkCashRegisterStatus]);

  return {
    ...status,
    refresh: checkCashRegisterStatus,
    canProcessSales: status.isOpen && !status.isClosed
  };
};
