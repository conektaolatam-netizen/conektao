import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingState {
  tourCompleted: boolean;
  tourStep: number;
  isLoading: boolean;
  showTour: boolean;
}

export const useOnboardingTour = () => {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    tourCompleted: false,
    tourStep: 0,
    isLoading: true,
    showTour: false,
  });

  // Cargar estado del onboarding
  useEffect(() => {
    const loadOnboardingState = async () => {
      if (!user?.id) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_onboarding')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading onboarding state:', error);
        }

        if (data) {
          setState({
            tourCompleted: data.tour_completed,
            tourStep: data.tour_step || 0,
            isLoading: false,
            showTour: !data.tour_completed, // Mostrar si no se ha completado
          });
        } else {
          // Usuario nuevo, crear registro y mostrar tour
          const { error: insertError } = await supabase
            .from('user_onboarding')
            .insert({
              user_id: user.id,
              tour_completed: false,
              tour_step: 0,
              tour_started_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('Error creating onboarding record:', insertError);
          }

          setState({
            tourCompleted: false,
            tourStep: 0,
            isLoading: false,
            showTour: true,
          });
        }
      } catch (error) {
        console.error('Error in loadOnboardingState:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadOnboardingState();
  }, [user?.id]);

  // Actualizar paso del tour
  const updateTourStep = useCallback(async (step: number) => {
    if (!user?.id) return;

    setState(prev => ({ ...prev, tourStep: step }));

    await supabase
      .from('user_onboarding')
      .update({ tour_step: step, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
  }, [user?.id]);

  // Completar tour
  const completeTour = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({
      ...prev,
      tourCompleted: true,
      showTour: false,
    }));

    await supabase
      .from('user_onboarding')
      .update({
        tour_completed: true,
        tour_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  }, [user?.id]);

  // Saltar tour
  const skipTour = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({
      ...prev,
      showTour: false,
    }));

    await supabase
      .from('user_onboarding')
      .update({
        tour_completed: true,
        tour_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  }, [user?.id]);

  // Reiniciar tour (para acceso desde configuración)
  const restartTour = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({
      ...prev,
      tourCompleted: false,
      tourStep: 0,
      showTour: true,
    }));

    await supabase
      .from('user_onboarding')
      .update({
        tour_completed: false,
        tour_step: 0,
        tour_started_at: new Date().toISOString(),
        tour_completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  }, [user?.id]);

  // Ocultar tour temporalmente
  const hideTour = useCallback(() => {
    setState(prev => ({ ...prev, showTour: false }));
  }, []);

  return {
    ...state,
    updateTourStep,
    completeTour,
    skipTour,
    restartTour,
    hideTour,
  };
};
