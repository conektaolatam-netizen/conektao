import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AlertTriangle, ChefHat, Zap, Send } from 'lucide-react';
interface Product {
  id: string;
  name: string;
  price: number;
  special_instructions?: string;
}
interface KitchenOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmOrder: (items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    special_instructions?: string;
  }>, notes?: string, priority?: string, estimatedTime?: number) => void;
  selectedProducts: Array<{
    product: Product;
    quantity: number;
    special_instructions?: string;
  }>;
  tableNumber?: number;
  orderType: 'dine-in' | 'delivery';
  customerInfo?: {
    name: string;
    phone: string;
    address: string;
  };
}
const KitchenOrderModal: React.FC<KitchenOrderModalProps> = ({
  isOpen,
  onClose,
  onConfirmOrder,
  selectedProducts,
  tableNumber,
  orderType,
  customerInfo
}) => {
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [productInstructions, setProductInstructions] = useState<Record<string, string>>({});

  // Filtrar productos válidos
  const validProducts = selectedProducts.filter(item => item && item.product && item.product.name && item.quantity > 0);

  // Calcular tiempo estimado automáticamente
  const totalItems = validProducts.reduce((sum, item) => sum + item.quantity, 0);
  const autoEstimatedTime = Math.max(15, Math.min(60, totalItems * 5 + 10));
  const handleConfirm = () => {
    const items = validProducts.map(item => ({
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.price || 0,
      special_instructions: productInstructions[item.product.id] || item.special_instructions || undefined
    }));
    if (items.length === 0) {
      console.warn('No hay productos válidos para enviar a cocina');
      return;
    }
    onConfirmOrder(items, notes || undefined, priority, autoEstimatedTime);
    onClose();

    // Reset states
    setNotes('');
    setPriority('normal');
    setProductInstructions({});
  };
  const updateProductInstructions = (productId: string, instructions: string) => {
    setProductInstructions(prev => ({
      ...prev,
      [productId]: instructions
    }));
  };

  // Si no hay productos válidos
  if (validProducts.length === 0) {
    return <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Sin productos
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Agrega productos antes de enviar la comanda.
          </p>
          <Button onClick={onClose} variant="outline" size="sm">Cerrar</Button>
        </DialogContent>
      </Dialog>;
  }
  const getTitle = () => {
    if (orderType === 'delivery' && customerInfo?.name) {
      return `Comanda - ${customerInfo.name}`;
    }
    if (tableNumber) {
      return `Comanda - Mesa ${tableNumber}`;
    }
    return 'Enviar Comanda';
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-white">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <ChefHat className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
          <p className="text-white/80 text-xs mt-0.5">
            {totalItems} producto{totalItems !== 1 ? 's' : ''} • ~{autoEstimatedTime} min
          </p>
        </div>

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Lista compacta de productos */}
          <div className="space-y-2">
            {validProducts.map((item, index) => <div key={`${item.product.id}-${index}`} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                <div className="bg-primary/10 text-primary font-bold rounded-md w-7 h-7 flex items-center justify-center text-sm shrink-0">
                  {item.quantity}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product.name}</p>
                </div>
                
              </div>)}
          </div>

          {/* Observaciones generales */}
          <div>
            <Textarea placeholder="Observaciones generales para cocina (opcional)..." value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[60px] text-sm resize-none" />
          </div>

          {/* Prioridad - botones compactos */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Prioridad:</span>
            <div className="flex gap-1 flex-1">
              <Button variant={priority === 'normal' ? 'default' : 'outline'} size="sm" onClick={() => setPriority('normal')} className={`flex-1 h-8 text-xs ${priority === 'normal' ? 'bg-slate-600 hover:bg-slate-700' : ''}`}>
                Normal
              </Button>
              <Button variant={priority === 'high' ? 'default' : 'outline'} size="sm" onClick={() => setPriority('high')} className={`flex-1 h-8 text-xs ${priority === 'high' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}>
                Alta
              </Button>
              <Button variant={priority === 'urgent' ? 'default' : 'outline'} size="sm" onClick={() => setPriority('urgent')} className={`flex-1 h-8 text-xs gap-1 ${priority === 'urgent' ? 'bg-red-500 hover:bg-red-600' : ''}`}>
                <Zap className="h-3 w-3" />
                Urgente
              </Button>
            </div>
          </div>
        </div>

        {/* Footer con botones de acción */}
        <div className="border-t bg-muted/30 p-3 flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1 h-10">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="flex-[2] h-10 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold gap-2">
            <Send className="h-4 w-4" />
            Enviar a Cocina
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
};
export default KitchenOrderModal;