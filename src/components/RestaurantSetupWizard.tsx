import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import LocationPicker from "@/components/location/LocationPicker";

interface RestaurantSetupWizardProps {
  onComplete: () => void;
}

const RestaurantSetupWizard = ({ onComplete }: RestaurantSetupWizardProps) => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    business_name: "",
    business_nit: "",
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
    setLoading(true);

    try {
      if (!user?.id) {
        throw new Error("Usuario no autenticado");
      }

      // Create the restaurant
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          owner_id: user.id,
          name: formData.business_name,
          nit: formData.business_nit,
          address: formData.address,
          latitude: location.latitude,
          longitude: location.longitude,
          location_radius: location.radius
        })
        .select()
        .single();

      if (restaurantError) throw restaurantError;

      // Update the user profile to owner with restaurant_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          restaurant_id: restaurant.id,
          role: 'owner',
          permissions: {
            all_modules: true,
            manage_employees: true,
            view_reports: true,
            manage_inventory: true,
            manage_sales: true
          }
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "¡Establecimiento creado exitosamente!",
        description: "Ya puedes empezar a usar todas las funcionalidades."
      });

      // Refresh the profile to update the context
      await refreshProfile();
      
      onComplete();

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

  const handleSkip = () => {
    toast({
      title: "Configuración omitida",
      description: "Puedes crear tu establecimiento más tarde desde el perfil."
    });
    onComplete();
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-2xl border-primary/20 shadow-[0_0_40px_hsl(var(--primary)/0.15)]">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
            <Building2 className="h-10 w-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ¡Bienvenido a Conektao!
          </CardTitle>
          <CardDescription className="text-lg">
            Para comenzar, configura tu establecimiento
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <AlertDescription>
              <strong>¡Tu cuenta ya está lista!</strong> Ahora solo necesitas configurar tu establecimiento para acceder a todas las funcionalidades como gestión de empleados, inventario, ventas y más.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="business_name">Nombre del establecimiento *</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Ej: Restaurante El Buen Sabor"
                required
                className="border-border/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_nit">NIT del establecimiento</Label>
              <Input
                id="business_nit"
                value={formData.business_nit}
                onChange={(e) => setFormData(prev => ({ ...prev, business_nit: e.target.value }))}
                placeholder="123456789-0"
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
            />

            <div className="flex gap-4">
              <Button 
                type="submit" 
                className="flex-1 h-12 bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-all" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creando establecimiento...
                  </>
                ) : (
                  "Crear mi establecimiento"
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSkip}
                disabled={loading}
                className="border-border/50 hover:border-primary"
              >
                Configurar después
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantSetupWizard;