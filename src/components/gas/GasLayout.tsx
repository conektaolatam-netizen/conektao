import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getGasRoleLabel } from '@/lib/gasPermissions';
import { 
  Flame, 
  LogOut, 
  User,
  Truck,
  MapPin,
  AlertTriangle
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
      {/* Gas-themed background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Flame gradient layer */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 1200px 800px at 20% 80%, rgba(255, 100, 0, 0.15) 0%, transparent 70%),
              radial-gradient(ellipse 1000px 600px at 80% 20%, rgba(59, 130, 246, 0.12) 0%, transparent 70%)
            `,
            filter: 'blur(60px)'
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/20 bg-background/90 backdrop-blur-xl">
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 rounded-xl blur-sm opacity-70 animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Flame className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-orange-500 via-red-500 to-orange-400 bg-clip-text text-transparent">
                Conektao GAS
              </h1>
              <p className="text-xs text-muted-foreground">
                {restaurant?.name || 'Distribución GLP'}
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role Badge */}
            <Badge 
              variant="outline" 
              className="hidden sm:flex bg-orange-500/10 text-orange-400 border-orange-500/30"
            >
              {roleLabel}
            </Badge>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  <Truck className="h-5 w-5 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 bg-card border-border"
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
    </div>
  );
};

export default GasLayout;
