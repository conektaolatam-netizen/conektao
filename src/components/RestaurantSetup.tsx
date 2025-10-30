import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const RestaurantSetup = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    location_radius: "100"
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
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          location_radius: formData.location_radius ? parseInt(formData.location_radius) : 100
        })
        .select()
        .single();
      console.log(restaurant,restaurantError)

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Configura tu Establecimiento</CardTitle>
          <CardDescription className="text-center">
            Como propietario, configura tu establecimiento. La ubicación GPS es opcional y puedes agregarla luego.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              La ubicación será utilizada para verificar que los empleados registren su entrada/salida desde el lugar de trabajo.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Establecimiento *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Establecimiento El Buen Sabor"
                required
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
              <Label>Ubicación GPS (opcional)</Label>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Puedes agregar la ubicación ahora o más tarde en la configuración del restaurante.
                  <br />Si deseas agregarla ahora:
                  <br />1. Ve a Google Maps en tu navegador
                  <br />2. Busca tu establecimiento o haz clic en la ubicación exacta
                  <br />3. Copia las coordenadas que aparecen (ejemplo: 19.4326, -99.1332)
                  <br />4. Ingresa los valores en los campos de abajo
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
                Los empleados podrán registrar entrada/salida dentro de este radio desde la ubicación establecida
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
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