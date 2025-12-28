import { useState, useCallback, useRef } from 'react';

interface UseDebounceClickOptions {
  delay?: number;
  onDebounced?: () => void;
}

/**
 * Hook para prevenir doble clic en botones críticos
 * 
 * Uso:
 * const { isLocked, handleClick } = useDebounceClick({ delay: 2000 });
 * <Button onClick={() => handleClick(myFunction)} disabled={isLocked}>
 */
export const useDebounceClick = (options: UseDebounceClickOptions = {}) => {
  const { delay = 2000, onDebounced } = options;
  
  const [isLocked, setIsLocked] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickRef = useRef<number>(0);
  
  const handleClick = useCallback(async (callback: () => void | Promise<void>) => {
    const now = Date.now();
    
    // Si está bloqueado o muy reciente, ignorar
    if (isLocked || now - lastClickRef.current < delay) {
      console.log('[useDebounceClick] Click ignorado (debounce activo)');
      onDebounced?.();
      return;
    }
    
    // Bloquear
    setIsLocked(true);
    lastClickRef.current = now;
    
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    try {
      // Ejecutar callback
      await callback();
    } finally {
      // Desbloquear después del delay
      timeoutRef.current = setTimeout(() => {
        setIsLocked(false);
      }, delay);
    }
  }, [delay, isLocked, onDebounced]);
  
  // Forzar desbloqueo
  const unlock = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLocked(false);
  }, []);
  
  // Forzar bloqueo
  const lock = useCallback(() => {
    setIsLocked(true);
  }, []);
  
  return {
    isLocked,
    handleClick,
    unlock,
    lock
  };
};

/**
 * Hook simplificado que retorna un wrapper para funciones
 */
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 2000
) => {
  const lastCallRef = useRef<number>(0);
  const [isThrottled, setIsThrottled] = useState(false);
  
  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallRef.current < delay) {
      console.log('[useThrottledCallback] Llamada ignorada (throttle activo)');
      return;
    }
    
    lastCallRef.current = now;
    setIsThrottled(true);
    
    const result = callback(...args);
    
    // Manejar promesas
    if (result instanceof Promise) {
      result.finally(() => {
        setTimeout(() => setIsThrottled(false), delay);
      });
    } else {
      setTimeout(() => setIsThrottled(false), delay);
    }
    
    return result;
  }, [callback, delay]);
  
  return { throttledCallback, isThrottled };
};
