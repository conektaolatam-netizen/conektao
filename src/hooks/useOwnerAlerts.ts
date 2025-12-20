import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface OwnerAlert {
  id: string;
  restaurant_id: string;
  owner_id: string;
  triggered_by: string | null;
  triggered_by_name: string | null;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string | null;
  related_table: string | null;
  related_record_id: string | null;
  metadata: Record<string, any> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const useOwnerAlerts = () => {
  const { user, restaurant } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Obtener alertas del dueño
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['owner-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('owner_alerts')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching owner alerts:', error);
        return [];
      }
      
      return data as OwnerAlert[];
    },
    enabled: !!user?.id,
  });

  // Suscripción en tiempo real para nuevas alertas
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('owner-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'owner_alerts',
          filter: `owner_id=eq.${user.id}`,
        },
        (payload) => {
          const newAlert = payload.new as OwnerAlert;
          
          // Mostrar toast de notificación
          toast({
            title: `⚠️ ${newAlert.title}`,
            description: newAlert.description || `Acción realizada por ${newAlert.triggered_by_name || 'un empleado'}`,
            variant: newAlert.severity === 'high' || newAlert.severity === 'critical' ? 'destructive' : 'default',
          });
          
          // Refrescar la lista de alertas
          queryClient.invalidateQueries({ queryKey: ['owner-alerts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast, queryClient]);

  // Marcar alerta como leída
  const markAsRead = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('owner_alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-alerts'] });
    },
  });

  // Marcar todas como leídas
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const { error } = await supabase
        .from('owner_alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('owner_id', user.id)
        .eq('is_read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-alerts'] });
    },
  });

  const unreadCount = alerts?.filter(a => !a.is_read).length || 0;

  return {
    alerts,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};
