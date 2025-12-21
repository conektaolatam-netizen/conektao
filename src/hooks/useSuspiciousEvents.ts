import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type SuspiciousEventType = 
  | 'EXIT_ORDER_WITHOUT_SENDING_KITCHEN_ORDER'
  | 'PAYMENT_ATTEMPT_WITHOUT_KITCHEN_ORDER'
  | 'KITCHEN_ORDER_CANCELLED';

interface LogSuspiciousEventParams {
  eventType: SuspiciousEventType;
  orderId?: string;
  saleId?: string;
  tableNumber?: number;
  hasItems: boolean;
  itemsCount?: number;
  orderTotal?: number;
  metadata?: Record<string, any>;
}

export const useSuspiciousEvents = () => {
  const { user, profile } = useAuth();

  const logSuspiciousEvent = async (params: LogSuspiciousEventParams) => {
    if (!user || !profile?.restaurant_id) {
      console.error('No user or restaurant context for logging suspicious event');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('pos_suspicious_events')
        .insert({
          restaurant_id: profile.restaurant_id,
          event_type: params.eventType,
          order_id: params.orderId || null,
          sale_id: params.saleId || null,
          user_id: user.id,
          user_role: profile.role || 'unknown',
          table_number: params.tableNumber || null,
          has_items: params.hasItems,
          items_count: params.itemsCount || 0,
          order_total: params.orderTotal || 0,
          metadata: params.metadata || {},
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error logging suspicious event:', error);
        return null;
      }

      console.log('Suspicious event logged:', params.eventType);
      return data;
    } catch (error) {
      console.error('Error logging suspicious event:', error);
      return null;
    }
  };

  const getEventStats = async (startDate?: Date, endDate?: Date) => {
    if (!profile?.restaurant_id) return null;

    try {
      let query = supabase
        .from('pos_suspicious_events')
        .select('*')
        .eq('restaurant_id', profile.restaurant_id);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching suspicious events:', error);
      return null;
    }
  };

  return {
    logSuspiciousEvent,
    getEventStats
  };
};
