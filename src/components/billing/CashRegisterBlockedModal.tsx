import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Wallet, ArrowRight } from 'lucide-react';

interface CashRegisterBlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToCash: () => void;
  isClosed?: boolean;
}

const CashRegisterBlockedModal: React.FC<CashRegisterBlockedModalProps> = ({
  isOpen,
  onClose,
  onGoToCash,
  isClosed = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-bold text-red-800">
            {isClosed ? '⛔ Caja ya cerrada' : '⚠️ Caja no abierta'}
          </DialogTitle>
          <DialogDescription className="text-center text-red-700 text-base mt-2">
            {isClosed ? (
              <>
                La caja de hoy ya fue cerrada.
                <br />
                <span className="font-medium">No puedes registrar más ventas hasta mañana.</span>
              </>
            ) : (
              <>
                Debes abrir la caja con una base inicial antes de facturar.
                <br />
                <span className="font-medium">La base es el efectivo con el que empiezas el día.</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col mt-4">
          {!isClosed && (
            <Button
              onClick={onGoToCash}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Ir a Caja y abrir
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-red-700 hover:bg-red-100"
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CashRegisterBlockedModal;
