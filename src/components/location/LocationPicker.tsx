import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Map, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import LocationMap from './LocationMap';

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  radius?: number;
  address?: string;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
  onRadiusChange?: (radius: number) => void;
  showRadiusSlider?: boolean;
  showMap?: boolean;
  mapboxToken?: string;
  className?: string;
}

const LocationPicker = ({
  latitude,
  longitude,
  radius = 100,
  address,
  onLocationChange,
  onRadiusChange,
  showRadiusSlider = true,
  showMap = true,
  mapboxToken,
  className
}: LocationPickerProps) => {
  const [isLocating, setIsLocating] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(address || '');
  const [localRadius, setLocalRadius] = useState(radius);
  const [locationConfirmed, setLocationConfirmed] = useState(!!latitude && !!longitude);

  useEffect(() => {
    setLocalRadius(radius);
  }, [radius]);

  useEffect(() => {
    setLocationConfirmed(!!latitude && !!longitude);
  }, [latitude, longitude]);

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken || 'pk.placeholder'}&language=es`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
    }
    return null;
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está disponible en este dispositivo');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        let addr = '';
        if (mapboxToken) {
          addr = await reverseGeocode(lat, lng) || '';
          setCurrentAddress(addr);
        }
        
        onLocationChange(lat, lng, addr);
        setLocationConfirmed(true);
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsLocating(false);
        alert('No se pudo obtener la ubicación. Verifica los permisos del navegador.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  const handleMapLocationChange = (lat: number, lng: number) => {
    onLocationChange(lat, lng, currentAddress);
    setLocationConfirmed(true);
  };

  const handleRadiusChange = (value: number[]) => {
    const newRadius = value[0];
    setLocalRadius(newRadius);
    onRadiusChange?.(newRadius);
  };

  const formatRadius = (r: number) => {
    if (r >= 1000) return `${(r / 1000).toFixed(1)} km`;
    return `${r} m`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <MapPin className="h-4 w-4 text-primary-foreground" />
        </div>
        <Label className="text-base font-semibold">Ubicación del Establecimiento</Label>
      </div>

      {/* Action Buttons */}
      <div className="grid gap-3">
        {/* Use Current Location Button */}
        <Button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className={cn(
            "relative w-full h-14 overflow-hidden transition-all duration-300",
            "bg-gradient-to-r from-primary via-primary to-secondary",
            "hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]",
            "border-0 text-primary-foreground font-medium"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          {isLocating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Obteniendo ubicación...
            </>
          ) : (
            <>
              <Navigation className="h-5 w-5 mr-2" />
              Usar mi ubicación actual
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">o</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Open Map Button */}
        {showMap && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowMapView(!showMapView)}
            className={cn(
              "w-full h-14 transition-all duration-300",
              "border-2 border-dashed hover:border-solid",
              "hover:border-secondary hover:bg-secondary/10",
              showMapView && "border-secondary bg-secondary/10"
            )}
          >
            <Map className="h-5 w-5 mr-2" />
            {showMapView ? 'Ocultar mapa' : 'Seleccionar en el mapa'}
          </Button>
        )}
      </div>

      {/* Map View */}
      {showMap && showMapView && (
        <div className="relative rounded-xl overflow-hidden border-2 border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
          <LocationMap
            latitude={latitude || 4.7110}
            longitude={longitude || -74.0721}
            radius={localRadius}
            onLocationChange={handleMapLocationChange}
            mapboxToken={mapboxToken}
          />
        </div>
      )}

      {/* Radius Slider */}
      {showRadiusSlider && (
        <div className="space-y-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Radio de cobertura</Label>
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {formatRadius(localRadius)}
            </span>
          </div>
          <div className="relative pt-2">
            <Slider
              value={[localRadius]}
              onValueChange={handleRadiusChange}
              min={10}
              max={500}
              step={10}
              className="cursor-pointer"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>10m</span>
              <span>250m</span>
              <span>500m</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Los empleados podrán registrar entrada/salida dentro de este radio
          </p>
        </div>
      )}

      {/* Location Confirmation */}
      {locationConfirmed && latitude && longitude && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-500">Ubicación capturada</p>
            {currentAddress && (
              <p className="text-sm text-muted-foreground truncate">{currentAddress}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}
            </p>
          </div>
        </div>
      )}

      {/* No Mapbox Token Warning */}
      {showMap && !mapboxToken && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-500">Mapa no disponible</p>
            <p className="text-muted-foreground mt-1">
              Para usar el mapa interactivo, configura tu token de Mapbox en los secretos del proyecto.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
