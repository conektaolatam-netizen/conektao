import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface KitchenOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  special_instructions?: string;
}

export const useKitchenOrders = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const sendToKitchen = async (
    items: KitchenOrderItem[],
    tableNumber?: number,
    notes?: string,
    priority: 'normal' | 'high' | 'urgent' = 'normal',
    estimatedTime: number = 30
  ) => {
    if (!user || !profile?.restaurant_id) {
      throw new Error('Usuario no autenticado');
    }

    if (items.length === 0) {
      throw new Error('No hay productos para enviar');
    }

    setIsLoading(true);
    
    try {
      // Crear la comanda principal
      const { data: kitchenOrder, error: orderError } = await supabase
        .from('kitchen_orders')
        .insert({
          restaurant_id: profile.restaurant_id,
          user_id: user.id,
          table_number: tableNumber || null,
          status: 'pending',
          total_items: items.reduce((sum, item) => sum + item.quantity, 0),
          priority,
          estimated_time: estimatedTime,
          notes
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Crear los items de la comanda
      const orderItems = items.map(item => ({
        kitchen_order_id: kitchenOrder.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        special_instructions: item.special_instructions || null,
        status: 'pending'
      }));

      const { error: itemsError } = await supabase
        .from('kitchen_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Marcar que se ha enviado la comanda en table_states (limpiar recordatorio)
      if (tableNumber) {
        await supabase
          .from('table_states')
          .update({ 
            pending_command_reminder: false,
            updated_at: new Date().toISOString()
          })
          .eq('restaurant_id', profile.restaurant_id)
          .eq('table_number', tableNumber);
      }

      toast({
        title: "¡Comanda enviada!",
        description: `Comanda #${kitchenOrder.order_number} enviada a cocina exitosamente`,
        className: "bg-green-50 border-green-200"
      });

      return kitchenOrder;

    } catch (error) {
      console.error('Error sending to kitchen:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la comanda a cocina",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkPendingCommand = async (tableNumber: number) => {
    if (!profile?.restaurant_id) return false;

    try {
      const { data, error } = await supabase
        .from('table_states')
        .select('pending_command_reminder, current_order')
        .eq('restaurant_id', profile.restaurant_id)
        .eq('table_number', tableNumber)
        .single();

      if (error) throw error;

      // Si hay productos en el carrito pero no se ha enviado comanda
      const hasItemsInCart = Array.isArray(data.current_order) && data.current_order.length > 0;
      
      return hasItemsInCart && !data.pending_command_reminder;
    } catch (error) {
      console.error('Error checking pending command:', error);
      return false;
    }
  };

  const setPendingCommandReminder = async (tableNumber: number, hasPending: boolean) => {
    if (!profile?.restaurant_id) return;

    try {
      await supabase
        .from('table_states')
        .update({ 
          pending_command_reminder: hasPending,
          updated_at: new Date().toISOString()
        })
        .eq('restaurant_id', profile.restaurant_id)
        .eq('table_number', tableNumber);
    } catch (error) {
      console.error('Error setting pending command reminder:', error);
    }
  };

  return {
    sendToKitchen,
    checkPendingCommand,
    setPendingCommandReminder,
    isLoading
  };
};