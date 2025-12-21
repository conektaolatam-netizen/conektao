import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Ban, ChefHat, X } from 'lucide-react';

interface PaymentBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToKitchenAndContinue: () => void;
  isLoading?: boolean;
}

const PaymentBlockedModal: React.FC<PaymentBlockedModalProps> = ({
  isOpen,
  onClose,
  onSendToKitchenAndContinue,
  isLoading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center">
            <Ban className="h-10 w-10 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-red-800">
            ⛔ No puedes cobrar esta orden
          </DialogTitle>
          <DialogDescription className="text-base text-red-700">
            <strong>Aún no has enviado la comanda a cocina.</strong>
            <br /><br />
            Debes enviar la comanda antes de poder procesar el cobro para garantizar que los productos hayan sido preparados.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6">
          {/* Botón principal - Enviar y continuar */}
          <Button
            onClick={onSendToKitchenAndContinue}
            disabled={isLoading}
            className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
          >
            <ChefHat className="h-6 w-6 mr-3" />
            {isLoading ? 'Enviando...' : '✅ Enviar comanda y continuar'}
          </Button>

          {/* Botón secundario - Cancelar */}
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="text-red-700 hover:text-red-800 hover:bg-red-100"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>

        <p className="text-xs text-center text-red-600 mt-4">
          ⚠️ Este intento de cobro sin comanda ha sido registrado para auditoría.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentBlockedModal;
