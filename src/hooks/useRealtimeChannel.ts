import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeChannelOptions {
  channelName: string;
  table: string;
  schema?: string;
  event?: PostgresChangeEvent;
  filter?: string;
  onEvent: (payload: any) => void;
  enabled?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

/**
 * Hook para suscripciones Realtime con reconexión automática
 * 
 * Características:
 * - Reconexión automática con backoff exponencial
 * - Cleanup automático al desmontar
 * - Manejo de errores robusto
 * - Soporte para filtros por restaurant_id
 */
export const useRealtimeChannel = ({
  channelName,
  table,
  schema = 'public',
  event = '*',
  filter,
  onEvent,
  enabled = true,
  reconnectDelay = 3000,
  maxReconnectAttempts = 10
}: UseRealtimeChannelOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isConnectedRef = useRef<boolean>(false);
  
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    isConnectedRef.current = false;
  }, []);
  
  const connect = useCallback(() => {
    if (!enabled) return;
    
    // Limpiar conexión anterior si existe
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    console.log(`[useRealtimeChannel] Conectando a ${channelName}...`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema,
          table,
          filter
        },
        (payload: any) => {
          console.log(`[useRealtimeChannel] Evento recibido en ${table}:`, payload.eventType);
          onEvent(payload);
        }
      )
      .subscribe((status, err) => {
        console.log(`[useRealtimeChannel] Estado ${channelName}:`, status);
        
        if (status === 'SUBSCRIBED') {
          isConnectedRef.current = true;
          reconnectAttemptsRef.current = 0; // Reset contador al conectar
          console.log(`[useRealtimeChannel] ✅ Conectado a ${channelName}`);
        }
        
        if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isConnectedRef.current = false;
          console.warn(`[useRealtimeChannel] ⚠️ Desconectado de ${channelName}:`, err);
          
          // Intentar reconectar con backoff exponencial
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
            reconnectAttemptsRef.current += 1;
            
            console.log(`[useRealtimeChannel] 🔄 Reconectando en ${delay}ms (intento ${reconnectAttemptsRef.current})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            console.error(`[useRealtimeChannel] ❌ Máximo de reintentos alcanzado para ${channelName}`);
          }
        }
      });
    
    channelRef.current = channel;
  }, [channelName, table, schema, event, filter, onEvent, enabled, reconnectDelay, maxReconnectAttempts]);
  
  // Reconectar manualmente
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    cleanup();
    connect();
  }, [cleanup, connect]);
  
  // Efecto principal
  useEffect(() => {
    if (enabled) {
      connect();
    }
    
    return () => {
      cleanup();
    };
  }, [enabled, connect, cleanup]);
  
  return {
    isConnected: isConnectedRef.current,
    reconnect,
    disconnect: cleanup
  };
};

/**
 * Hook simplificado para suscribirse a cambios de una tabla por restaurant_id
 */
export const useTableChanges = (
  table: string,
  restaurantId: string | null | undefined,
  onEvent: (payload: any) => void,
  enabled: boolean = true
) => {
  return useRealtimeChannel({
    channelName: `${table}_${restaurantId || 'global'}`,
    table,
    filter: restaurantId ? `restaurant_id=eq.${restaurantId}` : undefined,
    onEvent,
    enabled: enabled && !!restaurantId
  });
};
