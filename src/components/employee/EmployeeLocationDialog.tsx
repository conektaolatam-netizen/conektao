import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Loader2, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: string;
  full_name: string;
  work_latitude?: number;
  work_longitude?: number;
  work_address?: string;
  location_radius?: number;
}

interface EmployeeLocationDialogProps {
  employee: Employee | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EmployeeLocationDialog = ({
  employee,
  isOpen,
  onOpenChange,
  onSuccess
}: EmployeeLocationDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    latitude: "",
    longitude: "",
    address: "",
    radius: "100"
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        latitude: employee.work_latitude?.toString() || "",
        longitude: employee.work_longitude?.toString() || "",
        address: employee.work_address || "",
        radius: employee.location_radius?.toString() || "100"
      });
    }
  }, [employee]);

  const getCurrentLocation = () => {
    setGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocalización no disponible en este dispositivo",
        variant: "destructive"
      });
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
        
        // Obtener dirección usando reverse geocoding (opcional)
        reverseGeocode(position.coords.latitude, position.coords.longitude);
        setGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast({
          title: "Error",
          description: "No se pudo obtener la ubicación actual",
          variant: "destructive"
        });
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Usar un servicio de geocodificación inversa gratuito
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`
      );
      const data = await response.json();
      
      if (data.locality || data.city) {
        setFormData(prev => ({
          ...prev,
          address: `${data.locality || data.city}, ${data.countryName || ''}`
        }));
      }
    } catch (error) {
      console.log("Could not get address from coordinates");
    }
  };

  const handleSave = async () => {
    if (!employee) return;

    if (!formData.latitude || !formData.longitude) {
      toast({
        title: "Error",
        description: "Debes establecer las coordenadas de ubicación",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          work_latitude: parseFloat(formData.latitude),
          work_longitude: parseFloat(formData.longitude),
          work_address: formData.address || null,
          location_radius: parseInt(formData.radius) || 100
        })
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: "Ubicación actualizada",
        description: `Ubicación de trabajo establecida para ${employee.full_name}`
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating location:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la ubicación",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = async () => {
    if (!employee) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          work_latitude: null,
          work_longitude: null,
          work_address: null,
          location_radius: 100
        })
        .eq('id', employee.id);

      if (error) throw error;

      setFormData({
        latitude: "",
        longitude: "",
        address: "",
        radius: "100"
      });

      toast({
        title: "Ubicación eliminada",
        description: `Ubicación de trabajo eliminada para ${employee.full_name}`
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error clearing location:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la ubicación",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación de Trabajo - {employee.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="latitude">Latitud</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                placeholder="19.4326"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitud</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                placeholder="-99.1332"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Dirección (opcional)</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Calle, colonia, ciudad..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="radius">Radio permitido (metros)</Label>
            <Input
              id="radius"
              type="number"
              value={formData.radius}
              onChange={(e) => setFormData(prev => ({ ...prev, radius: e.target.value }))}
              placeholder="100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Distancia máxima para marcar entrada/salida
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="w-full"
          >
            {gettingLocation ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Target className="h-4 w-4 mr-2" />
            )}
            Usar Ubicación Actual
          </Button>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Guardar Ubicación
            </Button>
            
            {(formData.latitude || formData.longitude) && (
              <Button
                variant="outline"
                onClick={clearLocation}
                disabled={loading}
              >
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeLocationDialog;