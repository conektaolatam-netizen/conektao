import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionContextType {
  isOnline: boolean;
  isSupabaseConnected: boolean;
  lastConnectionCheck: Date | null;
  checkConnection: () => Promise<boolean>;
  connectionError: string | null;
}

const ConnectionContext = createContext<ConnectionContextType>({
  isOnline: true,
  isSupabaseConnected: true,
  lastConnectionCheck: null,
  checkConnection: async () => true,
  connectionError: null,
});

export const useConnection = () => useContext(ConnectionContext);

interface ConnectionProviderProps {
  children: ReactNode;
}

export const ConnectionProvider: React.FC<ConnectionProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const [lastConnectionCheck, setLastConnectionCheck] = useState<Date | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Verificar conexión con Supabase
  const checkConnection = async (): Promise<boolean> => {
    try {
      // Simple health check - just verify we can reach Supabase
      const { error } = await supabase.auth.getSession();
      
      if (!isMountedRef.current) return false;
      
      if (error) {
        // Auth errors no significan desconexión necesariamente
        if (error.message.includes('network') || error.message.includes('fetch')) {
          setIsSupabaseConnected(false);
          setConnectionError('Error de conexión con el servidor');
          return false;
        }
      }
      
      setIsSupabaseConnected(true);
      setConnectionError(null);
      setLastConnectionCheck(new Date());
      return true;
    } catch (err) {
      if (!isMountedRef.current) return false;
      
      console.warn('Connection check failed:', err);
      setIsSupabaseConnected(false);
      setConnectionError('No se puede conectar con el servidor');
      return false;
    }
  };

  // Monitor online/offline status
  useEffect(() => {
    isMountedRef.current = true;

    const handleOnline = () => {
      setIsOnline(true);
      // Re-check Supabase connection when back online
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsSupabaseConnected(false);
      setConnectionError('Sin conexión a internet');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnection();

    // Periodic check every 30 seconds (not too frequent to avoid loops)
    checkIntervalRef.current = setInterval(() => {
      if (navigator.onLine) {
        checkConnection();
      }
    }, 30000);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  return (
    <ConnectionContext.Provider value={{
      isOnline,
      isSupabaseConnected,
      lastConnectionCheck,
      checkConnection,
      connectionError,
    }}>
      {children}
    </ConnectionContext.Provider>
  );
};
