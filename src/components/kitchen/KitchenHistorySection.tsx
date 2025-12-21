import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  ChefHat,
  AlertTriangle
} from 'lucide-react';

interface KitchenOrder {
  id: string;
  order_number: string;
  table_number: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  total_items: number;
  priority: 'normal' | 'high' | 'urgent';
  sent_at: string;
  completed_at: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  notes: string | null;
}

interface KitchenHistorySectionProps {
  completedOrders: KitchenOrder[];
  cancelledOrders: KitchenOrder[];
}

const KitchenHistorySection: React.FC<KitchenHistorySectionProps> = ({
  completedOrders,
  cancelledOrders,
}) => {
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const allOrders = [
    ...cancelledOrders.map(o => ({ ...o, isCancelled: true })),
    ...completedOrders.map(o => ({ ...o, isCancelled: false })),
  ].sort((a, b) => {
    const dateA = new Date(a.isCancelled ? a.cancelled_at || a.sent_at : a.completed_at || a.sent_at);
    const dateB = new Date(b.isCancelled ? b.cancelled_at || b.sent_at : b.completed_at || b.sent_at);
    return dateB.getTime() - dateA.getTime();
  });

  if (allOrders.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <ChefHat className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No hay comandas en el historial de hoy</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-2">
        {allOrders.map((order) => (
          <div
            key={order.id}
            className={`
              flex items-center justify-between p-3 rounded-lg border transition-all
              ${order.isCancelled 
                ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20' 
                : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
              }
            `}
          >
            <div className="flex items-center gap-3">
              {order.isCancelled ? (
                <div className="p-1.5 rounded-full bg-red-500/20">
                  <XCircle className="h-4 w-4 text-red-400" />
                </div>
              ) : (
                <div className="p-1.5 rounded-full bg-emerald-500/20">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </div>
              )}
              
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${order.isCancelled ? 'text-red-300' : 'text-emerald-300'}`}>
                    #{order.order_number}
                  </span>
                  {order.table_number && (
                    <span className="text-xs text-slate-400">
                      Mesa {order.table_number}
                    </span>
                  )}
                </div>
                
                {order.isCancelled && order.cancellation_reason && (
                  <p className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {order.cancellation_reason}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={`text-xs ${order.isCancelled ? 'border-red-500/50 text-red-300' : 'border-emerald-500/50 text-emerald-300'}`}
              >
                {order.isCancelled ? 'Anulada' : 'Completada'}
              </Badge>
              
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                {formatTime(order.isCancelled ? order.cancelled_at : order.completed_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default KitchenHistorySection;
