import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, Mail, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'employee';
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
  expires_at: string;
}

const RestaurantManagement = () => {
  const { user, profile, restaurant } = useAuth();
  const { toast } = useToast();
  const [isCreatingRestaurant, setIsCreatingRestaurant] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [isInviting, setIsInviting] = useState(false);
  
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    address: '',
    nit: ''
  });

  useEffect(() => {
    if (restaurant?.id && profile?.role === 'owner') {
      loadInvitations();
    }
  }, [restaurant, profile]);


  const loadInvitations = async () => {
    if (!restaurant?.id) return;

    try {
      const { data, error } = await supabase
        .from('restaurant_invitations')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations((data || []) as Invitation[]);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error de autenticación",
        description: "Debes iniciar sesión para crear un establecimiento",
        variant: "destructive"
      });
      return;
    }

    if (!restaurantData.name.trim()) {
      toast({
        title: "Error de validación",
        description: "El nombre del establecimiento es requerido",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingRestaurant(true);

    try {
      // Create restaurant
      const { data: restaurantResult, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({
          name: restaurantData.name,
          address: restaurantData.address,
          nit: restaurantData.nit,
          owner_id: user.id
        })
        .select()
        .single();

      if (restaurantError) throw restaurantError;

      // Update user profile to link to restaurant as owner
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          restaurant_id: restaurantResult.id,
          role: 'owner'
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "¡Establecimiento creado!",
        description: `${restaurantData.name} ha sido creado exitosamente`,
      });

      // Reset form
      setRestaurantData({ name: '', address: '', nit: '' });
      
      // Refresh page to update context
      window.location.reload();

    } catch (error: any) {
      console.error('Error creating restaurant:', error);
      toast({
        title: "Error al crear establecimiento",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsCreatingRestaurant(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurant?.id || !user?.id) {
      toast({
        title: "Error",
        description: "Debes tener un establecimiento para enviar invitaciones",
        variant: "destructive"
      });
      return;
    }

    if (!inviteEmail.trim()) {
      toast({
        title: "Error de validación",
        description: "El email es requerido",
        variant: "destructive"
      });
      return;
    }

    if (user?.email && inviteEmail.trim().toLowerCase() === user.email.toLowerCase()) {
      toast({
        title: "No permitido",
        description: "No puedes invitarte a ti mismo",
        variant: "destructive"
      });
      return;
    }

    setIsInviting(true);

    try {
      // Generate unique token
      const token = crypto.randomUUID();

      // Create invitation record
      const { error: invitationError } = await supabase
        .from('restaurant_invitations')
        .insert({
          email: inviteEmail,
          restaurant_id: restaurant.id,
          invited_by: user.id,
          role: inviteRole as 'owner' | 'admin' | 'employee',
          token: token
        });

      if (invitationError) throw invitationError;

      // Send invitation email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: inviteEmail,
          restaurantName: restaurant.name,
          inviterName: profile?.full_name || 'Administrador',
          role: inviteRole,
          token: token,
          siteUrl: window.location.origin
        }
      });

      if (emailError) throw emailError;

      toast({
        title: "¡Invitación enviada!",
        description: `Se ha enviado una invitación a ${inviteEmail}`,
      });

      // Reset form and reload invitations
      setInviteEmail('');
      setInviteRole('employee');
      loadInvitations();

    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error al enviar invitación",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Si el usuario no tiene establecimiento, mostrar formulario para crear
  if (!restaurant && profile?.role !== 'owner') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Building2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Crear Establecimiento</h1>
            <p className="text-muted-foreground">
              Configura tu establecimiento para comenzar a usar Conektao
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Información del Establecimiento</CardTitle>
              <CardDescription>
                Ingresa los datos básicos de tu establecimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRestaurant} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Establecimiento *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ej: Restaurante La Cocina"
                    value={restaurantData.name}
                    onChange={(e) => setRestaurantData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Ej: Calle 123 #45-67, Bogotá"
                    value={restaurantData.address}
                    onChange={(e) => setRestaurantData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nit">NIT (Opcional)</Label>
                  <Input
                    id="nit"
                    type="text"
                    placeholder="Ej: 123456789-1"
                    value={restaurantData.nit}
                    onChange={(e) => setRestaurantData(prev => ({ ...prev, nit: e.target.value }))}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isCreatingRestaurant}
                >
                  {isCreatingRestaurant ? "Creando..." : "Crear Establecimiento"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Si ya tiene establecimiento, mostrar gestión de invitaciones
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Gestión del Establecimiento</h1>
          <p className="text-muted-foreground">
            {restaurant?.name || 'Mi Establecimiento'}
          </p>
        </div>

        {/* Invite Users Section */}
        {profile?.role === 'owner' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Invitar Empleados
              </CardTitle>
              <CardDescription>
                Envía invitaciones por correo electrónico para que otros se unan a tu establecimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email del empleado</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="empleado@ejemplo.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Empleado</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isInviting}
                    >
                      {isInviting ? "Enviando..." : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar Invitación
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Invitations List */}
        {profile?.role === 'owner' && invitations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Invitaciones Enviadas</CardTitle>
              <CardDescription>
                Estado de las invitaciones enviadas a empleados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div 
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Rol: {invitation.role === 'employee' ? 'Empleado' : 'Administrador'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(invitation.status)}>
                        {getStatusIcon(invitation.status)}
                        <span className="ml-1">
                          {invitation.status === 'pending' ? 'Pendiente' :
                           invitation.status === 'accepted' ? 'Aceptada' :
                           invitation.status === 'rejected' ? 'Rechazada' : 'Expirada'}
                        </span>
                      </Badge>
                      
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Enviada: {new Date(invitation.created_at).toLocaleDateString()}</p>
                        <p>Expira: {new Date(invitation.expires_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RestaurantManagement;