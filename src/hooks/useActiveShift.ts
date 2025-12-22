import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ShiftInfo {
  hasActiveShift: boolean;
  lastClockIn: string | null;
  lastClockOut: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to check if an employee has an active shift.
 * An active shift means: clock_in registered AND clock_out NOT registered.
 * GPS is NOT used for this validation - only attendance records.
 */
export const useActiveShift = () => {
  const { profile, restaurant } = useAuth();
  const [shiftInfo, setShiftInfo] = useState<ShiftInfo>({
    hasActiveShift: false,
    lastClockIn: null,
    lastClockOut: null,
    isLoading: true,
    error: null,
  });

  const checkShiftStatus = useCallback(async () => {
    // Owners and admins always have access - they don't need active shifts
    if (profile?.role === 'owner' || profile?.role === 'admin') {
      setShiftInfo({
        hasActiveShift: true,
        lastClockIn: null,
        lastClockOut: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    if (!profile?.id || !restaurant?.id) {
      setShiftInfo(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's clock records for this employee
      const { data: records, error } = await supabase
        .from('time_clock_records')
        .select('clock_type, timestamp')
        .eq('employee_id', profile.id)
        .eq('restaurant_id', restaurant.id)
        .gte('timestamp', `${today}T00:00:00`)
        .lt('timestamp', `${today}T23:59:59`)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Determine last action
      const lastRecord = records?.[0];
      const lastClockIn = records?.find(r => r.clock_type === 'clock_in')?.timestamp || null;
      const lastClockOut = records?.find(r => r.clock_type === 'clock_out')?.timestamp || null;

      // Active shift = last action is clock_in (not clock_out)
      const hasActiveShift = lastRecord?.clock_type === 'clock_in';

      setShiftInfo({
        hasActiveShift,
        lastClockIn,
        lastClockOut,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('Error checking shift status:', err);
      setShiftInfo(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Error al verificar turno',
      }));
    }
  }, [profile?.id, profile?.role, restaurant?.id]);

  // Check on mount and when dependencies change
  useEffect(() => {
    checkShiftStatus();
  }, [checkShiftStatus]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!profile?.id || !restaurant?.id) return;

    const channel = supabase
      .channel('shift-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_clock_records',
          filter: `employee_id=eq.${profile.id}`,
        },
        () => {
          checkShiftStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, restaurant?.id, checkShiftStatus]);

  return {
    ...shiftInfo,
    refresh: checkShiftStatus,
  };
};
