import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Settings, 
  Target, 
  CreditCard, 
  Shield, 
  User, 
  Building,
  DollarSign,
  Percent,
  Mail,
  Phone,
  Lock,
  MapPin
} from "lucide-react";
import LocationPicker from "@/components/location/LocationPicker";

interface ProfileControlCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MonthlyTarget {
  id?: string;
  month: number;
  year: number;
  target_amount: number;
}

interface SubscriptionSettings {
  plan_type: string;
  billing_cycle: string;
  auto_renew: boolean;
  service_charge_enabled: boolean;
  service_charge_percentage: number;
  expires_at?: string;
}

const ProfileControlCenter = ({ open, onOpenChange }: ProfileControlCenterProps) => {
  const { user, profile, restaurant, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile data
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || "",
    email: user?.email || "",
    phone: profile?.phone || "",
  });
  
  // Restaurant data
  const [restaurantData, setRestaurantData] = useState({
    name: restaurant?.name || "",
    address: restaurant?.address || "",
    nit: (restaurant as any)?.nit || "",
  });
  
  // Estado para ubicación del restaurante (GPS y radio)
  const [restaurantLocation, setRestaurantLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    radius: number;
  }>({
    latitude: restaurant?.latitude || null,
    longitude: restaurant?.longitude || null,
    radius: restaurant?.location_radius ?? 100,
  });
  
  // Monthly targets
  const [monthlyTargets, setMonthlyTargets] = useState<MonthlyTarget[]>([]);
  const [newTarget, setNewTarget] = useState<MonthlyTarget>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    target_amount: 0
  });
  
  // Subscription settings
  const [subscriptionSettings, setSubscriptionSettings] = useState<SubscriptionSettings>({
    plan_type: "basic",
    billing_cycle: "monthly",
    auto_renew: true,
    service_charge_enabled: false,
    service_charge_percentage: 0,
  });

  // Tip settings
  const [tipSettings, setTipSettings] = useState({
    tip_enabled: false,
    default_tip_percentage: 10.00
  });
  
  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (open && user && restaurant) {
      loadMonthlyTargets();
      loadSubscriptionSettings();
      loadTipSettings();
      // Sincronizar ubicación actual del restaurante en el formulario
      setRestaurantLocation({
        latitude: restaurant.latitude || null,
        longitude: restaurant.longitude || null,
        radius: restaurant.location_radius ?? 100,
      });
    }
  }, [open, user, restaurant]);

  const loadMonthlyTargets = async () => {
    try {
      const { data, error } = await supabase
        .from("monthly_sales_targets")
        .select("*")
        .eq("restaurant_id", restaurant?.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (error) throw error;
      setMonthlyTargets(data || []);
    } catch (error) {
      console.error("Error loading monthly targets:", error);
    }
  };

  const loadSubscriptionSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_settings")
        .select("*")
        .eq("restaurant_id", restaurant?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      if (data) {
        setSubscriptionSettings(data);
      }
    } catch (error) {
      console.error("Error loading subscription settings:", error);
    }
  };

  const loadTipSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("tip_enabled, default_tip_percentage")
        .eq("id", restaurant?.id)
        .single();

      if (error) throw error;
      if (data) {
        setTipSettings({
          tip_enabled: data.tip_enabled || false,
          default_tip_percentage: data.default_tip_percentage || 10.00
        });
      }
    } catch (error) {
      console.error("Error loading tip settings:", error);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          phone: profileData.phone,
        })
        .eq("id", user?.id);

      if (error) throw error;

      // Update email if changed
      if (profileData.email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileData.email,
        });
        if (emailError) throw emailError;
      }

      toast.success("Perfil actualizado correctamente");
    } catch (error: any) {
      toast.error("Error al actualizar perfil: " + error.message);
    }
    setLoading(false);
  };

  const handleUpdateRestaurant = async () => {
    if (profile?.role !== "owner") return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          name: restaurantData.name,
          address: restaurantData.address,
        })
        .eq("id", restaurant?.id);

      if (error) throw error;
       toast.success("Datos del restaurante actualizados");
     } catch (error: any) {
       toast.error("Error al actualizar restaurante: " + error.message);
     }
     setLoading(false);
   };
 
   // Handle location change from LocationPicker
   const handleLocationPickerChange = (lat: number, lng: number) => {
     setRestaurantLocation(prev => ({
       ...prev,
       latitude: lat,
       longitude: lng,
     }));
   };

   const handleRadiusPickerChange = (radius: number) => {
     setRestaurantLocation(prev => ({
       ...prev,
       radius,
     }));
   };
 
   // Guardar la ubicación del restaurante en la base de datos
   const handleSaveRestaurantLocation = async () => {
     if (!restaurant?.id) return;
     setLoading(true);
     try {
       const { error } = await supabase
         .from("restaurants")
         .update({
           latitude: restaurantLocation.latitude,
           longitude: restaurantLocation.longitude,
           location_radius: restaurantLocation.radius,
         })
         .eq("id", restaurant.id);
       if (error) throw error;
       toast.success("Ubicación del establecimiento guardada");
       await refreshProfile();
     } catch (error: any) {
       toast.error("Error al guardar ubicación: " + error.message);
     }
     setLoading(false);
   };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;
      toast.success("Contraseña actualizada correctamente");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error("Error al cambiar contraseña: " + error.message);
    }
    setLoading(false);
  };

  const handleSaveTarget = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("monthly_sales_targets")
        .upsert({
          user_id: user?.id,
          restaurant_id: restaurant?.id,
          month: newTarget.month,
          year: newTarget.year,
          target_amount: newTarget.target_amount,
        });

      if (error) throw error;
      toast.success("Objetivo mensual guardado");
      loadMonthlyTargets();
      setNewTarget({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        target_amount: 0
      });
    } catch (error: any) {
      toast.error("Error al guardar objetivo: " + error.message);
    }
    setLoading(false);
  };

  const handleUpdateSubscription = async () => {
    if (profile?.role !== "owner") return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("subscription_settings")
        .upsert({
          restaurant_id: restaurant?.id,
          ...subscriptionSettings,
        });

      if (error) throw error;
      toast.success("Configuración de suscripción actualizada");
    } catch (error: any) {
      toast.error("Error al actualizar suscripción: " + error.message);
    }
    setLoading(false);
  };

  const handleUpdateTipSettings = async () => {
    if (profile?.role !== "owner") return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          tip_enabled: tipSettings.tip_enabled,
          default_tip_percentage: tipSettings.default_tip_percentage,
        })
        .eq("id", restaurant?.id);

      if (error) throw error;
      toast.success("Configuración de propinas actualizada");
    } catch (error: any) {
      toast.error("Error al actualizar propinas: " + error.message);
    }
    setLoading(false);
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Centro de Control del Perfil
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="targets" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Objetivos
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Suscripción
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Propinas
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Seguridad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Nombre Completo</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Rol</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={profile?.role === "owner" ? "default" : "secondary"}>
                        {profile?.role === "owner" ? "Propietario" : 
                         profile?.role === "admin" ? "Administrador" : "Empleado"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button onClick={handleUpdateProfile} disabled={loading}>
                  Actualizar Perfil
                </Button>
              </CardContent>
            </Card>

            {profile?.role === "owner" && (
               <>
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <Building className="h-5 w-5" />
                       Información del Restaurante
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="restaurant_name">Nombre del Establecimiento</Label>
                         <Input
                           id="restaurant_name"
                           value={restaurantData.name}
                           onChange={(e) => setRestaurantData(prev => ({ ...prev, name: e.target.value }))}
                         />
                       </div>
                       <div>
                         <Label htmlFor="nit">NIT (opcional)</Label>
                         <Input
                           id="nit"
                           value={restaurantData.nit}
                           onChange={(e) => setRestaurantData(prev => ({ ...prev, nit: e.target.value }))}
                           disabled
                           placeholder="Funcionalidad próximamente"
                         />
                       </div>
                       <div className="col-span-2">
                         <Label htmlFor="address">Dirección</Label>
                         <Input
                           id="address"
                           value={restaurantData.address}
                           onChange={(e) => setRestaurantData(prev => ({ ...prev, address: e.target.value }))}
                         />
                       </div>
                     </div>
                     <Button onClick={handleUpdateRestaurant} disabled={loading}>
                       Actualizar Restaurante
                     </Button>
                   </CardContent>
                 </Card>

                 <Card className="border-primary/20">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <MapPin className="h-5 w-5 text-primary" />
                       Ubicación del Establecimiento
                     </CardTitle>
                     <CardDescription>
                       Define la ubicación y radio para el control de asistencia de empleados
                     </CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <LocationPicker
                       latitude={restaurantLocation.latitude}
                       longitude={restaurantLocation.longitude}
                       radius={restaurantLocation.radius}
                       onLocationChange={handleLocationPickerChange}
                       onRadiusChange={handleRadiusPickerChange}
                       showRadiusSlider={true}
                     />
                     <Button 
                       type="button" 
                       onClick={handleSaveRestaurantLocation} 
                       disabled={loading}
                       className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                     >
                       Guardar ubicación
                     </Button>
                   </CardContent>
                 </Card>
               </>
             )}
          </TabsContent>

          <TabsContent value="targets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Objetivos de Ventas Mensuales
                </CardTitle>
                <CardDescription>
                  Establece y modifica tus metas de ventas mensuales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="target_month">Mes</Label>
                    <select
                      id="target_month"
                      className="w-full p-2 border rounded-md"
                      value={newTarget.month}
                      onChange={(e) => setNewTarget(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    >
                      {monthNames.map((month, index) => (
                        <option key={index} value={index + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="target_year">Año</Label>
                    <Input
                      id="target_year"
                      type="number"
                      value={newTarget.year}
                      onChange={(e) => setNewTarget(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="target_amount" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Objetivo ($)
                    </Label>
                    <Input
                      id="target_amount"
                      type="number"
                      value={newTarget.target_amount}
                      onChange={(e) => setNewTarget(prev => ({ ...prev, target_amount: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>
                <Button onClick={handleSaveTarget} disabled={loading}>
                  Guardar Objetivo
                </Button>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Objetivos Actuales</h4>
                  {monthlyTargets.map((target) => (
                    <div key={`${target.year}-${target.month}`} className="flex justify-between items-center p-3 border rounded-lg">
                      <span>{monthNames[target.month - 1]} {target.year}</span>
                      <Badge variant="outline">${target.target_amount.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Plan de Membresía Conektao
                </CardTitle>
                <CardDescription>
                  Gestiona tu suscripción y configuraciones de cobro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Plan Actual</Label>
                    <select
                      className="w-full p-2 border rounded-md mt-1"
                      value={subscriptionSettings.plan_type}
                      onChange={(e) => setSubscriptionSettings(prev => ({ ...prev, plan_type: e.target.value }))}
                    >
                      <option value="basic">Básico</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Empresarial</option>
                    </select>
                  </div>
                  <div>
                    <Label>Ciclo de Facturación</Label>
                    <select
                      className="w-full p-2 border rounded-md mt-1"
                      value={subscriptionSettings.billing_cycle}
                      onChange={(e) => setSubscriptionSettings(prev => ({ ...prev, billing_cycle: e.target.value }))}
                    >
                      <option value="monthly">Mensual</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Renovación Automática</Label>
                    <p className="text-sm text-muted-foreground">Renovar automáticamente la suscripción</p>
                  </div>
                  <Switch
                    checked={subscriptionSettings.auto_renew}
                    onCheckedChange={(checked) => setSubscriptionSettings(prev => ({ ...prev, auto_renew: checked }))}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Habilitar Cobro de Servicio</Label>
                      <p className="text-sm text-muted-foreground">Agregar porcentaje de servicio a las facturas</p>
                    </div>
                    <Switch
                      checked={subscriptionSettings.service_charge_enabled}
                      onCheckedChange={(checked) => setSubscriptionSettings(prev => ({ ...prev, service_charge_enabled: checked }))}
                    />
                  </div>

                  {subscriptionSettings.service_charge_enabled && (
                    <div>
                      <Label htmlFor="service_percentage" className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Porcentaje de Servicio (%)
                      </Label>
                      <Input
                        id="service_percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={subscriptionSettings.service_charge_percentage}
                        onChange={(e) => setSubscriptionSettings(prev => ({ ...prev, service_charge_percentage: parseFloat(e.target.value) }))}
                      />
                    </div>
                  )}
                </div>

                {profile?.role === "owner" && (
                  <Button onClick={handleUpdateSubscription} disabled={loading}>
                    Actualizar Configuración
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tips" className="space-y-6">
            {profile?.role === "owner" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Configuración de Propinas
                  </CardTitle>
                  <CardDescription>
                    Configura el sistema de propinas para tu restaurante
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="tip-enabled" className="text-sm font-medium">
                        Activar propinas voluntarias
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Permite que los clientes dejen propina al personal
                      </p>
                    </div>
                    <Switch
                      id="tip-enabled"
                      checked={tipSettings.tip_enabled}
                      onCheckedChange={(checked) => 
                        setTipSettings(prev => ({ ...prev, tip_enabled: checked }))
                      }
                    />
                  </div>

                  {tipSettings.tip_enabled && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tip-percentage">
                          Porcentaje de propina por defecto
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            id="tip-percentage"
                            type="number"
                            value={tipSettings.default_tip_percentage}
                            onChange={(e) => 
                              setTipSettings(prev => ({ 
                                ...prev, 
                                default_tip_percentage: parseFloat(e.target.value) || 0 
                              }))
                            }
                            min="0"
                            max="50"
                            step="0.5"
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Por ley es 10%, pero puedes ajustarlo según tu negocio (ej: 5%, 8%, 12%)
                        </p>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">
                          ¿Cómo funciona?
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Los meseros y cajeros pueden ajustar la propina al cobrar</li>
                          <li>• El cliente puede dar más o menos del porcentaje sugerido</li>
                          <li>• Hay una opción "No dio propina" para casos sin propina</li>
                          <li>• La propina se suma automáticamente al total de la cuenta</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleUpdateTipSettings} disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Configuración"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Cambiar Contraseña
                </CardTitle>
                <CardDescription>
                  Actualiza tu contraseña para mantener tu cuenta segura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current_password">Contraseña Actual</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="new_password">Nueva Contraseña</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm_password">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={loading}>
                  Cambiar Contraseña
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileControlCenter;