import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LocationPicker from "@/components/location/LocationPicker";

const RestaurantSetup = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    address: ""
  });

  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    radius: number;
  }>({
    latitude: null,
    longitude: null,
    radius: 100
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error de autenticación",
        description: "Debes iniciar sesión para crear un establecimiento",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.name) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa el nombre del establecimiento",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Crear el restaurante
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          owner_id: user.id,
          name: formData.name,
          address: formData.address,
          latitude: location.latitude,
          longitude: location.longitude,
          location_radius: location.radius
        })
        .select()
        .single();
      console.log(restaurant, restaurantError)

      if (restaurantError) throw restaurantError;

      // Crear/actualizar el perfil del propietario (evita duplicados)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            restaurant_id: restaurant.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || "Propietario",
            role: 'owner',
            is_active: true,
            permissions: {
              all_modules: true,
              manage_employees: true,
              view_reports: true,
              manage_inventory: true,
              manage_sales: true
            }
          },
          { onConflict: 'id' }
        );

      if (profileError) throw profileError;

      toast({
        title: "¡Establecimiento creado!",
        description: "Tu establecimiento ha sido configurado exitosamente"
      });

      await refreshProfile();
    } catch (error: any) {
      console.error("Error creating restaurant:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el establecimiento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number, address?: string) => {
    setLocation(prev => ({ ...prev, latitude: lat, longitude: lng }));
    if (address && !formData.address) {
      setFormData(prev => ({ ...prev, address }));
    }
  };

  const handleRadiusChange = (radius: number) => {
    setLocation(prev => ({ ...prev, radius }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl border-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.1)]">
        <CardHeader>
          <CardTitle className="text-2xl text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Configura tu Establecimiento
          </CardTitle>
          <CardDescription className="text-center">
            Como propietario, configura tu establecimiento. La ubicación GPS es opcional y puedes agregarla luego.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Establecimiento *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Establecimiento El Buen Sabor"
                required
                className="border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección completa del establecimiento"
                rows={2}
                className="border-border/50 focus:border-primary"
              />
            </div>

            <LocationPicker
              latitude={location.latitude}
              longitude={location.longitude}
              radius={location.radius}
              address={formData.address}
              onLocationChange={handleLocationChange}
              onRadiusChange={handleRadiusChange}
              showRadiusSlider={true}
              showMap={true}
            />

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-all" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creando establecimiento...
                </>
              ) : (
                "Crear Establecimiento"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantSetup;