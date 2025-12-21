import React from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Cargando...', 
  fullScreen = false 
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return content;
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title = 'Error al cargar',
  message = 'No se pudieron cargar los datos. Por favor, intenta de nuevo.',
  onRetry,
  fullScreen = false
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Intentar de nuevo
        </Button>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return content;
};

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = 'Sin datos',
  message = 'No hay datos disponibles en este momento.',
  icon,
  action
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {icon && (
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
      {action}
    </div>
  );
};
