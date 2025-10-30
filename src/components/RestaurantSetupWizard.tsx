import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building2, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

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
    address: "",
    latitude: "",
    longitude: "",
    location_radius: "100"
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
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          location_radius: parseInt(formData.location_radius)
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">¡Bienvenido a Conektao!</CardTitle>
          <CardDescription className="text-lg">
            Para comenzar, configura tu establecimiento
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert>
            <CheckCircle className="h-4 w-4" />
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_nit">NIT del establecimiento</Label>
              <Input
                id="business_nit"
                value={formData.business_nit}
                onChange={(e) => setFormData(prev => ({ ...prev, business_nit: e.target.value }))}
                placeholder="123456789-0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección completa del establecimiento"
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label>Ubicación GPS (opcional pero recomendado)</Label>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Para control de asistencia:</strong> Si configuras la ubicación GPS, tus empleados podrán marcar entrada y salida solo cuando estén en el establecimiento.
                  <br /><br />
                  <strong>Cómo obtener coordenadas:</strong>
                  <br />1. Ve a Google Maps
                  <br />2. Busca tu establecimiento
                  <br />3. Copia las coordenadas (ej: 19.4326, -99.1332)
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitud</Label>
                  <Input
                    id="latitude"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="19.432608"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitud</Label>
                  <Input
                    id="longitude"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="-99.133209"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius">Radio permitido (metros)</Label>
              <Input
                id="radius"
                type="number"
                value={formData.location_radius}
                onChange={(e) => setFormData(prev => ({ ...prev, location_radius: e.target.value }))}
                placeholder="100"
                min="10"
                max="1000"
              />
              <p className="text-sm text-muted-foreground">
                Los empleados podrán registrar entrada/salida dentro de este radio
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={loading}>
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