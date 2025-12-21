import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseSupabaseQueryOptions {
  table: string;
  select?: string;
  filter?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  enabled?: boolean;
  onSuccess?: (data: any[]) => void;
  onError?: (error: Error) => void;
}

interface UseSupabaseQueryResult<T> {
  data: T[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Hook genérico para queries a Supabase con manejo robusto de errores
export function useSupabaseQuery<T = any>(
  options: UseSupabaseQueryOptions
): UseSupabaseQueryResult<T> {
  const {
    table,
    select = '*',
    filter,
    orderBy,
    limit,
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query string for filter
      let queryStr = `${select}`;
      
      // Execute base query
      const baseQuery = supabase.from(table as any).select(queryStr);
      
      let result;
      let queryError;

      // Apply filters, order, and limit manually
      if (filter && Object.keys(filter).length > 0) {
        const entries = Object.entries(filter);
        let q = baseQuery;
        for (const [key, value] of entries) {
          if (value !== undefined && value !== null) {
            q = q.eq(key, value);
          }
        }
        if (orderBy) {
          q = q.order(orderBy.column, { ascending: orderBy.ascending ?? true });
        }
        if (limit) {
          q = q.limit(limit);
        }
        const res = await q;
        result = res.data;
        queryError = res.error;
      } else {
        let q = baseQuery;
        if (orderBy) {
          q = q.order(orderBy.column, { ascending: orderBy.ascending ?? true });
        }
        if (limit) {
          q = q.limit(limit);
        }
        const res = await q;
        result = res.data;
        queryError = res.error;
      }

      if (!isMountedRef.current) return;

      if (queryError) {
        throw new Error(queryError.message);
      }

      setData(result as T[]);
      retryCountRef.current = 0;
      onSuccess?.(result as any[]);
    } catch (err) {
      if (!isMountedRef.current) return;

      const error = err instanceof Error ? err : new Error('Error desconocido');
      console.error(`Error fetching ${table}:`, error);
      
      // Retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchData();
          }
        }, delay);
      } else {
        setError(error);
        onError?.(error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [table, select, JSON.stringify(filter), orderBy?.column, orderBy?.ascending, limit, enabled, onSuccess, onError]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
