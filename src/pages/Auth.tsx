
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import RestaurantSetup from "@/components/RestaurantSetup";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register' | 'setup' | 'supplier'>(
    (searchParams.get('mode') as 'login' | 'register' | 'setup' | 'supplier') || 'login'
  );

  // Redirect authenticated users to main app (except when on login form or setup mode)
  useEffect(() => {
    if (!loading && user && mode !== 'login' && mode !== 'setup') {
      navigate("/");
    }
  }, [user, loading, mode, navigate]);

  // Keep mode in sync with URL query param
  useEffect(() => {
    const current = (searchParams.get('mode') as 'login' | 'register' | 'setup' | 'supplier') || 'login';
    setMode(current);
  }, [searchParams]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Strong gradient background with animated waves */}
      <div className="absolute inset-0">
        {/* Base gradient matching the image */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 30% 70%, rgb(204, 122, 72) 0%, rgb(139, 169, 169) 50%, rgb(45, 164, 154) 100%)
            `
          }}
        ></div>
        
        {/* Animated orange waves */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(ellipse 1200px 800px at 20% 80%, rgba(204, 122, 72, 0.8) 0%, rgba(204, 122, 72, 0.4) 35%, transparent 70%),
              radial-gradient(ellipse 900px 600px at 80% 20%, rgba(218, 139, 89, 0.7) 0%, rgba(218, 139, 89, 0.3) 45%, transparent 80%)
            `,
            animation: 'wave1 6s ease-in-out infinite',
            filter: 'blur(40px)'
          }}
        ></div>
        
        {/* Animated teal waves */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(ellipse 1000px 700px at 70% 30%, rgba(45, 164, 154, 0.8) 0%, rgba(45, 164, 154, 0.4) 40%, transparent 75%),
              radial-gradient(ellipse 800px 1000px at 30% 70%, rgba(77, 180, 172, 0.6) 0%, rgba(77, 180, 172, 0.2) 50%, transparent 85%)
            `,
            animation: 'wave2 7s ease-in-out infinite reverse',
            filter: 'blur(50px)'
          }}
        ></div>
        
        {/* Moving gradient overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(ellipse 1500px 400px at 50% 60%, rgba(204, 122, 72, 0.9) 0%, rgba(139, 169, 169, 0.5) 30%, rgba(45, 164, 154, 0.7) 60%, transparent 90%)
            `,
            animation: 'wave3 8s ease-in-out infinite',
            filter: 'blur(60px)'
          }}
        ></div>
        
        {/* Dynamic color shifts */}
        <div 
          className="absolute inset-0 opacity-25"
          style={{
            background: `
              radial-gradient(ellipse 600px 600px at 40% 40%, rgba(218, 139, 89, 0.8) 0%, rgba(77, 180, 172, 0.6) 40%, transparent 80%),
              radial-gradient(ellipse 900px 500px at 75% 75%, rgba(45, 164, 154, 0.7) 0%, rgba(204, 122, 72, 0.4) 50%, transparent 85%)
            `,
            animation: 'wave4 5s ease-in-out infinite reverse',
            filter: 'blur(70px)'
          }}
        ></div>
      </div>
      
      {/* Content with proper z-index */}
      <div className="relative z-10 w-full max-w-md">
        {mode === 'login' ? (
          <LoginForm onSwitchToRegister={() => setMode('register')} />
        ) : mode === 'register' ? (
          <RegisterForm onSwitchToLogin={() => setMode('login')} />
        ) : mode === 'setup' ? (
          <RestaurantSetup />
        ) : (
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Registro de Proveedores</h2>
            <p className="text-muted-foreground mb-6">
              El registro de proveedores estará disponible próximamente. 
              Nos pondremos en contacto contigo para configurar tu cuenta.
            </p>
            <div className="space-y-3">
              <Button onClick={() => setMode('login')} className="w-full">
                Volver al inicio de sesión
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/welcome')} 
                className="w-full"
              >
                Volver a la página principal
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
