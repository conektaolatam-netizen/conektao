import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TipConfig {
  tipEnabled: boolean;
  defaultTipPercentage: number;
  tipAutoDistribute: boolean;
  tipDefaultDistType: 'equal' | 'by_hours' | 'manual';
  tipCashierCanDistribute: boolean;
  allowTipEdit: boolean;
  requireReasonIfDecrease: boolean;
  isLoading: boolean;
  lastUpdated: Date | null;
}

interface TipConfigContextType extends TipConfig {
  refreshTipConfig: () => Promise<void>;
  updateTipConfig: (updates: Partial<Omit<TipConfig, 'isLoading' | 'lastUpdated'>>) => Promise<boolean>;
}

const defaultConfig: TipConfig = {
  tipEnabled: false,
  defaultTipPercentage: 10,
  tipAutoDistribute: false,
  tipDefaultDistType: 'equal',
  tipCashierCanDistribute: true,
  allowTipEdit: true,
  requireReasonIfDecrease: true,
  isLoading: true,
  lastUpdated: null,
};

const TipConfigContext = createContext<TipConfigContextType>({
  ...defaultConfig,
  refreshTipConfig: async () => {},
  updateTipConfig: async () => false,
});

export const useTipConfig = () => {
  const context = useContext(TipConfigContext);
  if (!context) {
    throw new Error('useTipConfig must be used within a TipConfigProvider');
  }
  return context;
};

export const TipConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, restaurant } = useAuth();
  const [config, setConfig] = useState<TipConfig>(defaultConfig);

  const loadTipConfig = useCallback(async () => {
    if (!profile?.restaurant_id) {
      setConfig(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          tip_enabled,
          default_tip_percentage,
          tip_auto_distribute,
          tip_default_distribution_type,
          tip_cashier_can_distribute,
          allow_tip_edit,
          require_reason_if_decrease
        `)
        .eq('id', profile.restaurant_id)
        .single();

      if (error) {
        console.error('Error loading tip config:', error);
        setConfig(prev => ({ ...prev, isLoading: false }));
        return;
      }

      if (data) {
        setConfig({
          tipEnabled: data.tip_enabled ?? false,
          defaultTipPercentage: data.default_tip_percentage ?? 10,
          tipAutoDistribute: data.tip_auto_distribute ?? false,
          tipDefaultDistType: (data.tip_default_distribution_type as 'equal' | 'by_hours' | 'manual') ?? 'equal',
          tipCashierCanDistribute: data.tip_cashier_can_distribute ?? true,
          allowTipEdit: data.allow_tip_edit ?? true,
          requireReasonIfDecrease: data.require_reason_if_decrease ?? true,
          isLoading: false,
          lastUpdated: new Date(),
        });
      }
    } catch (error) {
      console.error('Error loading tip config:', error);
      setConfig(prev => ({ ...prev, isLoading: false }));
    }
  }, [profile?.restaurant_id]);

  const updateTipConfig = useCallback(async (
    updates: Partial<Omit<TipConfig, 'isLoading' | 'lastUpdated'>>
  ): Promise<boolean> => {
    if (!profile?.restaurant_id) return false;

    try {
      // Mapear nombres de campos del contexto a nombres de columnas de BD
      const dbUpdates: Record<string, any> = {};
      
      if (updates.tipEnabled !== undefined) dbUpdates.tip_enabled = updates.tipEnabled;
      if (updates.defaultTipPercentage !== undefined) dbUpdates.default_tip_percentage = updates.defaultTipPercentage;
      if (updates.tipAutoDistribute !== undefined) dbUpdates.tip_auto_distribute = updates.tipAutoDistribute;
      if (updates.tipDefaultDistType !== undefined) dbUpdates.tip_default_distribution_type = updates.tipDefaultDistType;
      if (updates.tipCashierCanDistribute !== undefined) dbUpdates.tip_cashier_can_distribute = updates.tipCashierCanDistribute;
      if (updates.allowTipEdit !== undefined) dbUpdates.allow_tip_edit = updates.allowTipEdit;
      if (updates.requireReasonIfDecrease !== undefined) dbUpdates.require_reason_if_decrease = updates.requireReasonIfDecrease;

      const { error } = await supabase
        .from('restaurants')
        .update(dbUpdates)
        .eq('id', profile.restaurant_id);

      if (error) {
        console.error('Error updating tip config:', error);
        return false;
      }

      // Actualizar estado local inmediatamente
      setConfig(prev => ({
        ...prev,
        ...updates,
        lastUpdated: new Date(),
      }));

      return true;
    } catch (error) {
      console.error('Error updating tip config:', error);
      return false;
    }
  }, [profile?.restaurant_id]);

  // Cargar configuración inicial
  useEffect(() => {
    loadTipConfig();
  }, [loadTipConfig]);

  // Suscribirse a cambios en tiempo real de la tabla restaurants
  useEffect(() => {
    if (!profile?.restaurant_id) return;

    const channel = supabase
      .channel('tip_config_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurants',
          filter: `id=eq.${profile.restaurant_id}`,
        },
        (payload) => {
          console.log('Tip config changed via realtime:', payload.new);
          // Recargar configuración cuando cambie
          loadTipConfig();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.restaurant_id, loadTipConfig]);

  const value: TipConfigContextType = {
    ...config,
    refreshTipConfig: loadTipConfig,
    updateTipConfig,
  };

  return (
    <TipConfigContext.Provider value={value}>
      {children}
    </TipConfigContext.Provider>
  );
};

export default TipConfigContext;
