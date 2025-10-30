import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDataSync } from '@/hooks/useDataSync';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const DataSyncStatus = () => {
  const { syncState, forcSync, clearPendingOperations } = useDataSync();

  const getStatusIcon = () => {
    if (!syncState.isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    if (syncState.isSyncing) {
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    if (syncState.hasUnsyncedData) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!syncState.isOnline) {
      return 'Sin conexión';
    }
    if (syncState.isSyncing) {
      return 'Sincronizando...';
    }
    if (syncState.hasUnsyncedData) {
      return `${syncState.pendingOperations} pendientes`;
    }
    return 'Sincronizado';
  };

  const getStatusColor = () => {
    if (!syncState.isOnline) return 'destructive';
    if (syncState.isSyncing) return 'default';
    if (syncState.hasUnsyncedData) return 'secondary';
    return 'default';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">Estado de datos</span>
          <Badge variant={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          {syncState.lastSync && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {syncState.lastSync.toLocaleTimeString()}
              </span>
            </div>
          )}
          
          {syncState.isOnline && (
            <Button
              size="sm"
              variant="outline"
              onClick={forcSync}
              disabled={syncState.isSyncing}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          )}
          
          {syncState.hasUnsyncedData && (
            <Button
              size="sm"
              variant="destructive"
              onClick={clearPendingOperations}
            >
              Limpiar cola
            </Button>
          )}
        </div>
      </div>
      
      {!syncState.isOnline && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          Los datos se guardarán localmente y se sincronizarán cuando se restablezca la conexión.
        </div>
      )}
    </Card>
  );
};