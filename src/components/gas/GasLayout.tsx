import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getGasRoleLabel } from '@/lib/gasPermissions';
import { 
  Flame, 
  LogOut, 
  Truck,
  Zap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GasLayoutProps {
  children: React.ReactNode;
}

const GasLayout: React.FC<GasLayoutProps> = ({ children }) => {
  const { profile, restaurant, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/welcome');
  };

  const roleLabel = getGasRoleLabel(profile?.role || 'employee');

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Futuristic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,106,0,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,106,0,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Dynamic gradient orbs */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 800px 600px at 10% 90%, rgba(255, 100, 0, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse 600px 400px at 90% 10%, rgba(0, 200, 200, 0.12) 0%, transparent 60%),
              radial-gradient(ellipse 400px 300px at 50% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 60%)
            `,
            filter: 'blur(40px)',
            animation: 'bgFloat 20s ease-in-out infinite',
          }}
        />

        {/* Animated scan lines */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div 
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent"
            style={{
              animation: 'scanlineMove 8s linear infinite',
              top: '20%',
            }}
          />
          <div 
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
            style={{
              animation: 'scanlineMove 12s linear infinite',
              top: '60%',
              animationDelay: '4s',
            }}
          />
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/20 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 flex-shrink-0 group">
              {/* Animated glow ring */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 rounded-xl blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-500" 
                   style={{ animation: 'pulse 2s ease-in-out infinite' }} />
              {/* Main logo */}
              <div className="relative w-full h-full bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30 border border-white/20">
                <Flame className="w-6 h-6 text-white" />
              </div>
              {/* Activity indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold bg-gradient-to-r from-orange-500 via-red-500 to-orange-400 bg-clip-text text-transparent">
                  Conektao GAS
                </h1>
                <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {restaurant?.name || 'Distribución GLP'}
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Badge */}
            <Badge 
              variant="outline" 
              className="hidden sm:flex bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-400 border-orange-500/30 shadow-lg shadow-orange-500/10"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mr-2 animate-pulse" />
              {roleLabel}
            </Badge>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-500/20 border border-white/10"
                >
                  <Truck className="h-5 w-5 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-card/90 backdrop-blur-xl border-border/50"
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{profile?.full_name || 'Usuario'}</p>
                    <p className="text-xs text-muted-foreground">{roleLabel}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-3 sm:p-4 md:p-6">
        {children}
      </main>

      {/* Global Styles */}
      <style>{`
        @keyframes bgFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.05);
          }
        }
        
        @keyframes scanlineMove {
          0% {
            transform: translateY(-100vh);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default GasLayout;
