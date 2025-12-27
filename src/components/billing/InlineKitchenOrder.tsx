import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChefHat, Send, X, ArrowLeft } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  special_instructions?: string;
}

interface InlineKitchenOrderProps {
  selectedProducts: Product[];
  tableNumber?: number;
  onConfirmOrder: (items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    special_instructions?: string;
  }>, notes?: string, priority?: string, estimatedTime?: number) => void;
  onClose: () => void;
  onBackToTables: () => void;
  isLoading?: boolean;
}

const InlineKitchenOrder: React.FC<InlineKitchenOrderProps> = ({
  selectedProducts,
  tableNumber,
  onConfirmOrder,
  onClose,
  onBackToTables,
  isLoading = false
}) => {
  const [notes, setNotes] = useState('');

  // Filtrar productos válidos
  const validProducts = selectedProducts.filter(item => item && item.name && item.quantity > 0);

  // Calcular tiempo estimado automáticamente
  const totalItems = validProducts.reduce((sum, item) => sum + item.quantity, 0);
  const autoEstimatedTime = Math.max(15, Math.min(60, totalItems * 5 + 10));

  const handleConfirm = () => {
    const items = validProducts.map(item => ({
      product_id: String(item.id),
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price || 0,
      special_instructions: item.special_instructions || undefined
    }));

    if (items.length === 0) {
      console.warn('No hay productos válidos para enviar a cocina');
      return;
    }

    onConfirmOrder(items, notes || undefined, 'normal', autoEstimatedTime);
    setNotes('');
  };

  if (validProducts.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mx-4 mt-4">
        <div className="flex items-center gap-2 text-amber-700">
          <ChefHat className="h-5 w-5" />
          <span className="font-medium">Agrega productos antes de enviar la comanda</span>
        </div>
        <Button onClick={onClose} variant="ghost" size="sm" className="mt-2">
          Cerrar
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-black/95 border-b-2 border-orange-500/50 animate-in slide-in-from-top duration-300 backdrop-blur-xl">
      {/* Header con botón de volver */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBackToTables}
              className="rounded-full text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <ChefHat className="h-5 w-5" />
                Comanda - Mesa {tableNumber}
              </h2>
              <p className="text-white/80 text-xs">
                {totalItems} producto{totalItems !== 1 ? 's' : ''} • ~{autoEstimatedTime} min
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="rounded-full text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Lista compacta de productos */}
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {validProducts.map((item, index) => (
            <div 
              key={`${item.id}-${index}`} 
              className="flex items-center gap-2 bg-white/10 rounded-lg p-2 border border-white/10"
            >
              <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white font-bold rounded-md w-7 h-7 flex items-center justify-center text-sm shrink-0">
                {item.quantity}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-white">{item.name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Observaciones generales */}
        <Textarea 
          placeholder="Observaciones para cocina (opcional)..." 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
          className="min-h-[60px] text-sm resize-none bg-white/10 border-white/20 focus:border-orange-400 text-white placeholder:text-white/50"
        />

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 h-12 border-white/20 text-white hover:bg-white/10 bg-transparent"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-[2] h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold gap-2 shadow-lg"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar a Cocina
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InlineKitchenOrder;
