import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Building2, ArrowLeft, AlertCircle, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm = ({ onSwitchToLogin }: RegisterFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [accountType, setAccountType] = useState<'restaurant' | 'supplier'>('restaurant');
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error", 
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      // Crear cuenta vía Edge Function (email confirmado)
      const { data: regData, error: regError } = await supabase.functions.invoke('register-user', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          account_type: accountType
        },
      });
      
      if (regError) {
        if (typeof regError.message === 'string' && regError.message.includes('already registered')) {
          toast({
            title: 'Usuario existente',
            description: 'Ya tienes una cuenta en Conektao. Inicia sesión para continuar.',
            variant: 'destructive'
          });
          return;
        }
        throw regError;
      }

      // Iniciar sesión automáticamente tras el registro
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (loginError) {
        // Si tu proyecto tiene activado "Confirmar email" en Supabase, el login podría fallar.
        toast({
          title: "Cuenta creada",
          description: "Inicia sesión con tu correo y contraseña.",
        });
        return;
      }

      toast({
        title: "¡Cuenta creada!",
        description: "Sesión iniciada automáticamente.",
      });

      navigate('/');

    } catch (error: any) {
      console.error("Error creating account:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la cuenta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <Card className="w-full bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Crear cuenta en Conektao</CardTitle>
        <CardDescription>
          Regístrate para empezar a usar la plataforma
        </CardDescription>
        
        <div className="flex gap-2 mt-4">
          <Button
            type="button"
            variant={accountType === 'restaurant' ? 'default' : 'outline'}
            onClick={() => setAccountType('restaurant')}
            className="flex-1"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Restaurante
          </Button>
          <Button
            type="button"
            variant={accountType === 'supplier' ? 'default' : 'outline'}
            onClick={() => setAccountType('supplier')}
            className="flex-1"
          >
            <Truck className="h-4 w-4 mr-2" />
            Proveedor
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="tu@correo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="300 123 4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirma tu contraseña"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creando cuenta...
              </>
            ) : (
              "Crear mi cuenta"
            )}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={onSwitchToLogin}
              className="text-sm"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterForm;