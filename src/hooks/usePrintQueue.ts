import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { loadPrinterConfig, hasPrinterConfigured } from '@/lib/printerConfig';
import { printComanda, whatsappOrderToComanda } from '@/lib/printComanda';

/**
 * Hook que escucha en tiempo real los pedidos confirmados por ALICIA
 * y los imprime automáticamente si el usuario tiene una impresora configurada
 * y la opción de autoimpresión activada.
 *
 * Uso: montar este hook una sola vez en el layout principal del dashboard.
 * No requiere props — se auto-configura con el restaurante del usuario autenticado.
 */
export function usePrintQueue() {
  const { profile } = useAuth();
  const { toast } = useToast();
  // Guardamos los IDs ya procesados para evitar imprimir duplicados
  const printedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!profile?.restaurant_id) return;

    const restaurantId = profile.restaurant_id;

    // Canal Supabase Realtime: escucha UPDATE en whatsapp_orders cuando
    // el status cambia a "confirmed". El webhook inserta primero con "received"
    // y luego actualiza a "confirmed" una vez validado.
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

          const config = loadPrinterConfig();

          if (config.autoprint && hasPrinterConfigured()) {
            // Imprimir automáticamente
            const comanda = whatsappOrderToComanda(order);
            const success = printComanda(comanda);

            if (success) {
              toast({
                title: 'Imprimiendo comanda',
                description: `Pedido de ${comanda.customer_name} enviado a ${config.printerName}`,
                className: 'bg-green-50 border-green-200',
              });
            } else {
              toast({
                title: 'No se pudo imprimir',
                description: 'Verifica que el navegador permita ventanas emergentes para este sitio.',
                variant: 'destructive',
              });
            }
          } else {
            // Notificar al usuario con opción de imprimir manualmente
            const comanda = whatsappOrderToComanda(order);
            toast({
              title: `Nuevo pedido — ${comanda.customer_name}`,
              description: hasPrinterConfigured()
                ? 'La autoimpresión está desactivada. Ve a Configuración → Impresión para activarla.'
                : 'No hay impresora configurada. Ve a Configuración → Impresión.',
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
