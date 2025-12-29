import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Shield } from "lucide-react";

interface DangerousPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissionLabel: string;
  warning: string;
  onConfirm: () => void;
}

const DangerousPermissionModal = ({
  open,
  onOpenChange,
  permissionLabel,
  warning,
  onConfirm
}: DangerousPermissionModalProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-xl">
              ⚠️ Permiso sensible
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4 text-left">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="font-semibold text-foreground mb-2">
                Estás activando: {permissionLabel}
              </p>
              <p className="text-amber-700 dark:text-amber-300">
                {warning}
              </p>
            </div>
            
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p>
                Esta acción quedará registrada en el historial de auditoría. 
                Solo activa este permiso si confías plenamente en este empleado.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="flex-1 sm:flex-none">
            No, cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white"
          >
            Sí, habilitar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DangerousPermissionModal;
