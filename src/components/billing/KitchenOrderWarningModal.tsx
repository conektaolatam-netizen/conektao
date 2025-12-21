import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChefHat, LogOut } from 'lucide-react';

interface KitchenOrderWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToKitchen: () => void;
  onExitWithoutSending: () => void;
  itemsCount: number;
  tableNumber?: number;
  isLoading?: boolean;
}

const KitchenOrderWarningModal: React.FC<KitchenOrderWarningModalProps> = ({
  isOpen,
  onClose,
  onSendToKitchen,
  onExitWithoutSending,
  itemsCount,
  tableNumber,
  isLoading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
            <AlertTriangle className="h-10 w-10 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-amber-800">
            👀 ¡Ojo! Aún no has enviado la comanda a cocina
          </DialogTitle>
          <DialogDescription className="text-base text-amber-700">
            {tableNumber 
              ? `La Mesa ${tableNumber} tiene ${itemsCount} producto(s) pendientes.`
              : `Tienes ${itemsCount} producto(s) pendientes de enviar.`
            }
            <br />
            <strong>Si sales sin enviar la comanda, cocina no verá este pedido.</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6">
          {/* Botón principal - Enviar comanda */}
          <Button
            onClick={onSendToKitchen}
            disabled={isLoading}
            className="w-full h-14 bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 hover:from-orange-600 hover:via-red-600 hover:to-pink-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
          >
            <ChefHat className="h-6 w-6 mr-3" />
            {isLoading ? 'Enviando...' : '🔥 Enviar comanda ahora'}
          </Button>

          {/* Botón secundario - Salir sin enviar */}
          <Button
            variant="ghost"
            onClick={onExitWithoutSending}
            disabled={isLoading}
            className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Salir sin enviar
          </Button>
        </div>

        <p className="text-xs text-center text-amber-600 mt-4">
          ⚠️ Si sales sin enviar, este evento quedará registrado para auditoría.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default KitchenOrderWarningModal;
