import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Clock, Building2, User, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InvitationData {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'employee';
  status: string;
  expires_at: string;
  restaurant: {
    id: string;
    name: string;
    address: string | null;
  };
  invited_by: string;
  inviter_name?: string;
}

const InvitationAccept = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const token = new URLSearchParams(location.search).get('token');

  useEffect(() => {
    if (token) {
      loadInvitation();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadInvitation = async () => {
    try {
      // Limpiar invitaciones expiradas primero
      await supabase.rpc('cleanup_expired_invitations');
      
      const { data, error } = await supabase
        .from('restaurant_invitations')
        .select(`
          id,
          email,
          role,
          status,
          expires_at,
          invited_by,
          restaurant:restaurants(id, name, address)
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single();

      if (data) {
        // Obtener el nombre del invitador
        const { data: inviterData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.invited_by)
          .single();
        
        (data as any).inviter_name = inviterData?.full_name || 'Administrador';
      }

      if (error) {
        console.error('Error loading invitation:', error);
        return;
      }

      setInvitation(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) {
      toast({
        title: "Error",
        description: "Debes estar logueado para aceptar la invitación",
        variant: "destructive"
      });
      return;
    }

    // Verificar que el email del usuario coincide con el de la invitación
    if (user.email !== invitation.email) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión con el email al que se envió la invitación",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      // Marcar invitación como aceptada
      const { error: invitationError } = await supabase
        .from('restaurant_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (invitationError) throw invitationError;

      // Actualizar el perfil del usuario
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          restaurant_id: invitation.restaurant.id,
          role: invitation.role,
          is_active: true
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Refrescar el perfil en el contexto
      await refreshProfile();

      toast({
        title: "¡Invitación aceptada!",
        description: `Te has unido exitosamente a ${invitation.restaurant.name}`,
      });

      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo aceptar la invitación",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectInvitation = async () => {
    if (!invitation) return;

    setProcessing(true);

    try {
      const { error } = await supabase
        .from('restaurant_invitations')
        .update({ status: 'rejected' })
        .eq('id', invitation.id);

      if (error) throw error;

      toast({
        title: "Invitación rechazada",
        description: "Has rechazado la invitación",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error rejecting invitation:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar la invitación",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando invitación...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Invitación no válida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              La invitación no existe, ha expirado o ya ha sido procesada.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(invitation.expires_at) < new Date();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Building2 className="h-6 w-6" />
            Invitación a Conektao
          </CardTitle>
          <CardDescription>
            Has sido invitado a unirte a un equipo
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isExpired ? (
            <Alert variant="destructive">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Esta invitación ha expirado. Contacta al administrador para recibir una nueva invitación.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border">
                <h3 className="font-semibold text-lg mb-2">
                  {invitation.restaurant.name}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Invitado por: {invitation.inviter_name || 'Administrador'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Para: {invitation.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Rol: {invitation.role === 'employee' ? 'Empleado' : 'Administrador'}</span>
                  </div>
                  {invitation.restaurant.address && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{invitation.restaurant.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {!user ? (
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Debes iniciar sesión o crear una cuenta para aceptar esta invitación.
                    </AlertDescription>
                  </Alert>
                  <div className="flex flex-col gap-2">
                    <Button onClick={() => navigate('/auth?mode=login')} className="w-full">
                      Iniciar Sesión
                    </Button>
                    <Button onClick={() => navigate('/auth?mode=register')} variant="outline" className="w-full">
                      Crear Cuenta
                    </Button>
                  </div>
                </div>
              ) : user.email !== invitation.email ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Debes iniciar sesión con el email {invitation.email} para aceptar esta invitación.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handleAcceptInvitation} 
                    disabled={processing}
                    className="w-full"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aceptar Invitación
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleRejectInvitation} 
                    disabled={processing}
                    variant="outline"
                    className="w-full"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar Invitación
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="text-xs text-muted-foreground text-center">
                Esta invitación expira el {new Date(invitation.expires_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvitationAccept;