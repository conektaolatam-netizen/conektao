import { useState } from 'react';

export const useDashboardNavigation = () => {
  const [currentView, setCurrentView] = useState<string | null>(null);

  const navigateToView = (view: string) => {
    setCurrentView(view);
  };

  const goBack = () => {
    setCurrentView(null);
  };

  return {
    currentView,
    navigateToView,
    goBack
  };
};