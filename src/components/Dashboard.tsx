import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Users, Package, AlertTriangle, Calendar, BarChart3, Clock, Sparkles, Star, Zap, Activity, ChefHat, Coffee, ShoppingCart, Bell, FileText, Calculator, Building2, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import DailySalesView from '@/components/DailySalesView';
import MonthlySalesView from '@/components/MonthlySalesView';
import { useDashboardNavigation } from '@/hooks/useDashboardNavigation';
import DailyAIAnalysis from '@/components/ai/DailyAIAnalysis';
import DailyRecommendations from '@/components/ai/DailyRecommendations';
import AIUsageCounter from '@/components/ai/AIUsageCounter';
import AdminAIDashboard from '@/components/admin/AdminAIDashboard';
interface DashboardProps {
  onModuleChange: (module: string) => void;
}
const Dashboard = ({
  onModuleChange
}: DashboardProps) => {
  const {
    user,
    profile,
    restaurant
  } = useAuth();
  const {
    notifications,
    unreadCount
  } = useNotifications();
  const {
    currentView,
    navigateToView,
    goBack
  } = useDashboardNavigation();

  // Estados para datos reales de ventas
  const [realSalesData, setRealSalesData] = useState({
    dailySales: 0,
    monthlySales: 0,
    dailyOrders: 0,
    monthlyOrders: 0,
    averageTicket: 0
  });

  // Estados para recomendaciones de IA
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const ENABLE_AUTO_AI_RECS = false;

  // Función para generar recomendaciones automáticas de la IA
  const generateAIRecommendations = async () => {
    if (!user || isLoadingAI) return;
    setIsLoadingAI(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('conektao-ai', {
        body: {
          message: "Analiza mi negocio y genera estrategias de marketing específicas para aumentar ventas. Identifica productos con bajo rendimiento y recomienda descuentos exactos y promociones para mover inventario. Enfócate en optimización de recursos y crecimiento de ingresos con ROI proyectado.",
          userId: user.id,
          restaurantId: restaurant?.id
        }
      });
      if (data?.response) {
        setAiRecommendations({
          analysis: data.response,
          underperforming_product: data.underperforming_product,
          marketing_insights: data.marketing_insights,
          timestamp: new Date(),
          hasAlert: data.response.toLowerCase().includes('oportunidad') || data.response.toLowerCase().includes('mejora') || data.response.toLowerCase().includes('bajo') || data.response.toLowerCase().includes('alerta') || data.underperforming_product !== null
        });
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Función para implementar estrategia sugerida
  const implementStrategy = async () => {
    if (!aiRecommendations) return;
    const confirmImplement = confirm(`🚀 ¿Implementar la estrategia sugerida por la IA?\n\n${aiRecommendations.analysis.substring(0, 200)}...`);
    if (confirmImplement) {
      try {
        const {
          data
        } = await supabase.functions.invoke('conektao-ai', {
          body: {
            message: `Implementa la estrategia recomendada: ${aiRecommendations.analysis}. Genera un plan de acción detallado paso a paso.`,
            userId: user?.id,
            restaurantId: restaurant?.id
          }
        });
        if (data?.response) {
          alert(`✅ PLAN DE IMPLEMENTACIÓN GENERADO\n\n${data.response}`);
        }
      } catch (error) {
        console.error('Error implementing strategy:', error);
      }
    }
  };

  // Cargar datos reales de ventas
  useEffect(() => {
    loadSalesData();
    // Recargar cada 30 segundos para mantener datos actualizados
    const interval = setInterval(loadSalesData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cargar recomendaciones automáticamente solo si está habilitado
  useEffect(() => {
    if (!ENABLE_AUTO_AI_RECS) return;
    generateAIRecommendations();
    const hourlyCheck = setInterval(() => {
      const lastUpdate = aiRecommendations?.timestamp;
      if (!lastUpdate || new Date().getDate() !== new Date(lastUpdate).getDate()) {
        console.log('🔄 Actualizando recomendaciones de IA - Nuevo día detectado');
        generateAIRecommendations();
      }
    }, 60 * 60 * 1000);
    return () => clearInterval(hourlyCheck);
  }, [user, aiRecommendations?.timestamp]);
  const loadSalesData = async () => {
    if (!user || !profile?.restaurant_id) return;
    try {
      // Obtener fecha actual en zona horaria local (Colombia)
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Obtener usuarios del mismo restaurante
      const {
        data: restaurantUsers
      } = await supabase.from('profiles').select('id').eq('restaurant_id', profile.restaurant_id);
      const userIds = restaurantUsers?.map(u => u.id) || [];

      // Ventas del día (desde las 00:00:00 hasta 23:59:59 del día actual)
      const {
        data: dailySales,
        error: dailyError
      } = await supabase.from('sales').select('total_amount').gte('created_at', todayStart.toISOString()).lt('created_at', todayEnd.toISOString());

      // Ventas del mes (desde el primer día del mes)
      const {
        data: monthlySales,
        error: monthlyError
      } = await supabase.from('sales').select('total_amount').gte('created_at', monthStart.toISOString());
      if (!dailyError && !monthlyError && dailySales && monthlySales) {
        const dailyTotal = dailySales.reduce((sum: number, sale: any) => sum + parseFloat(sale.total_amount), 0);
        const monthlyTotal = monthlySales.reduce((sum: number, sale: any) => sum + parseFloat(sale.total_amount), 0);
        const dailyCount = dailySales.length;
        const monthlyCount = monthlySales.length;

        // Calcular ticket promedio mensual = total vendido del mes / personas que visitaron en el mes
        // Cada venta representa una persona/visita
        const averageTicketMonthly = monthlyCount > 0 ? monthlyTotal / monthlyCount : 0;
        setRealSalesData({
          dailySales: dailyTotal,
          monthlySales: monthlyTotal,
          dailyOrders: dailyCount,
          monthlyOrders: monthlyCount,
          averageTicket: averageTicketMonthly
        });
      }
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  // Usar datos del perfil del usuario autenticado
  const businessName = profile?.full_name || 'Mi Negocio';

  // Get real analytics data from global state
  const formatCurrency = (amount: number) => amount.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP'
  });

  // Calcular datos reales en tiempo real
  const calculateGrowthPercentage = (current: number, target: number) => {
    if (target === 0) return 0;
    return (current / target * 100).toFixed(1);
  };

  // Target mensual estimado (puede ser configurable)
  const monthlyTarget = 190000000; // $190M como se menciona en el demo
  const monthlyGrowth = calculateGrowthPercentage(realSalesData.monthlySales, monthlyTarget);

  // Stats usando datos reales de la base de datos
  const stats = [{
    title: "Ventas del Día",
    value: formatCurrency(realSalesData.dailySales),
    change: `Ver facturas`,
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-500",
    gradient: "from-blue-400 to-cyan-500",
    description: "Hoy - En tiempo real",
    size: "small"
  }, {
    title: "Ventas del Mes",
    value: formatCurrency(realSalesData.monthlySales),
    change: `${monthlyGrowth}% del objetivo`,
    icon: DollarSign,
    color: "text-green-600",
    bg: "bg-green-500",
    gradient: "from-green-400 to-emerald-500",
    description: `${realSalesData.monthlyOrders} transacciones`,
    size: "large"
  }, {
    title: "Ticket Promedio",
    value: formatCurrency(realSalesData.averageTicket),
    change: realSalesData.monthlyOrders > 0 ? "Promedio real" : "Sin datos",
    icon: Users,
    color: "text-orange-600",
    bg: "bg-orange-500",
    gradient: "from-orange-400 to-red-500",
    description: "Por transacción",
    size: "small"
  }];

  // Actividad reciente basada en datos reales
  const generateRecentActivity = () => {
    if (realSalesData.dailySales === 0 && realSalesData.monthlySales === 0) {
      return [{
        text: "¡Bienvenido a Conektao! Sistema listo para funcionar",
        time: "Ahora",
        type: "system",
        amount: "",
        status: "Activo"
      }, {
        text: "IA Conektao configurada - Lista para ayudarte",
        time: "Hace 1 min",
        type: "ai",
        amount: "",
        status: "Online"
      }, {
        text: "Sistema de inventario preparado",
        time: "Hace 2 min",
        type: "inventory",
        amount: "",
        status: "Listo"
      }];
    }
    return [{
      text: `Ventas del día: ${formatCurrency(realSalesData.dailySales)} - ${realSalesData.dailyOrders} órdenes`,
      time: "Actualizado ahora",
      type: "billing",
      amount: formatCurrency(realSalesData.dailySales),
      status: "En tiempo real"
    }, {
      text: `Total del mes: ${formatCurrency(realSalesData.monthlySales)} - ${realSalesData.monthlyOrders} transacciones`,
      time: "Hace 1 min",
      type: "system",
      amount: formatCurrency(realSalesData.monthlySales),
      status: "Acumulado"
    }, {
      text: `Ticket promedio: ${formatCurrency(realSalesData.averageTicket)} por transacción`,
      time: "Hace 2 min",
      type: "billing",
      amount: formatCurrency(realSalesData.averageTicket),
      status: "Calculado"
    }, {
      text: `${realSalesData.monthlyOrders} transacciones procesadas exitosamente`,
      time: "Hace 5 min",
      type: "inventory",
      amount: "",
      status: realSalesData.monthlyOrders > 100 ? "Alto Volumen" : "En crecimiento"
    }];
  };
  // Separar módulos regulares de los especiales
  const allRegularActions = [{
    title: "Facturar",
    module: "billing",
    gradient: "from-green-500 to-emerald-600",
    icon: ShoppingCart,
    description: "Facturas",
    urgent: false,
    permission: "access_pos"
  }, {
    title: "Inventario",
    module: "inventory",
    gradient: "from-purple-500 to-violet-600",
    icon: Package,
    description: "Ingredientes, productos y recetas",
    alert: true,
    permission: "manage_inventory"
  }, {
    title: "Cocina",
    module: "kitchen",
    gradient: "from-orange-500 to-red-600",
    icon: ChefHat,
    description: "Comandas digitales",
    badge: "Digital",
    permission: "access_kitchen"
  }, {
    title: "Personal",
    module: "team",
    gradient: "from-blue-500 to-indigo-600",
    icon: Users,
    description: profile?.role === 'owner' ? "Gestionar empleados" : "Mi equipo",
    badge: profile?.role === 'owner' ? "Admin" : "3 activos",
    permission: "view_employees"
  }, {
    title: "Documentos",
    module: "documents",
    gradient: "from-indigo-500 to-purple-600",
    icon: FileText,
    description: "Archivos",
    badge: "29",
    permission: "view_reports"
  }];

  // Filter actions based on user permissions and role
  const regularActions = allRegularActions.filter(action => {
    // Owners and admins can see everything
    if (profile?.role === 'owner' || profile?.role === 'admin') {
      return true;
    }

    // For employees, check specific permissions
    if (action.permission && profile?.permissions) {
      return profile.permissions[action.permission as keyof typeof profile.permissions];
    }

    // If no permission specified, hide it for employees
    return false;
  });

  // Módulos especiales - Marketplace
  const marketplaceAction = {
    title: "MERCADO DE PROVEEDORES",
    module: "marketplace",
    gradient: "from-orange-500 via-red-500 to-orange-600",
    icon: ShoppingCart,
    description: "Compras inteligentes • Ofertas exclusivas",
    badge: "2 ofertas HOT",
    special: "marketplace"
  };

  // Módulos de IA - Futuristas
  const aiActions = [{
    title: "IA Conektao",
    module: "ai",
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
    icon: Sparkles,
    description: "Asistente neural avanzado",
    badge: "Neural",
    special: "ai"
  }, {
    title: "Contabilidad IA",
    module: "contai",
    gradient: "from-violet-500 via-purple-600 to-indigo-700",
    icon: Calculator,
    description: "Calculemos tus impuestos",
    badge: "Quantum",
    special: "ai"
  }];
  const recentActivity = generateRecentActivity();

  // Handle navigation to different views
  if (currentView === 'daily-sales') {
    return <DailySalesView onClose={goBack} />;
  }
  if (currentView === 'monthly-sales') {
    return <MonthlySalesView onClose={goBack} />;
  }

  // Handle clicks on stats cards
  const handleStatsClick = (statTitle: string) => {
    if (statTitle === 'Ventas del Día') {
      navigateToView('daily-sales');
    } else if (statTitle === 'Ventas del Mes') {
      navigateToView('monthly-sales');
    }
  };
  return <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 relative no-overflow-x">{/* Mobile-optimized responsive container */}
      {/* Flowing waves background - Dark blue subtle waves */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Wave Layer 1 - Deep blue flow */}
        <div className="absolute inset-0" style={{
        background: `
              radial-gradient(ellipse 1400px 900px at 20% 80%, rgba(30, 58, 138, 0.15) 0%, rgba(30, 58, 138, 0.06) 50%, transparent 85%)
            `,
        animation: 'wave1 22s ease-in-out infinite',
        filter: 'blur(90px)',
        opacity: 0.8
      }}></div>
        
        {/* Wave Layer 2 - Cyan blue flow */}
        <div className="absolute inset-0" style={{
        background: `
              radial-gradient(ellipse 1200px 700px at 80% 20%, rgba(6, 78, 159, 0.12) 0%, rgba(6, 78, 159, 0.04) 50%, transparent 85%)
            `,
        animation: 'wave2 26s ease-in-out infinite reverse',
        filter: 'blur(100px)',
        opacity: 0.75
      }}></div>
        
        {/* Wave Layer 3 - Navy gradient */}
        <div className="absolute inset-0" style={{
        background: `
              radial-gradient(ellipse 1000px 1100px at 50% 50%, rgba(15, 23, 42, 0.18) 0%, rgba(15, 23, 42, 0.08) 60%, transparent 90%)
            `,
        animation: 'wave3 30s ease-in-out infinite',
        filter: 'blur(110px)',
        opacity: 0.7
      }}></div>
      </div>
      
      {/* Stats Grid - Moved to top */}
      {/* Stats Grid - Mobile optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 w-full relative z-10">
        {stats.map((stat, index) => {
        const isMainStat = stat.size === 'large';
        const isTicketPromedio = stat.title === 'Ticket Promedio';
        return <Card key={index} className={`group p-2 sm:p-3 lg:p-4 bg-card/80 backdrop-blur-sm border border-border/20 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 lg:hover:-translate-y-2 rounded-xl sm:rounded-2xl cursor-pointer relative overflow-hidden ${isMainStat ? 'ring-2 ring-primary/40 col-span-2 sm:col-span-1' : ''} ${isTicketPromedio ? 'hidden sm:block' : ''}`} onClick={() => handleStatsClick(stat.title)}>
              {/* 3D effect overlay */}
              <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none"></div>
              
              <div className="flex items-center justify-between relative z-10 gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground truncate">
                      {stat.title}
                    </p>
                    {isMainStat && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>}
                  </div>
                  <p className="text-base sm:text-lg lg:text-2xl xl:text-3xl font-bold mb-1 truncate">
                    {stat.value}
                  </p>
                  <div className="flex items-center">
                    <Badge className={`bg-gradient-to-r ${stat.gradient} text-primary-foreground px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] lg:text-xs ${isMainStat ? 'ring-1 ring-primary shadow-lg' : ''}`}>
                      {stat.change}
                    </Badge>
                  </div>
                  <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground mt-1 sm:mt-2 truncate">{stat.description}</p>
                </div>
                <div className={`p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${stat.gradient} text-primary-foreground shadow-lg group-hover:scale-110 transition-transform flex-shrink-0 ${isMainStat ? 'shadow-primary/30 ring-2 ring-primary/20' : ''}`}>
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                </div>
              </div>
            </Card>;
      })}
      </div>

      {/* Marketplace Section - Mobile optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 relative z-10">
        {/* Mercado de Proveedores */}
        <button className="group relative p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 text-primary-foreground shadow-xl hover:shadow-orange-500/30 transition-all duration-300 lg:hover:scale-105 active:scale-95 border-0 overflow-hidden min-h-[100px] sm:min-h-[120px]" onClick={() => onModuleChange(marketplaceAction.module)}>
          {/* Efectos de fondo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Badge HOT */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-foreground/20 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-bold animate-pulse">
            🔥 HOT
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              <div className="p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl bg-foreground/20 backdrop-blur-sm group-hover:scale-110 transition-transform flex-shrink-0">
                <marketplaceAction.icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
              </div>
              <div className="text-left min-w-0">
                <h3 className="text-xs sm:text-sm lg:text-xl font-bold truncate">{marketplaceAction.title}</h3>
                <p className="text-[10px] sm:text-xs lg:text-sm opacity-90 truncate">{marketplaceAction.description}</p>
              </div>
            </div>
          </div>
        </button>

        {/* Makro promo */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-xl cursor-pointer lg:hover:scale-105 active:scale-95 hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 h-[120px] sm:h-[140px] lg:h-[180px] group" onClick={() => {
        onModuleChange('marketplace');
        setTimeout(() => {
          window.history.pushState({}, '', '/?view=marketplace&supplier=makro');
        }, 100);
      }}>
          {/* Imagen de fondo */}
          <img alt="Makro 60% Off Vino Argentino" className="absolute inset-0 w-full h-full object-cover" src="/lovable-uploads/493fd1bc-4c8c-4d52-970c-52a4230b6504.png" />
          
          {/* Overlay oscuro en hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

          {/* Texto informativo en hover */}
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 text-white z-10">
            <p className="text-xs sm:text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg">
              Ver productos →
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Mobile optimized grid */}
      <div className="relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
          {regularActions.map((action, index) => <button key={index} className={`group relative h-16 sm:h-18 lg:h-20 p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl bg-card border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300 lg:hover:scale-105 active:scale-95 overflow-hidden`} onClick={() => onModuleChange(action.module)}>
              {/* Fondo degradado que aparece en hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              {/* Indicadores */}
              {action.urgent && <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>}
              {action.alert && <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-[8px] sm:text-xs font-bold text-primary-foreground">!</span>
                </div>}
              
              <div className="relative z-10 flex items-center h-full gap-2 sm:gap-3">
                <div className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-gradient-to-br ${action.gradient} text-primary-foreground group-hover:bg-foreground/20 transition-all flex-shrink-0`}>
                  <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className={`font-bold text-[10px] sm:text-xs lg:text-sm bg-gradient-to-r ${action.gradient} bg-clip-text text-transparent group-hover:text-foreground transition-colors truncate`}>
                    {action.title}
                  </p>
                  <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors truncate hidden sm:block">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>)}
        </div>
      </div>

      {/* Módulos de IA - Diseño Futurista Apple iOS con Naranja */}
      <div className="space-y-3 sm:space-y-4 lg:space-y-5 relative z-10 p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl">
        {/* Header futurista */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-400/50 to-transparent"></div>
          <h3 className="text-xs sm:text-sm lg:text-xl font-semibold tracking-wide text-center">
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent font-bold">Inteligencia </span>
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent font-bold">Artificial</span>
          </h3>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-orange-400/50 to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
          {aiActions.map((action, index) => (
            <div key={index} className="relative group">
              {/* Outer glow - intense radial */}
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-orange-500/40 via-cyan-400/40 to-blue-500/40 opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-700"></div>
              
              {/* Multiple animated gradient borders - Apple Intelligence style */}
              <div className="absolute -inset-[2px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-orange-500 via-fuchsia-500 via-cyan-400 to-blue-500 opacity-80 group-hover:opacity-100 blur-[2px] transition-all duration-500 animate-pulse"></div>
              <div className="absolute -inset-[1.5px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-400 via-cyan-300 via-amber-400 to-orange-500 opacity-90"></div>
              <div className="absolute -inset-[1px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-orange-400/80 via-white/30 to-cyan-400/80 opacity-60 animate-pulse"></div>
              
              <button 
                className="relative h-16 sm:h-18 lg:h-20 w-full p-2 sm:p-3 lg:p-6 rounded-2xl sm:rounded-3xl bg-black/95 text-white shadow-2xl shadow-cyan-500/20 hover:shadow-orange-500/30 transition-all duration-500 lg:hover:scale-105 active:scale-95 overflow-hidden" 
                onClick={() => onModuleChange(action.module)}
              >
                {/* Corner glows */}
                <div className="absolute top-0 left-0 w-20 h-20 bg-orange-500/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-cyan-500/20 rounded-full blur-2xl"></div>
                
                {/* Inner glow effect - stronger */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-cyan-500/20 rounded-2xl sm:rounded-3xl"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/10 via-transparent to-amber-500/10 rounded-2xl sm:rounded-3xl"></div>
                
                {/* Shine sweep effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                
                {/* Top highlight - more visible */}
                <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent"></div>
                <div className="absolute bottom-0 left-[20%] right-[20%] h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
                
                {/* Floating orbs */}
                <div className="absolute top-2 right-4 w-2 h-2 bg-gradient-to-r from-orange-400 to-amber-300 rounded-full animate-pulse hidden sm:block shadow-lg shadow-orange-500/50"></div>
                <div className="absolute bottom-2 left-4 w-1.5 h-1.5 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse hidden sm:block shadow-lg shadow-cyan-500/50"></div>
                
                <div className="relative z-10 flex items-center h-full gap-2 sm:gap-3 lg:gap-4">
                  <div className="p-1.5 sm:p-2 lg:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500/40 to-cyan-500/30 backdrop-blur-md group-hover:scale-110 group-hover:from-orange-500/50 group-hover:to-cyan-500/40 transition-all duration-300 flex-shrink-0 border border-white/20 shadow-lg shadow-orange-500/20">
                    <action.icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white drop-shadow-lg" />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <h4 className="text-sm sm:text-base lg:text-lg font-bold tracking-tight truncate drop-shadow-sm">
                      {action.title.includes('IA') ? (
                        <>
                          <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent font-extrabold">IA</span>
                          <span className="text-white"> {action.title.replace('IA ', '').replace(' IA', '')}</span>
                        </>
                      ) : (
                        <span className="text-white">{action.title}</span>
                      )}
                    </h4>
                    <p className="text-[9px] sm:text-[10px] lg:text-sm text-white/70 truncate hidden sm:block font-light">{action.description}</p>
                  </div>
                  <div className="text-base sm:text-lg lg:text-2xl group-hover:scale-125 transition-transform hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/30 to-cyan-500/30 border border-white/20 shadow-lg shadow-cyan-500/30">
                    <span className="text-sm sm:text-base lg:text-lg bg-gradient-to-r from-orange-300 to-cyan-300 bg-clip-text text-transparent font-bold">✦</span>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* auditorIA Quick Access - Diseño Premium Apple Intelligence */}
        {(profile?.role === 'owner' || profile?.role === 'admin') && (
          <div className="relative group">
            {/* Outer glow - intense radial */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-cyan-500/30 via-fuchsia-500/20 to-orange-500/30 opacity-0 group-hover:opacity-100 blur-3xl transition-all duration-700"></div>
            
            {/* Multiple animated gradient borders - Apple Intelligence style */}
            <div className="absolute -inset-[2px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-cyan-400 via-fuchsia-500 via-orange-500 to-amber-400 opacity-80 group-hover:opacity-100 blur-[2px] transition-all duration-500 animate-pulse"></div>
            <div className="absolute -inset-[1.5px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-orange-400 via-pink-400 via-cyan-400 to-blue-500 opacity-90"></div>
            <div className="absolute -inset-[1px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-cyan-300/80 via-white/40 to-orange-300/80 opacity-60 animate-pulse"></div>
            
            <button 
              className="relative w-full h-14 sm:h-16 lg:h-18 p-3 sm:p-4 lg:p-5 rounded-2xl sm:rounded-3xl bg-black/95 text-white shadow-2xl shadow-cyan-500/30 hover:shadow-orange-500/40 transition-all duration-500 lg:hover:scale-[1.02] active:scale-95 overflow-hidden"
              onClick={() => onModuleChange('documents')}
            >
              {/* Corner glows */}
              <div className="absolute top-0 left-0 w-32 h-16 bg-orange-500/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 right-0 w-32 h-16 bg-cyan-500/20 rounded-full blur-2xl"></div>
              <div className="absolute top-0 right-1/3 w-20 h-10 bg-fuchsia-500/15 rounded-full blur-xl"></div>
              
              {/* Inner glow effect - stronger */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-cyan-500/20 rounded-2xl sm:rounded-3xl"></div>
              <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/10 via-fuchsia-500/5 to-amber-500/10 rounded-2xl sm:rounded-3xl"></div>
              
              {/* Top highlight - more visible */}
              <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute bottom-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
              
              {/* Shine sweep effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              
              {/* Floating orbs */}
              <div className="absolute top-2 right-6 w-2 h-2 bg-gradient-to-r from-orange-400 to-amber-300 rounded-full animate-pulse shadow-lg shadow-orange-500/50"></div>
              <div className="absolute bottom-2 left-6 w-1.5 h-1.5 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse shadow-lg shadow-cyan-500/50"></div>
              
              <div className="relative z-10 flex items-center justify-between h-full">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500/40 to-cyan-500/30 backdrop-blur-md group-hover:scale-110 group-hover:from-orange-500/50 group-hover:to-cyan-500/40 transition-all duration-300 border border-white/20 shadow-lg shadow-orange-500/20">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow-lg" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm sm:text-base lg:text-lg font-bold tracking-tight flex items-center gap-0.5 drop-shadow-sm">
                      <span className="text-white/90">Auditor</span>
                      <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent font-extrabold">IA</span>
                      <span className="text-white/70 ml-2 text-xs sm:text-sm font-light hidden sm:inline">Auditoría inteligente</span>
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-orange-500/30 to-cyan-500/30 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-semibold hidden sm:block border border-white/20 text-white/90 shadow-lg shadow-cyan-500/20">
                    Hunter Pro
                  </span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-orange-500/30 to-cyan-500/30 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-125 transition-transform shadow-lg shadow-orange-500/30">
                    <span className="text-sm sm:text-base bg-gradient-to-r from-orange-300 to-cyan-300 bg-clip-text text-transparent font-bold">◉</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>


      {/* Analytics Preview & AI Suggestions - Mobile optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-8 relative z-10">
        {/* Analytics Chart with Real Data Preview */}
        <Card className="p-3 sm:p-4 lg:p-6 bg-card/80 backdrop-blur-sm border-0 shadow-float rounded-xl sm:rounded-2xl">
          <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6 gap-2">
            <h3 className="text-xs sm:text-sm lg:text-lg font-bold text-foreground truncate">Resumen de Ventas</h3>
            <Button variant="outline" size="sm" onClick={() => onModuleChange('billing')} className="border-2 border-orange-200 hover:border-primary font-extrabold rounded-full text-[#f17b13] text-xs">
              Ver Análisis Completo
            </Button>
          </div>
          <div className="h-40 sm:h-48 lg:h-56 bg-gradient-to-br from-gray-900 via-blue-950 to-gray-950 rounded-lg sm:rounded-xl lg:rounded-2xl relative overflow-hidden border border-white/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-20"></div>
            
            {/* Real Sales Chart */}
            <div className="absolute inset-2 sm:inset-3 lg:inset-4">
              <div className="text-center mb-2 sm:mb-3 lg:mb-4">
                <h3 className="text-[10px] sm:text-xs lg:text-lg font-bold text-white mb-0.5 sm:mb-1">Ventas Últimos 7 Días</h3>
                <p className="text-[9px] sm:text-[10px] lg:text-sm text-white/70">Total: {formatCurrency(realSalesData.monthlySales)}</p>
              </div>
              <div className="space-y-1 sm:space-y-1.5 lg:space-y-2">
                {/* Sales bars - mobile optimized */}
                {[
                  { day: 'Lun', color: 'from-blue-400 to-indigo-500', width: '0%', value: 0 },
                  { day: 'Mar', color: 'from-green-400 to-emerald-500', width: '0%', value: 0 },
                  { day: 'Mié', color: 'from-purple-400 to-pink-500', width: '0%', value: realSalesData.dailySales * 0.9 },
                  { day: 'Jue', color: 'from-yellow-400 to-orange-500', width: '95%', value: realSalesData.dailySales * 1.2 },
                  { day: 'Vie', color: 'from-pink-400 to-red-500', width: '100%', value: realSalesData.dailySales * 1.5 },
                  { day: 'Hoy', color: 'from-orange-400 to-red-500', width: '30%', value: realSalesData.dailySales, isToday: true }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-[9px] sm:text-[10px] lg:text-xs text-white/80 w-8 sm:w-10 lg:w-12">{item.day}</span>
                    <div className="flex-1 mx-1 sm:mx-2 bg-gray-700/50 rounded-full h-2 sm:h-3 lg:h-4">
                      <div className={`bg-gradient-to-r ${item.color} h-full rounded-full ${item.isToday ? 'animate-pulse' : ''}`} style={{ width: item.width }}></div>
                    </div>
                    <span className={`text-[8px] sm:text-[9px] lg:text-xs font-medium w-12 sm:w-14 lg:w-16 text-right ${item.isToday ? 'text-orange-400 font-bold' : 'text-white'}`}>
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-1.5 sm:mt-2 lg:mt-3 text-center">
                <div className="text-[8px] sm:text-[9px] lg:text-xs text-white/70 mb-1 sm:mb-2 truncate">
                  Facturas: {realSalesData.dailyOrders} • Ticket: {formatCurrency(realSalesData.averageTicket)}
                </div>
                <Button onClick={() => onModuleChange('billing')} size="sm" className="bg-primary hover:bg-primary/90 text-white px-2 sm:px-3 lg:px-4 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] lg:text-xs">
                  Ver Detalles
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Assistant Suggestions - Mobile optimized */}
        <Card className="p-3 sm:p-4 lg:p-6 bg-gradient-secondary border-0 shadow-float rounded-xl sm:rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <div className="text-white mb-3 sm:mb-4 lg:mb-6">
              <div className="flex items-center mb-2 sm:mb-3 lg:mb-4">
                <div className="relative mr-2 sm:mr-3">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 animate-pulse" />
                  <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1">
                    <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-yellow-300 animate-bounce" />
                  </div>
                </div>
                <h3 className="text-sm sm:text-base lg:text-xl font-bold">IA Conektao</h3>
              </div>
              
              {/* Análisis actual dinámico */}
              <div className="bg-foreground/10 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 mb-2 sm:mb-3 lg:mb-4">
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <div className="flex items-center">
                    <AlertTriangle className={`h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1.5 sm:mr-2 ${aiRecommendations?.hasAlert ? 'text-yellow-300 animate-pulse' : 'text-green-300'}`} />
                    <span className="font-semibold text-[10px] sm:text-xs lg:text-sm">
                      {isLoadingAI ? 'Analizando...' : aiRecommendations?.hasAlert ? 'Alerta' : 'OK'}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" className="text-white/70 hover:text-white text-[10px] sm:text-xs p-0.5 sm:p-1 h-auto" onClick={generateAIRecommendations} disabled={isLoadingAI}>
                    🔄
                  </Button>
                </div>
                <p className="text-white/90 text-[9px] sm:text-[10px] lg:text-sm leading-relaxed">
                  {isLoadingAI ? "🧠 Analizando..." : <>
                      <span className="block sm:inline">
                        Hoy: {formatCurrency(realSalesData.dailySales)}
                      </span>
                      <span className="hidden sm:inline"> • Facturas: {realSalesData.dailyOrders}</span>
                    </>}
                </p>
              </div>

              {/* Estrategia sugerida */}
              <div className="bg-foreground/10 rounded-lg sm:rounded-xl p-2 sm:p-3 lg:p-4 mb-2 sm:mb-3 lg:mb-4">
                <div className="flex items-center mb-1 sm:mb-2">
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-cyan-300 mr-1.5 sm:mr-2" />
                  <span className="font-semibold text-[10px] sm:text-xs lg:text-sm">Estrategia</span>
                </div>
                <p className="text-white/90 text-[9px] sm:text-[10px] lg:text-sm leading-relaxed mb-2 sm:mb-3 line-clamp-2">
                  {aiRecommendations?.analysis ? aiRecommendations.analysis.substring(150, 250) + "..." : "Promoción con influencers locales"}
                </p>
                
                <Button size="sm" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full text-[9px] sm:text-[10px] lg:text-xs w-full" onClick={implementStrategy} disabled={!aiRecommendations || isLoadingAI}>
                  {isLoadingAI ? '🧠...' : '🎯 Implementar'}
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-1 sm:gap-1.5 lg:gap-2 mb-2 sm:mb-3 lg:mb-4">
                <Badge className={`${aiRecommendations?.hasAlert ? 'bg-yellow-500/20' : 'bg-green-500/20'} backdrop-blur-sm text-white px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] lg:text-xs`}>
                  {isLoadingAI ? '🧠' : aiRecommendations?.hasAlert ? '⚠️' : '✅'}
                </Badge>
                <Badge className="bg-foreground/20 backdrop-blur-sm text-white px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] lg:text-xs hidden sm:inline-flex">
                  📊 Tiempo Real
                </Badge>
                <Badge className="bg-foreground/20 backdrop-blur-sm text-white px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] lg:text-xs hidden sm:inline-flex">
                  🚀 Auto
                </Badge>
              </div>
            </div>
            
            <div className="text-center">
              <Button size="default" className="bg-foreground/20 backdrop-blur-sm text-white border-white/30 hover:bg-foreground/30 transition-all rounded-xl sm:rounded-2xl px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 w-full text-xs sm:text-sm" onClick={() => onModuleChange('ai')}>
                🧠 Chat IA
              </Button>
              <p className="text-white/70 text-[8px] sm:text-[9px] lg:text-xs mt-1 sm:mt-2 hidden sm:block">
                IA conectada a tu base de datos
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>;
};
export default Dashboard;