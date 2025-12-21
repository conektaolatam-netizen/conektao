import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  Timer, 
  Users, 
  Eye,
  Flame,
  XCircle,
  ChefHat
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface KitchenOrderItem {
  id: string;
  product_name: string;
  quantity: number;
  special_instructions: string | null;
  status: 'pending' | 'preparing' | 'ready';
}

interface KitchenOrder {
  id: string;
  order_number: string;
  table_number: number | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  total_items: number;
  priority: 'normal' | 'high' | 'urgent';
  estimated_time: number | null;
  sent_at: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  user_id: string;
  restaurant_id: string;
  items: KitchenOrderItem[];
}

interface KitchenOrderCardProps {
  order: KitchenOrder;
  onStart: (orderId: string) => Promise<void>;
  onComplete: (orderId: string) => Promise<void>;
  onViewDetails: (order: KitchenOrder) => void;
  onCancel: (order: KitchenOrder) => void;
  canCancel: boolean;
  isAnimatingOut?: boolean;
}

const KitchenOrderCard: React.FC<KitchenOrderCardProps> = ({
  order,
  onStart,
  onComplete,
  onViewDetails,
  onCancel,
  canCancel,
  isAnimatingOut = false
}) => {
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [isProcessing, setIsProcessing] = useState(false);

  // Actualizar cronómetro cada segundo
  useEffect(() => {
    const updateElapsedTime = () => {
      const now = new Date();
      const sent = new Date(order.sent_at);
      const diffMs = now.getTime() - sent.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffSecs = Math.floor((diffMs % 60000) / 1000);
      
      if (diffMins >= 60) {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        setElapsedTime(`${hours}:${mins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`);
      } else {
        setElapsedTime(`${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`);
      }
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);
    return () => clearInterval(interval);
  }, [order.sent_at]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusStyles = () => {
    switch (order.status) {
      case 'pending':
        return 'border-l-amber-400 bg-gradient-to-br from-slate-800 to-slate-900';
      case 'in_progress':
        return 'border-l-cyan-400 bg-gradient-to-br from-slate-800 to-cyan-900/30';
      case 'completed':
        return 'border-l-emerald-400 bg-gradient-to-br from-slate-800 to-emerald-900/30';
      case 'cancelled':
        return 'border-l-red-500 bg-gradient-to-br from-slate-800 to-red-900/30';
      default:
        return 'border-l-gray-400 bg-slate-800';
    }
  };

  const getPriorityIcon = () => {
    if (order.priority === 'urgent') {
      return <Flame className="h-4 w-4 text-red-400 animate-pulse" />;
    }
    if (order.priority === 'high') {
      return <Flame className="h-4 w-4 text-orange-400" />;
    }
    return null;
  };

  const handleStart = async () => {
    setIsProcessing(true);
    try {
      await onStart(order.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      await onComplete(order.id);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ 
          opacity: isAnimatingOut ? 0 : 1, 
          y: isAnimatingOut ? -50 : 0, 
          scale: isAnimatingOut ? 0.9 : 1 
        }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        layout
      >
        <Card 
          className={`
            border-l-4 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]
            ${getStatusStyles()}
            ${order.priority === 'urgent' ? 'ring-2 ring-red-500/50 animate-pulse' : ''}
          `}
        >
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-white">
                  #{order.order_number}
                </CardTitle>
                {getPriorityIcon()}
              </div>
              
              {/* Cronómetro */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600">
                <Timer className="h-4 w-4 text-orange-400" />
                <span className="font-mono text-sm font-semibold text-orange-400">
                  ⏱ {elapsedTime}
                </span>
              </div>
            </div>

            {/* Mesa y prioridad */}
            <div className="flex items-center gap-2 mt-2">
              {order.table_number ? (
                <Badge variant="outline" className="bg-slate-700/50 text-slate-200 border-slate-600">
                  <Users className="h-3 w-3 mr-1" />
                  Mesa {order.table_number}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-700/50 text-slate-200 border-slate-600">
                  🏠 Domicilio
                </Badge>
              )}
              
              {order.priority !== 'normal' && (
                <Badge 
                  className={`
                    ${order.priority === 'urgent' 
                      ? 'bg-red-500/20 text-red-300 border-red-500/50' 
                      : 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                    }
                  `}
                >
                  {order.priority === 'urgent' ? '🔥 URGENTE' : '⚡ Alta'}
                </Badge>
              )}
              
              <Badge 
                className={`
                  ${order.status === 'pending' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  }
                `}
              >
                {order.status === 'pending' ? '⏳ Pendiente' : '🍳 En preparación'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 px-4 pb-4">
            {/* Items */}
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {order.items.map((item, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center py-1.5 px-2 rounded bg-slate-700/30"
                >
                  <span className="text-sm text-slate-200">
                    <span className="font-semibold text-cyan-400">{item.quantity}x</span> {item.product_name}
                  </span>
                  {item.special_instructions && (
                    <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-300 border-yellow-500/30">
                      📝 Nota
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Notas especiales */}
            {order.notes && (
              <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-xs text-yellow-300">
                  <strong>📋 Notas:</strong> {order.notes}
                </p>
              </div>
            )}

            {/* Info adicional */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700">
              <span>Recibido: {formatTime(order.sent_at)}</span>
              <span>{order.total_items} items</span>
            </div>

            {/* Acciones principales */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onViewDetails(order)}
                className="flex-1 bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-600"
              >
                <Eye className="h-4 w-4 mr-1" />
                Detalles
              </Button>

              {order.status === 'pending' ? (
                <Button 
                  onClick={handleStart}
                  disabled={isProcessing}
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold shadow-lg"
                >
                  <Flame className="h-4 w-4 mr-1" />
                  {isProcessing ? '...' : 'Preparar'}
                </Button>
              ) : (
                <Button 
                  onClick={handleComplete}
                  disabled={isProcessing}
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold shadow-lg"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {isProcessing ? '...' : '¡Lista!'}
                </Button>
              )}
            </div>

            {/* Botón de anulación (solo para usuarios con permiso) */}
            {canCancel && order.status !== 'completed' && order.status !== 'cancelled' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCancel(order)}
                className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Anular comanda
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default KitchenOrderCard;
