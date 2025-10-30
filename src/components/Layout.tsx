import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LayoutDashboard, FileText, Users, ShoppingCart, Package, Brain, Calculator, FolderOpen, Wallet, Menu, X, Sparkles, HelpCircle, RotateCcw, Bell, Crown, ChefHat, Presentation, TrendingUp, DollarSign, Coffee, AlertTriangle, BarChart3, Truck, Shield, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import RestaurantManagement from './RestaurantManagement';
import ProfileControlCenter from './ProfileControlCenter';
interface LayoutProps {
  children?: React.ReactNode;
  currentModule?: string;
  onModuleChange?: (module: string) => void;
  onShowTutorial?: () => void;
  onResetOnboarding?: () => void;
  onShowIncomePresentation?: () => void;
}
const Layout: React.FC<LayoutProps> = ({
  children,
  currentModule = 'dashboard',
  onModuleChange = () => {},
  onShowTutorial = () => {},
  onResetOnboarding = () => {},
  onShowIncomePresentation = () => {}
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    user,
    profile,
    restaurant,
    signOut
  } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [profileControlOpen, setProfileControlOpen] = useState(false);
  const handleSwitchAccount = async () => {
    await signOut();
    navigate('/auth?mode=login');
  };
  const handleSignOut = async () => {
    await signOut();
    navigate('/welcome');
  };
  const modules = [{
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    gradient: 'from-blue-500 to-indigo-600'
  }, {
    id: 'billing',
    name: 'Facturación',
    icon: FileText,
    gradient: 'from-green-500 to-emerald-600'
  }, {
    id: 'team',
    name: 'Personal',
    icon: Users,
    gradient: 'from-amber-500 to-orange-600'
  }, {
    id: 'marketplace',
    name: 'Marketplace',
    icon: ShoppingCart,
    gradient: 'from-purple-500 to-pink-600'
  }, {
    id: 'inventory',
    name: 'Inventario',
    icon: Package,
    gradient: 'from-cyan-500 to-blue-600'
  }, {
    id: 'ai',
    name: 'IA Conektao',
    icon: Brain,
    gradient: 'from-violet-500 to-purple-600'
  }, {
    id: 'contai',
    name: 'Contabilidad IA',
    icon: Calculator,
    gradient: 'from-orange-500 to-red-600'
  }, {
    id: 'documents',
    name: 'Documentos',
    icon: FolderOpen,
    gradient: 'from-indigo-500 to-purple-600'
  }, {
    id: 'kitchen',
    name: 'Cocina',
    icon: ChefHat,
    gradient: 'from-orange-500 to-red-600'
  }, {
    id: 'cash',
    name: 'Caja',
    icon: Wallet,
    gradient: 'from-emerald-500 to-teal-600'
  }, {
    id: 'invoices',
    name: 'Facturas',
    icon: FileText,
    gradient: 'from-pink-500 to-rose-600'
  }, {
    id: 'reports',
    name: 'Reportes',
    icon: BarChart3,
    gradient: 'from-blue-500 to-purple-600'
  }, {
    id: 'suppliers',
    name: 'Proveedores',
    icon: Truck,
    gradient: 'from-green-500 to-blue-600'
  }, {
    id: 'users',
    name: 'Usuarios',
    icon: Shield,
    gradient: 'from-red-500 to-pink-600'
  }];
  const currentModuleData = modules.find(m => m.id === currentModule);
  return <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Flowing waves background - Global */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Wave Layer 1 - Orange flow */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 1400px 900px at 20% 80%, rgba(255, 165, 0, 0.25) 0%, rgba(255, 165, 0, 0.08) 50%, transparent 85%)
            `,
            animation: 'wave1 20s ease-in-out infinite',
            filter: 'blur(60px)'
          }}
        ></div>
        
        {/* Wave Layer 2 - Teal flow */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 1200px 700px at 80% 20%, rgba(20, 184, 166, 0.25) 0%, rgba(20, 184, 166, 0.08) 50%, transparent 85%)
            `,
            animation: 'wave2 25s ease-in-out infinite reverse',
            filter: 'blur(70px)'
          }}
        ></div>
        
        {/* Wave Layer 3 - Orange gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 1000px 1100px at 50% 50%, rgba(255, 106, 0, 0.20) 0%, rgba(255, 106, 0, 0.06) 60%, transparent 90%)
            `,
            animation: 'wave3 30s ease-in-out infinite',
            filter: 'blur(80px)'
          }}
        ></div>
        
        {/* Wave Layer 4 - Teal movement */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 1300px 800px at 30% 40%, rgba(6, 182, 212, 0.20) 0%, rgba(6, 182, 212, 0.06) 55%, transparent 88%)
            `,
            animation: 'wave4 22s ease-in-out infinite',
            filter: 'blur(75px)'
          }}
        ></div>
        
        {/* Wave Layer 5 - Additional orange */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 900px 1200px at 70% 60%, rgba(255, 165, 0, 0.18) 0%, rgba(255, 165, 0, 0.05) 65%, transparent 92%)
            `,
            animation: 'wave5 18s ease-in-out infinite',
            filter: 'blur(85px)'
          }}
        ></div>
      </div>

      {/* Simplified Header */}
      <header className="sticky top-0 z-30 border-b border-border/10 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Button variant="ghost" size="sm" onClick={() => onModuleChange('dashboard')} className="flex items-center gap-2 sm:gap-3 hover:bg-primary/10 transition-all duration-200 min-w-0">
              {currentModule === 'dashboard' ? <>
                  <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-br from-orange-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                    <Sparkles className="w-3 sm:w-5 h-3 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-cyan-500 bg-clip-text text-transparent text-left truncate">
                      Conektao
                    </h1>
                  </div>
                </> : <div className="min-w-0">
                  <h1 className="text-sm sm:text-lg font-semibold bg-gradient-to-r from-orange-600 to-cyan-500 bg-clip-text text-transparent text-left truncate">← Regresar a Conektao</h1>
                </div>}
            </Button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Badge className={`border-0 text-xs px-2 py-1 hidden sm:flex ${profile?.role === 'owner' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' : profile?.role === 'admin' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' : 'bg-gradient-to-r from-gray-400 to-gray-600 text-white'}`}>
              {profile?.role === 'owner' && <Crown className="h-2.5 w-2.5 mr-1" />}
              {profile?.role === 'admin' && <Shield className="h-2.5 w-2.5 mr-1" />}
              {profile?.role === 'employee' && <Users className="h-2.5 w-2.5 mr-1" />}
              <span className="hidden md:inline">{profile?.role === 'owner' ? 'Propietario' : profile?.role === 'admin' ? 'Administrador' : 'Empleado'}</span>
            </Badge>
            
            <Button variant="outline" size="sm" onClick={onShowTutorial} className="hidden lg:flex text-xs px-2 py-1 h-8">
              <HelpCircle className="h-3 w-3 mr-1" />
              <span className="hidden xl:inline">Tutorial</span>
            </Button>
            
            <Button variant="outline" size="sm" onClick={onResetOnboarding} className="hidden lg:flex text-xs px-2 py-1 h-8">
              <RotateCcw className="h-3 w-3 mr-1" />
              <span className="hidden xl:inline">Reiniciar</span>
            </Button>
            
            <Button variant="outline" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10">
              <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                <span className="hidden sm:inline">3</span>
              </span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 rounded-full bg-gradient-to-br from-orange-500 to-cyan-500 hover:from-orange-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105" aria-label="Centro de control del perfil">
                  <ChefHat className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 sm:w-64 bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                <DropdownMenuLabel className="text-center py-2 sm:py-3">
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <div className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 bg-gradient-to-br from-orange-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <ChefHat className="h-4 sm:h-5 lg:h-6 w-4 sm:w-5 lg:w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base truncate">{profile?.full_name || "Usuario"}</p>
                      <p className="text-xs text-muted-foreground truncate">{restaurant?.name || "Restaurante"}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => setProfileControlOpen(true)} className="cursor-pointer">
                  <div className="flex items-center gap-2 sm:gap-3 w-full">
                    <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="h-3 sm:h-4 w-3 sm:w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base">Centro de Control</p>
                      <p className="text-xs text-muted-foreground truncate">Perfil, objetivos y configuración</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => setAccountOpen(true)} className="cursor-pointer">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Ver Perfil</p>
                      <p className="text-xs text-muted-foreground">Información básica</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={handleSwitchAccount} className="cursor-pointer">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center">
                      <ArrowLeft className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Cambiar Usuario</p>
                      <p className="text-xs text-muted-foreground">Iniciar con otra cuenta</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
                      <X className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">Cerrar Sesión</p>
                      <p className="text-xs text-muted-foreground">Salir de la aplicación</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mi cuenta</DialogTitle>
            <DialogDescription>Información del usuario actual</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Correo: </span>{user?.email ?? '—'}</div>
            <div><span className="font-medium">Nombre: </span>{profile?.full_name ?? '—'}</div>
            <div><span className="font-medium">Rol: </span>{profile?.role === 'owner' ? 'Propietario' : profile?.role === 'admin' ? 'Administrador' : profile?.role === 'employee' ? 'Empleado' : '—'}</div>
            <div><span className="font-medium">Establecimiento: </span>{restaurant?.name ?? '—'}</div>
          </div>
        </DialogContent>
      </Dialog>

      <ProfileControlCenter open={profileControlOpen} onOpenChange={setProfileControlOpen} />

      {/* Main content */}
      <main className="p-2 sm:p-4 md:p-6 bg-background relative z-10">
        <div className="bg-card rounded-xl sm:rounded-2xl border border-border/20 shadow-lg relative z-10">
          <div className="p-3 sm:p-4 lg:p-6 bg-card rounded-xl sm:rounded-2xl">
            {currentModule === 'restaurant-management' ? <RestaurantManagement /> : children}
          </div>
        </div>
      </main>
    </div>;
};
export default Layout;