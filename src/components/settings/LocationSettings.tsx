import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Navigation, Loader2, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import SettingsHeader from "./SettingsHeader";
import SettingsSection from "./SettingsSection";
import LocationPicker from "@/components/location/LocationPicker";
import useSettingsAudit from "@/hooks/useSettingsAudit";
import { cn } from "@/lib/utils";

interface LocationSettingsProps {
  onBack: () => void;
}

const LocationSettings = ({ onBack }: LocationSettingsProps) => {
  const { profile, restaurant, refreshProfile } = useAuth();
  const { logSettingsChange } = useSettingsAudit();
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    radius: number;
  }>({
    latitude: restaurant?.latitude || null,
    longitude: restaurant?.longitude || null,
    radius: restaurant?.location_radius ?? 100,
  });

  const [originalLocation, setOriginalLocation] = useState(location);

  useEffect(() => {
    const loc = {
      latitude: restaurant?.latitude || null,
      longitude: restaurant?.longitude || null,
      radius: restaurant?.location_radius ?? 100,
    };
    setLocation(loc);
    setOriginalLocation(loc);
  }, [restaurant]);

  useEffect(() => {
    setIsDirty(JSON.stringify(location) !== JSON.stringify(originalLocation));
  }, [location, originalLocation]);

  const handleCapture = () => {
    setCapturing(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          setCapturing(false);
          toast.success("Ubicación capturada");
        },
        (error) => {
          setCapturing(false);
          toast.error("No se pudo obtener la ubicación: " + error.message);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setCapturing(false);
      toast.error("Tu navegador no soporta geolocalización");
    }
  };

  const handleSave = async () => {
    if (profile?.role !== "owner") {
      toast.error("Solo el propietario puede modificar la ubicación");
      return;
    }

    if (!restaurant?.id) return;

    setLoading(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          location_radius: location.radius,
        })
        .eq("id", restaurant.id);

      if (error) throw error;

      await logSettingsChange({
        section: 'location',
        action: 'update',
        before: originalLocation,
        after: location,
      });

      await refreshProfile();
      setOriginalLocation(location);
      setSuccess(true);
      toast.success("Ubicación guardada ✓");

      setTimeout(() => setSuccess(false), 2000);
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = profile?.role === "owner";

  return (
    <div className="flex flex-col h-full bg-background">
      <SettingsHeader title="Ubicación" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Info Card */}
        <div className="mb-4 p-4 rounded-xl bg-secondary/10 border border-secondary/20">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Control de Asistencia</p>
              <p className="text-xs text-muted-foreground mt-1">
                Esta ubicación se usa para verificar que los empleados marquen entrada/salida
                desde el establecimiento.
              </p>
            </div>
          </div>
        </div>

        {!isOwner && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-500">
              Solo el propietario puede modificar la ubicación
            </p>
          </div>
        )}

        <SettingsSection>
          <div className="p-4 space-y-5">
            {/* Capture Button */}
            <Button
              type="button"
              onClick={handleCapture}
              disabled={capturing || !isOwner}
              variant="outline"
              className="w-full h-12 gap-2"
            >
              {capturing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Navigation className="h-5 w-5" />
              )}
              {capturing ? "Capturando..." : "Capturar mi ubicación actual"}
            </Button>

            {/* Map */}
            <div className="rounded-xl overflow-hidden border border-border/30">
              <LocationPicker
                latitude={location.latitude}
                longitude={location.longitude}
                radius={location.radius}
                onLocationChange={(lat, lng) =>
                  setLocation((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                }
                onRadiusChange={(radius) => setLocation((prev) => ({ ...prev, radius }))}
                showRadiusSlider={true}
              />
            </div>

            {/* Current coordinates */}
            {location.latitude && location.longitude && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Coordenadas:</span>
                  <span className="font-mono text-xs">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="text-muted-foreground ml-6">Radio permitido:</span>
                  <span className="font-medium">{location.radius}m</span>
                </div>
              </div>
            )}
          </div>
        </SettingsSection>

        {/* Save Button */}
        {isOwner && (
          <div className="mt-6">
            <Button
              onClick={handleSave}
              disabled={loading || !isDirty}
              className={cn(
                "w-full h-12 text-base font-medium",
                "bg-gradient-to-r from-primary to-primary/80",
                "hover:shadow-lg hover:shadow-primary/30",
                "transition-all duration-300",
                success && "bg-green-500 from-green-500 to-green-600"
              )}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : success ? (
                <span className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Guardado
                </span>
              ) : (
                "Guardar ubicación"
              )}
            </Button>
            {!isDirty && !loading && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                No hay cambios pendientes
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSettings;
