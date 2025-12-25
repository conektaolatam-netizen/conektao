/**
 * Receipt Confirmation Modal
 * Simple modal for human confirmation with edit capability
 * Stores original_extraction vs user_corrected
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Edit3, X, Save, RotateCcw } from 'lucide-react';
import { trackManualEdits, canConfirm, ReceiptItem } from '@/lib/receiptStateManager';

interface ReceiptConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedData: {
    supplier_name: string;
    total: number;
    items: any[];
    date?: string;
    invoice_number?: string;
    confidence?: number;
    realConfidence?: number;
  };
  receiptUrl?: string;
  onConfirm: (data: {
    original_extraction: any;
    user_corrected: any;
    has_manual_edits: boolean;
  }) => void;
  onRescan: () => void;
  onManual: () => void;
}

export const ReceiptConfirmationModal: React.FC<ReceiptConfirmationModalProps> = ({
  isOpen,
  onClose,
  extractedData,
  receiptUrl,
  onConfirm,
  onRescan,
  onManual
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [supplierName, setSupplierName] = useState(extractedData.supplier_name || '');
  const [items, setItems] = useState<ReceiptItem[]>(() => 
    (extractedData.items || []).map((item: any, idx: number) => ({
      description: item.description || '',
      quantity: item.quantity || 0,
      unit: item.unit || 'unidades',
      unit_price: item.unit_price || 0,
      subtotal: item.subtotal || 0,
    }))
  );

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const realConfidence = extractedData.realConfidence || extractedData.confidence || 0;

  // Check if can confirm
  const confirmCheck = canConfirm({
    supplier_name: supplierName,
    total_amount: totalAmount,
    items
  });

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      
      const updated = { ...item, [field]: value };
      
      // Auto-calculate subtotal
      if (field === 'quantity' || field === 'unit_price') {
        updated.subtotal = updated.quantity * updated.unit_price;
      }
      
      return updated;
    }));
  };

  const handleDeleteItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const userCorrected = {
      supplier_name: supplierName,
      total: totalAmount,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      })),
      date: extractedData.date,
      invoice_number: extractedData.invoice_number
    };

    const { hasEdits } = trackManualEdits(extractedData, userCorrected);

    onConfirm({
      original_extraction: extractedData,
      user_corrected: userCorrected,
      has_manual_edits: hasEdits
    });
  };

  const isCriticalMissing = !confirmCheck.allowed;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCriticalMissing ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            Confirmar datos de la factura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Confidence indicator */}
          <div className={`p-3 rounded-lg ${
            isCriticalMissing ? 'bg-destructive/10' : realConfidence < 70 ? 'bg-amber-50' : 'bg-green-50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {isCriticalMissing 
                  ? '❌ Datos críticos faltantes'
                  : realConfidence < 70 
                    ? '⚠️ Confianza baja - Verifica los datos'
                    : '✅ Datos extraídos correctamente'
                }
              </span>
              <Badge variant={isCriticalMissing ? 'destructive' : 'secondary'}>
                Confianza: {realConfidence}%
              </Badge>
            </div>
            {!confirmCheck.allowed && (
              <p className="text-sm text-destructive mt-1">{confirmCheck.reason}</p>
            )}
          </div>

          {/* Receipt preview */}
          {receiptUrl && (
            <div className="border rounded-lg p-2 bg-muted/50">
              <img 
                src={receiptUrl} 
                alt="Factura escaneada" 
                className="max-h-32 mx-auto object-contain rounded"
              />
            </div>
          )}

          {/* Supplier */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Proveedor</label>
            {isEditing ? (
              <Input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Nombre del proveedor"
              />
            ) : (
              <p className="text-lg font-semibold">{supplierName || 'No identificado'}</p>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Items ({items.length})</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <><X className="h-4 w-4 mr-1" /> Cancelar edición</>
                ) : (
                  <><Edit3 className="h-4 w-4 mr-1" /> Editar</>
                )}
              </Button>
            </div>

            <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-4 text-center text-muted-foreground">
                  No se detectaron items
                </p>
              ) : (
                items.map((item, index) => (
                  <div key={index} className="p-3">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Descripción"
                        />
                        <div className="grid grid-cols-4 gap-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            placeholder="Cantidad"
                          />
                          <Input
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            placeholder="Unidad"
                          />
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            placeholder="Precio"
                          />
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteItem(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} {item.unit} × ${item.unit_price.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-medium">${item.subtotal.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="font-medium">Total</span>
            <span className="text-xl font-bold">${totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onRescan}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reescanear
            </Button>
            <Button variant="ghost" onClick={onManual}>
              Modo manual
            </Button>
          </div>
          <Button 
            onClick={handleConfirm}
            disabled={!confirmCheck.allowed}
            className={confirmCheck.allowed ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <Save className="h-4 w-4 mr-1" />
            {confirmCheck.allowed ? 'Confirmar datos' : confirmCheck.reason}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptConfirmationModal;
