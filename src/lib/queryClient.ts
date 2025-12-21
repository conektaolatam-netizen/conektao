import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// QueryClient configurado para estabilidad y persistencia
export const createStableQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Retry logic para manejar errores de red
      retry: (failureCount, error) => {
        // No reintentar errores de autenticación
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          if (message.includes('unauthorized') || message.includes('jwt') || message.includes('auth')) {
            return false;
          }
        }
        // Máximo 3 reintentos
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Cache configuration
      staleTime: 1000 * 60 * 2, // 2 minutos - datos considerados frescos
      gcTime: 1000 * 60 * 30, // 30 minutos - tiempo en cache
      
      // No refetch automático para evitar loops
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      
      // Timeout para queries
      networkMode: 'online',
    },
    mutations: {
      // Reintentos para mutaciones
      retry: 2,
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});

// Instance singleton
let queryClientInstance: QueryClient | null = null;

export const getQueryClient = (): QueryClient => {
  if (!queryClientInstance) {
    queryClientInstance = createStableQueryClient();
  }
  return queryClientInstance;
};

// Reset client (útil para logout)
export const resetQueryClient = () => {
  if (queryClientInstance) {
    queryClientInstance.clear();
  }
};
