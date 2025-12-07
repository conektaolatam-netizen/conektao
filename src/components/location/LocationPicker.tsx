import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  radius?: number;
  address?: string;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  onRadiusChange?: (radius: number) => void;
  showRadiusSlider?: boolean;
  className?: string;
}

const RADIUS_OPTIONS = [
  { value: 2, label: '2m', description: 'Muy preciso - Solo dentro del local' },
  { value: 5, label: '5m', description: 'Preciso - Entrada principal' },
  { value: 10, label: '10m', description: 'Flexible - Área cercana' },
];

const LocationPicker = ({
  latitude,
  longitude,
  radius = 2,
  address,
  onLocationChange,
  onRadiusChange,
  showRadiusSlider = true,
  className,
}: LocationPickerProps) => {
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState(address || '');
  const [error, setError] = useState<string | null>(null);

  const hasLocation = latitude !== null && longitude !== null && latitude !== undefined && longitude !== undefined;

  useEffect(() => {
    if (address) {
      setResolvedAddress(address);
    }
  }, [address]);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      setIsGeocoding(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es',
          },
        }
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        const addr = await reverseGeocode(lat, lng);
        setResolvedAddress(addr);
        onLocationChange(lat, lng, addr);
        
        setIsLocating(false);
        toast.success('Ubicación capturada correctamente');
      },
      (err) => {
        setIsLocating(false);
        let errorMessage = 'No se pudo obtener tu ubicación';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado. Habilítalo en tu navegador.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible. Intenta de nuevo.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado. Intenta de nuevo.';
            break;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Explanation */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">📍 ¿Para qué se usa esta ubicación?</span>
          <br />
          Se utilizará para el <strong>registro de horas trabajadas</strong> de los empleados. 
          Solo podrán marcar entrada y salida cuando estén dentro del radio máximo que configures desde tu establecimiento.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <MapPin className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-base font-semibold">Capturar Ubicación</span>
      </div>

      {/* Main Location Button */}
      <Button
        type="button"
        onClick={handleGetCurrentLocation}
        disabled={isLocating}
        className={cn(
          'relative w-full h-14 text-base font-medium transition-all duration-300 overflow-hidden',
          'bg-gradient-to-r from-primary via-primary to-secondary',
          'hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]',
          'border-0 text-primary-foreground',
          hasLocation && 'ring-2 ring-primary/50'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        {isLocating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Obteniendo ubicación...
          </>
        ) : (
          <>
            <Navigation className="w-5 h-5 mr-2" />
            {hasLocation ? 'Actualizar mi ubicación' : 'Usar mi ubicación actual'}
          </>
        )}
      </Button>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Location Confirmation */}
      {hasLocation && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground mb-1">
                Ubicación capturada
              </p>
              {isGeocoding ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Obteniendo dirección...
                </div>
              ) : (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {resolvedAddress || `${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground">
                  {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Radius Selection */}
      {showRadiusSlider && hasLocation && onRadiusChange && (
        <div className="space-y-3 p-4 rounded-xl bg-card/50 border border-border/50">
          <label className="text-sm font-medium text-foreground">
            Radio máximo de registro
          </label>
          
          <div className="grid grid-cols-3 gap-2">
            {RADIUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onRadiusChange(option.value)}
                className={cn(
                  'p-3 rounded-lg border-2 transition-all duration-200 text-center',
                  radius === option.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/50 hover:border-primary/50 hover:bg-primary/5'
                )}
              >
                <span className="text-lg font-bold block">{option.label}</span>
                <span className="text-[10px] text-muted-foreground leading-tight block mt-1">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
          
          <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">📌 Basado en estas coordenadas:</strong> Los empleados podrán registrar su entrada/salida solo si están a máximo <strong className="text-primary">{radius} metros</strong> de este punto.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
