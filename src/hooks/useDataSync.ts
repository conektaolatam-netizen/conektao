import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  hasUnsyncedData: boolean;
  pendingOperations: number;
}

interface DataOperation {
  id: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: Date;
  retryCount: number;
}

export const useDataSync = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    hasUnsyncedData: false,
    pendingOperations: 0
  });

  const [pendingOperations, setPendingOperations] = useState<DataOperation[]>([]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, isOnline: true }));
      // Auto-sync when coming back online
      if (pendingOperations.length > 0) {
        syncPendingOperations();
      }
    };

    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingOperations.length]);

  // Load pending operations from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('pendingDataOperations');
    if (stored) {
      try {
        const operations = JSON.parse(stored);
        setPendingOperations(operations);
        setSyncState(prev => ({
          ...prev,
          hasUnsyncedData: operations.length > 0,
          pendingOperations: operations.length
        }));
      } catch (error) {
        console.error('Error loading pending operations:', error);
        localStorage.removeItem('pendingDataOperations');
      }
    }
  }, []);

  // Save pending operations to localStorage
  useEffect(() => {
    localStorage.setItem('pendingDataOperations', JSON.stringify(pendingOperations));
    setSyncState(prev => ({
      ...prev,
      hasUnsyncedData: pendingOperations.length > 0,
      pendingOperations: pendingOperations.length
    }));
  }, [pendingOperations]);

  // Queue operation for sync
  const queueOperation = useCallback((table: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', data: any) => {
    const newOperation: DataOperation = {
      id: `${Date.now()}-${Math.random()}`,
      table,
      operation,
      data,
      timestamp: new Date(),
      retryCount: 0
    };

    setPendingOperations(prev => [...prev, newOperation]);

    // Try to sync immediately if online
    if (syncState.isOnline) {
      setTimeout(() => syncPendingOperations(), 100);
    }

    return newOperation.id;
  }, [syncState.isOnline]);

  // Execute a single operation with type safety bypass
  const executeOperation = async (operation: DataOperation): Promise<boolean> => {
    try {
      let query;
      
      switch (operation.operation) {
        case 'INSERT':
          query = (supabase as any).from(operation.table).insert(operation.data);
          break;
        case 'UPDATE':
          query = (supabase as any).from(operation.table)
            .update(operation.data)
            .eq('id', operation.data.id);
          break;
        case 'DELETE':
          query = (supabase as any).from(operation.table)
            .delete()
            .eq('id', operation.data.id);
          break;
        default:
          throw new Error(`Unknown operation: ${operation.operation}`);
      }

      const { error } = await query;
      
      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error(`Error executing ${operation.operation} on ${operation.table}:`, error);
      return false;
    }
  };

  // Sync all pending operations
  const syncPendingOperations = useCallback(async () => {
    if (!syncState.isOnline || syncState.isSyncing || pendingOperations.length === 0) {
      return;
    }

    setSyncState(prev => ({ ...prev, isSyncing: true }));

    const successfulOperations: string[] = [];
    const failedOperations: DataOperation[] = [];

    for (const operation of pendingOperations) {
      const success = await executeOperation(operation);
      
      if (success) {
        successfulOperations.push(operation.id);
      } else {
        failedOperations.push({
          ...operation,
          retryCount: operation.retryCount + 1
        });
      }
    }

    // Remove successful operations and update failed ones
    setPendingOperations(failedOperations.filter(op => op.retryCount < 3));

    // Update sync state
    setSyncState(prev => ({
      ...prev,
      isSyncing: false,
      lastSync: new Date(),
      hasUnsyncedData: failedOperations.length > 0,
      pendingOperations: failedOperations.length
    }));

    // Show notification
    if (successfulOperations.length > 0) {
      toast({
        title: "Datos sincronizados",
        description: `${successfulOperations.length} operaciones sincronizadas exitosamente`,
      });
    }

    if (failedOperations.length > 0) {
      toast({
        title: "Algunas operaciones fallaron",
        description: `${failedOperations.length} operaciones serán reintentadas`,
        variant: "destructive"
      });
    }
  }, [syncState.isOnline, syncState.isSyncing, pendingOperations, toast]);

  // Perform safe database operation
  const safeDbOperation = useCallback(async (
    table: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    data: any,
    optimisticUpdate?: () => void
  ) => {
    // Apply optimistic update immediately
    if (optimisticUpdate) {
      optimisticUpdate();
    }

    if (syncState.isOnline) {
      try {
        // Try to execute immediately
        const success = await executeOperation({
          id: 'immediate',
          table,
          operation,
          data,
          timestamp: new Date(),
          retryCount: 0
        });

        if (success) {
          return { success: true, queued: false };
        }
      } catch (error) {
        console.error('Immediate operation failed, queuing:', error);
      }
    }

    // Queue for later sync
    const operationId = queueOperation(table, operation, data);
    return { success: true, queued: true, operationId };
  }, [syncState.isOnline, queueOperation]);

  // Manual sync trigger
  const forcSync = useCallback(() => {
    if (syncState.isOnline) {
      syncPendingOperations();
    } else {
      toast({
        title: "Sin conexión",
        description: "No es posible sincronizar sin conexión a internet",
        variant: "destructive"
      });
    }
  }, [syncState.isOnline, syncPendingOperations, toast]);

  // Clear all pending operations (use with caution)
  const clearPendingOperations = useCallback(() => {
    setPendingOperations([]);
    localStorage.removeItem('pendingDataOperations');
    toast({
      title: "Operaciones pendientes limpiadas",
      description: "Todas las operaciones pendientes han sido eliminadas",
    });
  }, [toast]);

  return {
    syncState,
    safeDbOperation,
    forcSync,
    clearPendingOperations,
    pendingOperations: pendingOperations.length
  };
};