
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
      {/* Animated waves background with Conektao colors */}
      <div className="absolute inset-0">
        {/* Base black background */}
        <div className="absolute inset-0 bg-black"></div>
        
        {/* Animated orange waves - more opaque */}
        <div 
          className="absolute inset-0 opacity-70"
          style={{
            background: `
              radial-gradient(ellipse 1200px 800px at 20% 80%, rgba(255, 127, 50, 0.4) 0%, rgba(255, 100, 30, 0.2) 35%, transparent 70%),
              radial-gradient(ellipse 900px 600px at 80% 20%, rgba(255, 140, 60, 0.35) 0%, rgba(255, 110, 40, 0.15) 45%, transparent 80%)
            `,
            animation: 'wave1 6s ease-in-out infinite',
            filter: 'blur(40px)'
          }}
        ></div>
        
        {/* Animated cyan/turquoise waves - more opaque */}
        <div 
          className="absolute inset-0 opacity-70"
          style={{
            background: `
              radial-gradient(ellipse 1000px 700px at 70% 30%, rgba(0, 180, 180, 0.4) 0%, rgba(0, 200, 200, 0.2) 40%, transparent 75%),
              radial-gradient(ellipse 800px 1000px at 30% 70%, rgba(50, 200, 200, 0.35) 0%, rgba(0, 220, 220, 0.15) 50%, transparent 85%)
            `,
            animation: 'wave2 7s ease-in-out infinite reverse',
            filter: 'blur(50px)'
          }}
        ></div>
        
        {/* Moving gradient overlay with orange and cyan */}
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            background: `
              radial-gradient(ellipse 1500px 400px at 50% 60%, rgba(255, 120, 40, 0.3) 0%, rgba(50, 180, 180, 0.25) 50%, transparent 90%)
            `,
            animation: 'wave3 8s ease-in-out infinite',
            filter: 'blur(60px)'
          }}
        ></div>
        
        {/* Dynamic color shifts between orange and turquoise */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            background: `
              radial-gradient(ellipse 600px 600px at 40% 40%, rgba(255, 130, 50, 0.35) 0%, rgba(0, 200, 200, 0.3) 50%, transparent 80%),
              radial-gradient(ellipse 900px 500px at 75% 75%, rgba(50, 200, 200, 0.35) 0%, rgba(255, 110, 40, 0.25) 60%, transparent 85%)
            `,
            animation: 'wave4 5s ease-in-out infinite reverse',
            filter: 'blur(70px)'
          }}
        ></div>
      </div>
      
      {/* Content with proper z-index */}
      <div className="relative z-10 w-full max-w-md">
        {/* Back button - small and subtle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/welcome')}
          className="absolute -top-12 left-0 text-white/60 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/10 rounded-full p-2 h-8 w-8 transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        {mode === 'login' ? (
          <LoginForm onSwitchToRegister={() => setMode('register')} />
        ) : mode === 'register' ? (
          <RegisterForm onSwitchToLogin={() => setMode('login')} />
        ) : mode === 'setup' ? (
          <RestaurantSetup />
        ) : (
          <div className="text-center p-8 bg-gradient-to-br from-black via-gray-950 to-black rounded-lg shadow-2xl border-2 border-orange-500/20">
            <h2 className="text-2xl font-bold mb-4 text-white">Registro de Proveedores</h2>
            <p className="text-gray-300 mb-6">
              El registro de proveedores estará disponible próximamente. 
              Nos pondremos en contacto contigo para configurar tu cuenta.
            </p>
            <div className="space-y-3">
              <Button onClick={() => setMode('login')} className="w-full bg-gradient-to-r from-orange-500 to-cyan-500">
                Volver al inicio de sesión
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/welcome')} 
                className="w-full bg-gray-900/50 border-orange-500/20 text-white hover:bg-gray-800"
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
