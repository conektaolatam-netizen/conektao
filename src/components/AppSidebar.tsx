import { NavLink, useLocation } from 'react-router-dom';
import { authService } from '@/lib/auth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Receipt,
  Package,
  DollarSign,
  Users,
  FileText,
  ShoppingCart,
  Brain,
  Calculator,
  TrendingUp,
  Settings,
  HelpCircle,
  Building2,
  MapPin
} from 'lucide-react';

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const user = authService.getCurrentUser();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 border-r-2 border-blue-500 font-medium" 
      : "hover:bg-gray-100/50 text-gray-700 hover:text-gray-900";

  // Different menu items based on user role
  const getMenuItems = () => {
    const commonItems = [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
    ];

    if (user?.role === 'owner') {
      return [
        ...commonItems,
        { title: "Facturación", url: "/invoicing", icon: Receipt },
        { title: "Inventario", url: "/inventory", icon: Package },
        { title: "Finanzas", url: "/billing", icon: DollarSign },
        { title: "Presentación Ingresos", url: "/income", icon: TrendingUp },
        { title: "Control de Equipo", url: "/team", icon: Users },
        { title: "Documentos", url: "/documents", icon: FileText },
        { title: "Marketplace", url: "/marketplace", icon: ShoppingCart },
        { title: "Conektao AI", url: "/ai-assistant", icon: Brain },
        { title: "IA Contabilidad", url: "/cont-ai", icon: Calculator },
        { title: "Sucursales", url: "/branches", icon: Building2 },
        { title: "Soporte", url: "/support", icon: HelpCircle },
      ];
    }

    if (user?.role === 'manager') {
      return [
        ...commonItems,
        { title: "Facturación", url: "/invoicing", icon: Receipt },
        { title: "Inventario", url: "/inventory", icon: Package },
        { title: "Presentación Ingresos", url: "/income", icon: TrendingUp },
        { title: "Control de Equipo", url: "/team", icon: Users },
        { title: "Marketplace", url: "/marketplace", icon: ShoppingCart },
        { title: "Conektao AI", url: "/ai-assistant", icon: Brain },
        { title: "Soporte", url: "/support", icon: HelpCircle },
      ];
    }

    if (user?.role === 'cashier') {
      return [
        ...commonItems,
        { title: "Facturación", url: "/invoicing", icon: Receipt },
        { title: "Inventario", url: "/inventory", icon: Package },
        { title: "Marketplace", url: "/marketplace", icon: ShoppingCart },
        { title: "Soporte", url: "/support", icon: HelpCircle },
      ];
    }

    if (user?.role === 'waiter') {
      return [
        ...commonItems,
        { title: "Órdenes", url: "/orders", icon: Receipt },
        { title: "Mi Horario", url: "/schedule", icon: Users },
        { title: "Soporte", url: "/support", icon: HelpCircle },
      ];
    }

    if (user?.role === 'employee') {
      return [
        { title: "Mi Dashboard", url: "/", icon: LayoutDashboard },
        { title: "Mi Horario", url: "/schedule", icon: Users },
        { title: "PQRS", url: "/pqrs", icon: HelpCircle },
        { title: "Soporte", url: "/support", icon: HelpCircle },
      ];
    }

    // Menú específico para proveedores
    if (user?.role === 'supplier') {
      return [
        { title: "Panel Proveedor", url: "/supplier-dashboard", icon: LayoutDashboard },
        { title: "Mis Productos", url: "/supplier-products", icon: Package },
        { title: "Pedidos", url: "/supplier-orders", icon: ShoppingCart },
        { title: "Configuración", url: "/supplier-settings", icon: Settings },
        { title: "Soporte", url: "/support", icon: HelpCircle },
      ];
    }

    return commonItems;
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-64"} border-r border-gray-200/50 bg-white/90 backdrop-blur-sm transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={`${collapsed ? "sr-only" : ""} text-gray-500 font-medium mb-2`}>
            Navegación Principal
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink to={item.url} end className={getNavCls}>
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-shrink-0">
                          <item.icon className="w-5 h-5" />
                        </div>
                        {!collapsed && (
                          <span className="font-medium">{item.title}</span>
                        )}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions - Only for owner/manager */}
        {(user?.role === 'owner' || user?.role === 'manager') && !collapsed && (
          <SidebarGroup className="mt-8">
            <SidebarGroupLabel className="text-gray-500 font-medium mb-2">
              Acciones Rápidas
            </SidebarGroupLabel>
            
            <SidebarGroupContent>
              <div className="space-y-2">
                <button className="w-full text-left p-2 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    <span className="text-sm font-medium">Nueva Factura</span>
                  </div>
                </button>
                
                <button className="w-full text-left p-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 hover:from-green-100 hover:to-emerald-100 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span className="text-sm font-medium">Agregar Producto</span>
                  </div>
                </button>

                {user?.role === 'owner' && (
                  <button className="w-full text-left p-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 transition-all duration-200">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">Nueva Sucursal</span>
                    </div>
                  </button>
                )}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* User Role Indicator */}
        {!collapsed && (
          <div className="mt-auto pt-4 border-t border-gray-200/50">
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-600">
                  Conectado como {user?.role === 'owner' ? 'Propietario' : 
                                 user?.role === 'manager' ? 'Gerente' :
                                 user?.role === 'cashier' ? 'Cajero' :
                                 user?.role === 'waiter' ? 'Mesero' : 'Empleado'}
                </span>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}