
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
    <Card className="w-full bg-gradient-to-br from-black via-gray-950 to-black backdrop-blur-xl shadow-2xl border-2 border-orange-500/20">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mb-4 border-2 border-orange-400/30 ring-4 ring-orange-500/10">
          <Building2 className="h-8 w-8 text-orange-400" />
        </div>
        <CardTitle className="text-2xl text-white">Entrar a mi establecimiento</CardTitle>
        <CardDescription className="text-gray-300">
          Inicia sesión con tu cuenta de Conektao
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="tu@correo.com"
              className="bg-gray-900/50 border-orange-500/20 text-white placeholder:text-gray-500 focus:border-orange-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              className="bg-gray-900/50 border-orange-500/20 text-white placeholder:text-gray-500 focus:border-orange-400"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-cyan-500 hover:from-orange-600 hover:via-pink-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-orange-500/50 transition-all duration-300" disabled={loading}>
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
              className="text-sm text-cyan-400 hover:text-orange-400"
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
