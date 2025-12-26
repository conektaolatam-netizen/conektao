import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Clock, User } from 'lucide-react';

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
  customerInfo?: { name: string; phone: string; address: string };
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
  const [estimatedTime, setEstimatedTime] = useState<number>(30);
  const [productInstructions, setProductInstructions] = useState<Record<string, string>>({});

  // Filtrar productos válidos
  const validProducts = selectedProducts.filter(item => item && item.product && item.product.name && item.quantity > 0);

  // Log para debug
  console.log('[KitchenOrderModal] selectedProducts:', selectedProducts);
  console.log('[KitchenOrderModal] validProducts:', validProducts);

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

    console.log('[KitchenOrderModal] Enviando items a cocina:', items);
    onConfirmOrder(items, notes || undefined, priority, estimatedTime);
    onClose();
    
    // Reset states
    setNotes('');
    setPriority('normal');
    setEstimatedTime(30);
    setProductInstructions({});
  };

  const updateProductInstructions = (productId: string, instructions: string) => {
    setProductInstructions(prev => ({
      ...prev,
      [productId]: instructions
    }));
  };

  const totalItems = validProducts.reduce((sum, item) => sum + item.quantity, 0);
  
  const totalAmount = validProducts.reduce((sum, item) => {
    return sum + ((item.product.price || 0) * item.quantity);
  }, 0);

  const getPriorityColor = (priorityLevel: string) => {
    switch (priorityLevel) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Si no hay productos válidos, mostrar mensaje en lugar de cerrar
  if (validProducts.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              No hay productos
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            No hay productos en la orden para enviar a cocina. Agrega productos primero.
          </p>
          <Button onClick={onClose} className="w-full">Cerrar</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Enviar Comanda a Cocina
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del pedido */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-gray-900">Información del Pedido</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tipo:</span>
                <span className="ml-2 font-medium">
                  {orderType === 'dine-in' ? 'Consumo en sala' : 'Domicilio'}
                </span>
              </div>
              
              {tableNumber && (
                <div>
                  <span className="text-gray-600">Mesa:</span>
                  <span className="ml-2 font-medium">Mesa {tableNumber}</span>
                </div>
              )}
              
              <div>
                <span className="text-gray-600">Total items:</span>
                <span className="ml-2 font-medium">{totalItems}</span>
              </div>
              
              <div>
                <span className="text-gray-600">Total:</span>
                <span className="ml-2 font-medium">${totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {orderType === 'delivery' && customerInfo && (
              <div className="border-t pt-3 mt-3">
                <h4 className="font-medium text-gray-900 mb-2">Información del Cliente</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <User className="h-4 w-4 inline mr-2 text-gray-500" />
                    {customerInfo.name}
                  </div>
                  {customerInfo.phone && (
                    <div className="text-gray-600">Tel: {customerInfo.phone}</div>
                  )}
                  {customerInfo.address && (
                    <div className="text-gray-600">Dir: {customerInfo.address}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Lista de productos con observaciones */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Productos del Pedido</h3>
            
            {validProducts.map((item, index) => (
              <div key={`${item.product.id}-${index}`} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{item.product.name}</h4>
                    <p className="text-sm text-gray-600">
                      Cantidad: {item.quantity} × ${(item.product.price || 0).toLocaleString()} = ${((item.quantity || 0) * (item.product.price || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`instructions-${item.product.id}`} className="text-sm font-medium">
                    Observaciones especiales para cocina:
                  </Label>
                  <Textarea
                    id={`instructions-${item.product.id}`}
                    placeholder="Ej: Sin cebolla, término medio, extra salsa..."
                    value={productInstructions[item.product.id] || item.special_instructions || ''}
                    onChange={(e) => updateProductInstructions(item.product.id, e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                  {(productInstructions[item.product.id] || item.special_instructions) && (
                    <p className="text-xs text-orange-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Esta observación aparecerá destacada en la comanda
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Configuración de la comanda */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Configuración de la Comanda</h3>
            
            {/* Prioridad */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Prioridad del pedido:</Label>
              <div className="flex gap-2">
                {[
                  { value: 'normal', label: 'Normal' },
                  { value: 'high', label: 'Alta' },
                  { value: 'urgent', label: 'Urgente' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={priority === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriority(option.value as any)}
                    className={priority === option.value ? getPriorityColor(option.value) : ""}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              {priority !== 'normal' && (
                <p className="text-xs text-orange-600">
                  Los pedidos con prioridad {priority === 'high' ? 'alta' : 'urgente'} se destacarán en cocina
                </p>
              )}
            </div>

            {/* Tiempo estimado */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tiempo estimado de preparación (minutos):
              </Label>
              <div className="flex gap-2">
                {[15, 20, 30, 45, 60].map((time) => (
                  <Button
                    key={time}
                    variant={estimatedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEstimatedTime(time)}
                  >
                    {time} min
                  </Button>
                ))}
              </div>
            </div>

            {/* Notas generales */}
            <div className="space-y-2">
              <Label htmlFor="general-notes" className="text-sm font-medium">
                Notas generales para cocina:
              </Label>
              <Textarea
                id="general-notes"
                placeholder="Notas adicionales para toda la comanda..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Resumen final */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Resumen de la Comanda</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Total de productos:</span>
                <span className="font-medium">{totalItems} items</span>
              </div>
              <div className="flex justify-between">
                <span>Prioridad:</span>
                <Badge className={getPriorityColor(priority)}>
                  {priority === 'urgent' ? 'Urgente' :
                   priority === 'high' ? 'Alta' : 'Normal'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Tiempo estimado:</span>
                <span className="font-medium">{estimatedTime} minutos</span>
              </div>
              <div className="flex justify-between">
                <span>Productos con observaciones:</span>
                <span className="font-medium">
                  {Object.values(productInstructions).filter(Boolean).length + 
                   validProducts.filter(p => p.special_instructions).length}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              Enviar Comanda a Cocina
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KitchenOrderModal;