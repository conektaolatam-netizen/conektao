import { useState, useCallback } from 'react';
import { useAliciaContext } from './useAliciaContext';

export type PreventiveAlertType = 
  | 'unsent_command'
  | 'charge_without_command'
  | 'table_annulation'
  | 'cash_close_difference'
  | 'inventory_critical';

export interface PreventiveAlert {
  id: string;
  type: PreventiveAlertType;
  title: string;
  message: string;
  severity: 'warning' | 'critical';
  actions: {
    primary: { label: string; action: () => void };
    secondary?: { label: string; action: () => void };
  };
}

export function usePreventiveAlerts() {
  const { businessState, currentModule } = useAliciaContext();
  const [activeAlert, setActiveAlert] = useState<PreventiveAlert | null>(null);

  // Check for unsent command when leaving POS
  const checkUnsentCommand = useCallback((hasUnsentItems: boolean, onSend: () => void) => {
    if (hasUnsentItems) {
      setActiveAlert({
        id: 'unsent_command',
        type: 'unsent_command',
        title: 'Comanda sin enviar',
        message: 'Ojo 👀 Si sales sin enviar la comanda, esto quedará como alerta en AuditorIA. ¿Deseas enviarla ahora?',
        severity: 'warning',
        actions: {
          primary: { 
            label: 'Enviar comanda', 
            action: () => {
              onSend();
              setActiveAlert(null);
            }
          },
          secondary: { 
            label: 'Salir sin enviar', 
            action: () => setActiveAlert(null)
          },
        },
      });
      return true;
    }
    return false;
  }, []);

  // Check when trying to charge without sending command
  const checkChargeWithoutCommand = useCallback((commandSent: boolean, onSendFirst: () => void) => {
    if (!commandSent) {
      setActiveAlert({
        id: 'charge_without_command',
        type: 'charge_without_command',
        title: 'No se puede cobrar',
        message: 'Esta mesa no tiene comanda enviada a cocina. Debes enviar la comanda antes de cobrar.',
        severity: 'critical',
        actions: {
          primary: { 
            label: 'Enviar comanda primero', 
            action: () => {
              onSendFirst();
              setActiveAlert(null);
            }
          },
        },
      });
      return true;
    }
    return false;
  }, []);

  // Check when annulling a table with products
  const checkTableAnnulation = useCallback((hasProducts: boolean, totalAmount: number, onConfirm: () => void) => {
    if (hasProducts) {
      setActiveAlert({
        id: 'table_annulation',
        type: 'table_annulation',
        title: 'Confirmar anulación',
        message: `Esta mesa tiene productos por $${totalAmount.toLocaleString()}. Esta acción quedará registrada en AuditorIA. ¿Estás seguro?`,
        severity: 'critical',
        actions: {
          primary: { 
            label: 'Sí, anular mesa', 
            action: () => {
              onConfirm();
              setActiveAlert(null);
            }
          },
          secondary: { 
            label: 'Cancelar', 
            action: () => setActiveAlert(null)
          },
        },
      });
      return true;
    }
    return false;
  }, []);

  // Check cash closing difference
  const checkCashCloseDifference = useCallback((difference: number, onProceed: () => void) => {
    if (Math.abs(difference) > 0) {
      const isShort = difference < 0;
      setActiveAlert({
        id: 'cash_close_difference',
        type: 'cash_close_difference',
        title: isShort ? 'Faltante en caja' : 'Sobrante en caja',
        message: `Hay una diferencia de $${Math.abs(difference).toLocaleString()} ${isShort ? 'faltante' : 'sobrante'}. Esto quedará registrado. ¿Deseas continuar con el cierre?`,
        severity: isShort ? 'critical' : 'warning',
        actions: {
          primary: { 
            label: 'Cerrar con diferencia', 
            action: () => {
              onProceed();
              setActiveAlert(null);
            }
          },
          secondary: { 
            label: 'Revisar de nuevo', 
            action: () => setActiveAlert(null)
          },
        },
      });
      return true;
    }
    return false;
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback(() => {
    setActiveAlert(null);
  }, []);

  return {
    activeAlert,
    checkUnsentCommand,
    checkChargeWithoutCommand,
    checkTableAnnulation,
    checkCashCloseDifference,
    dismissAlert,
    // Passive alerts from business state
    hasCriticalInventory: businessState.criticalInventory > 0,
    criticalInventoryCount: businessState.criticalInventory,
    pendingOrdersCount: businessState.pendingOrders,
  };
}
