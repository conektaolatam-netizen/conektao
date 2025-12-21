import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, MessageSquare } from 'lucide-react';

interface TipAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedTipAmount: number;
  newTipAmount: number;
  subtotal: number;
  defaultTipPercent: number;
  onConfirm: (reasonType: string, reasonComment: string) => void;
  onCancel: () => void;
}

const TIP_REASON_TYPES = [
  { value: 'NO_TIP', label: 'Cliente decidió no dejar propina' },
  { value: 'SERVICE_ISSUE', label: 'Cliente tuvo mala experiencia con el servicio' },
  { value: 'ERROR', label: 'Error al cobrar (se digitó mal)' },
  { value: 'DISCOUNT', label: 'Descuento especial acordado con el cliente' },
  { value: 'LOWER_TIP', label: 'Cliente prefirió dejar menos propina' },
  { value: 'OTHER', label: 'Otro motivo' },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const TipAdjustmentModal: React.FC<TipAdjustmentModalProps> = ({
  open,
  onOpenChange,
  suggestedTipAmount,
  newTipAmount,
  subtotal,
  defaultTipPercent,
  onConfirm,
  onCancel
}) => {
  const [reasonType, setReasonType] = useState<string>('');
  const [reasonComment, setReasonComment] = useState<string>('');

  const difference = suggestedTipAmount - newTipAmount;
  const differencePercent = subtotal > 0 ? ((newTipAmount / subtotal) * 100).toFixed(1) : '0';

  const handleConfirm = () => {
    if (!reasonType) return;
    onConfirm(reasonType, reasonComment);
    // Reset state
    setReasonType('');
    setReasonComment('');
  };

  const handleCancel = () => {
    onCancel();
    setReasonType('');
    setReasonComment('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-gray-900 to-gray-950 border-orange-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Motivo de Modificación de Propina
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            La propina fue reducida. Por favor, indica el motivo para completar la venta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Resumen del cambio */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Propina sugerida ({defaultTipPercent}%):</span>
              <span className="text-white font-medium">{formatCurrency(suggestedTipAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Propina final ({differencePercent}%):</span>
              <span className="text-white font-medium">{formatCurrency(newTipAmount)}</span>
            </div>
            <div className="border-t border-yellow-500/30 pt-2 flex justify-between text-sm">
              <span className="text-yellow-500">Diferencia:</span>
              <span className="text-yellow-500 font-bold">-{formatCurrency(difference)}</span>
            </div>
          </div>

          {/* Selector de motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason-type" className="text-white flex items-center gap-2">
              <span className="text-red-500">*</span> Motivo del cambio
            </Label>
            <Select value={reasonType} onValueChange={setReasonType}>
              <SelectTrigger className="bg-gray-800/50 border-white/20 text-white">
                <SelectValue placeholder="Selecciona un motivo..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-white/20">
                {TIP_REASON_TYPES.map((reason) => (
                  <SelectItem 
                    key={reason.value} 
                    value={reason.value}
                    className="text-white hover:bg-gray-700"
                  >
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campo de comentario opcional */}
          <div className="space-y-2">
            <Label htmlFor="reason-comment" className="text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentario adicional (opcional)
            </Label>
            <Textarea
              id="reason-comment"
              value={reasonComment}
              onChange={(e) => setReasonComment(e.target.value)}
              placeholder="Detalles adicionales sobre el cambio..."
              className="bg-gray-800/50 border-white/20 text-white placeholder:text-gray-500 min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reasonType}
            className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
          >
            Confirmar Cambio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TipAdjustmentModal;
