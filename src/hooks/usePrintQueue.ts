import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { hasPrinterConfigured } from '@/lib/printerConfig';
import { printKitchenTickets, whatsappOrderToComanda } from '@/lib/printComanda';
import { ToastAction } from '@/components/ui/toast';
import React from 'react';

/**
 * Hook que escucha en tiempo real los pedidos confirmados por ALICIA
 * y los imprime automáticamente si el usuario tiene una impresora configurada.
 *
 * - Con impresora configurada → imprime directo, sin diálogos extra.
 * - Sin impresora configurada → toast con botón que abre la pantalla de configuración.
 *
 * Uso: montar este hook una sola vez en el layout principal del dashboard.
 */
export function usePrintQueue() {
  const { profile } = useAuth();
  const { toast } = useToast();
  // Guardamos los IDs ya procesados para evitar imprimir duplicados
  const printedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!profile?.restaurant_id) return;

    const restaurantId = profile.restaurant_id;

    const channel = supabase
      .channel(`print-queue-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const order = payload.new as Record<string, unknown>;
          const prevStatus = String((payload.old as Record<string, unknown>)?.status ?? '');
          const newStatus = String(order.status ?? '');
          const orderId = String(order.id ?? '');

          // Solo actuar cuando el pedido pasa a "confirmed" por primera vez
          if (newStatus !== 'confirmed' || prevStatus === 'confirmed') return;

          // Evitar duplicados
          if (printedIds.current.has(orderId)) return;
          printedIds.current.add(orderId);

          {
            // Sin impresora: toast con botón directo a configuración
            const comanda = whatsappOrderToComanda(order);
            toast({
              title: `Nuevo pedido — ${comanda.customer_name}`,
              description: 'Configura tu impresora térmica para imprimir comandas automáticamente.',
              action: React.createElement(
                ToastAction,
                {
                  altText: 'Configurar impresora',
                  onClick: () => window.dispatchEvent(new CustomEvent('conektao:open-printer-settings')),
                } as any,
                'Configurar'
              ) as any,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.restaurant_id, toast]);
}
