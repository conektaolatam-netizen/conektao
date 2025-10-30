
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const LoginForm = ({ onSwitchToRegister }: LoginFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast({
          title: "No pudimos iniciar sesión",
          description: "Verifica tu correo y contraseña.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión exitosamente"
      });

      navigate('/');

    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión",
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
        <CardTitle className="text-2xl">Entrar a mi establecimiento</CardTitle>
        <CardDescription>
          Inicia sesión con tu cuenta de Conektao
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
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
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Iniciar sesión
              </>
            )}
          </Button>


          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={onSwitchToRegister}
              className="text-sm"
            >
              ¿Nuevo en Conektao? Crear cuenta
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
