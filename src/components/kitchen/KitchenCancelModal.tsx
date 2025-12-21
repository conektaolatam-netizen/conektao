import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, XCircle } from 'lucide-react';

interface KitchenCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reasonType: string, reasonComment: string) => Promise<void>;
  orderNumber: string;
}

const CANCELLATION_REASONS = [
  { value: 'ORDER_ERROR', label: 'Error al tomar la orden' },
  { value: 'CUSTOMER_CANCELLED', label: 'Cliente canceló el pedido' },
  { value: 'KITCHEN_ISSUE', label: 'Problema en cocina (ingredientes, equipo)' },
  { value: 'DUPLICATE_ORDER', label: 'Orden duplicada' },
  { value: 'WRONG_TABLE', label: 'Mesa incorrecta' },
  { value: 'OTHER', label: 'Otro motivo' },
];

const KitchenCancelModal: React.FC<KitchenCancelModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
}) => {
  const [reasonType, setReasonType] = useState('');
  const [reasonComment, setReasonComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!reasonType) {
      setError('Debes seleccionar un motivo de anulación');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      await onConfirm(reasonType, reasonComment);
      // Reset state
      setReasonType('');
      setReasonComment('');
    } catch (err) {
      setError('Error al anular la comanda. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReasonType('');
    setReasonComment('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-red-500/20">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <DialogTitle className="text-xl text-white">
              Anular Comanda
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400">
            Vas a anular la comanda completa de la{' '}
            <span className="font-bold text-red-400">Orden #{orderNumber}</span>.
            Esta acción quedará registrada en el sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selector de motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason-type" className="text-slate-200">
              Motivo de anulación <span className="text-red-400">*</span>
            </Label>
            <Select value={reasonType} onValueChange={setReasonType}>
              <SelectTrigger 
                id="reason-type"
                className="bg-slate-800 border-slate-600 text-white"
              >
                <SelectValue placeholder="Selecciona un motivo..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {CANCELLATION_REASONS.map((reason) => (
                  <SelectItem 
                    key={reason.value} 
                    value={reason.value}
                    className="text-slate-200 focus:bg-slate-700 focus:text-white"
                  >
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comentario adicional */}
          <div className="space-y-2">
            <Label htmlFor="reason-comment" className="text-slate-200">
              Comentario adicional (opcional)
            </Label>
            <Textarea
              id="reason-comment"
              value={reasonComment}
              onChange={(e) => setReasonComment(e.target.value)}
              placeholder="Describe con más detalle el motivo de la anulación..."
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 min-h-[80px]"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded bg-red-500/20 border border-red-500/50">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !reasonType}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Anulando...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Confirmar Anulación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KitchenCancelModal;
