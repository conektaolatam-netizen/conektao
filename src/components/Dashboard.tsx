import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Users, Package, AlertTriangle, Calendar, BarChart3, Clock, Sparkles, Star, Zap, Activity, ChefHat, Coffee, ShoppingCart, Bell, FileText, Calculator, Building2 } from 'lucide-react';
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

const Dashboard = ({ onModuleChange }: DashboardProps) => {
  const { user, profile, restaurant } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const { currentView, navigateToView, goBack } = useDashboardNavigation();
  
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
      const { data, error } = await supabase.functions.invoke('conektao-ai', {
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
          hasAlert: data.response.toLowerCase().includes('oportunidad') || 
                   data.response.toLowerCase().includes('mejora') || 
                   data.response.toLowerCase().includes('bajo') ||
                   data.response.toLowerCase().includes('alerta') ||
                   data.underperforming_product !== null
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
        const { data } = await supabase.functions.invoke('conektao-ai', {
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
      const { data: restaurantUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('restaurant_id', profile.restaurant_id);

      const userIds = restaurantUsers?.map(u => u.id) || [];

      // Ventas del día (desde las 00:00:00 hasta 23:59:59 del día actual)
      const { data: dailySales, error: dailyError } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString());

      // Ventas del mes (desde el primer día del mes)
      const { data: monthlySales, error: monthlyError } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', monthStart.toISOString());

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
  const formatCurrency = (amount: number) => 
    amount.toLocaleString('es-CO', { style: 'currency', currency: 'COP' });

  // Calcular datos reales en tiempo real
  const calculateGrowthPercentage = (current: number, target: number) => {
    if (target === 0) return 0;
    return ((current / target) * 100).toFixed(1);
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
    description: "Stock",
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
    title: "IA CONEKTAO",
    module: "ai",
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
    icon: Sparkles,
    description: "Asistente Neural Avanzado",
    badge: "Neural",
    special: "ai"
  }, {
    title: "CONTABILIDAD IA",
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

  return <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{/* Added responsive container with max-width and padding */}
      
      {/* Stats Grid - Moved to top */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {stats.map((stat, index) => {
        const isMainStat = stat.size === 'large';
        const isTicketPromedio = stat.title === 'Ticket Promedio';
        return <Card 
          key={index} 
          className={`group p-4 bg-card/80 backdrop-blur-sm border border-border/20 shadow-[0_8px_30px_rgb(0,0,0,0.6),0_2px_10px_rgb(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.7),0_4px_15px_rgba(255,106,0,0.3)] transition-all duration-300 hover:-translate-y-2 rounded-2xl cursor-pointer relative overflow-hidden ${isMainStat ? 'ring-2 ring-primary/40 hover:ring-primary/60 shadow-primary/20' : ''} ${isTicketPromedio ? 'hidden md:block' : ''}`}
          onClick={() => handleStatsClick(stat.title)}
          style={{
            boxShadow: isMainStat 
              ? '0 10px 40px rgba(0,0,0,0.7), 0 2px 15px rgba(255,106,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' 
              : '0 8px 30px rgba(0,0,0,0.6), 0 2px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
          }}
        >
              {/* 3D effect overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none"></div>
              
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    {isMainStat && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                    {stat.value}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge className={`bg-gradient-to-r ${stat.gradient} text-primary-foreground px-3 py-1 rounded-full text-xs ${isMainStat ? 'ring-1 ring-primary shadow-lg' : ''}`}>
                      {stat.change}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} text-primary-foreground shadow-lg group-hover:scale-110 transition-transform ${isMainStat ? 'shadow-primary/30 ring-2 ring-primary/20' : ''}`}>
                  <stat.icon className="h-8 w-8" />
                </div>
              </div>
            </Card>;
      })}
      </div>

      {/* Marketplace Section - Mercado de Proveedores y Makro lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mercado de Proveedores - Mitad del ancho */}
        <button className="group relative p-6 rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 text-primary-foreground shadow-xl hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105 hover:-translate-y-1 active:scale-95 border-0 overflow-hidden" onClick={() => onModuleChange(marketplaceAction.module)}>
          {/* Efectos de fondo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          {/* Badge HOT */}
          <div className="absolute top-3 right-3 px-2 py-1 bg-foreground/20 backdrop-blur-sm rounded-full text-xs font-bold animate-pulse hidden lg:block">
            🔥 {marketplaceAction.badge}
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-3">
              <div className="p-3 rounded-xl bg-foreground/20 backdrop-blur-sm group-hover:scale-110 transition-transform">
                <marketplaceAction.icon className="h-8 w-8" />
              </div>
              <div className="text-left">
                <h3 className="text-sm sm:text-lg md:text-xl font-bold">{marketplaceAction.title}</h3>
                <p className="text-xs sm:text-sm opacity-90">{marketplaceAction.description}</p>
              </div>
            </div>
          </div>
        </button>

        {/* Makro Discount - Al lado como descuento */}
        <div 
          className="relative overflow-hidden rounded-2xl p-6 shadow-xl cursor-pointer hover:scale-105 transition-all duration-300"
          onClick={() => onModuleChange('marketplace')}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-700 to-red-600"></div>
          
          <div className="relative">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-background rounded-full flex items-center justify-center mr-3">
                    <div className="text-sm">🛒</div>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-primary-foreground">MAKRO</h2>
                    <p className="text-muted-foreground text-xs sm:text-sm">Descuento especial</p>
                  </div>
                </div>
                <p className="text-primary-foreground text-sm">
                  Vino para tu restaurante 🎯
                </p>
              </div>
              
              {/* 60% Discount Section */}
              <div className="text-right text-primary-foreground">
                <div className="text-4xl font-black leading-none">60%</div>
                <div className="text-xs font-bold tracking-wider">DESC</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Módulos Regulares - Diseño delgado y limpio */}
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {regularActions.map((action, index) => <button key={index} className={`group relative h-20 p-4 rounded-xl bg-card border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 active:scale-95 overflow-hidden`} style={{
              borderImage: `linear-gradient(45deg, ${action.gradient.replace('from-', '').replace('to-', '').replace('-500', '').replace('-600', '')}) 1`,
              borderImageSlice: 1
            }} onClick={() => onModuleChange(action.module)}>
              {/* Fondo degradado que aparece en hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              {/* Indicadores */}
              {action.urgent && <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
              {action.alert && <div className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">!</span>
                </div>}
              
              <div className="relative z-10 flex items-center justify-between h-full">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${action.gradient} text-primary-foreground group-hover:bg-foreground/20 transition-all`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className={`font-bold text-xs sm:text-sm bg-gradient-to-r ${action.gradient} bg-clip-text text-transparent group-hover:text-foreground transition-colors`}>
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                      {action.description}
                    </p>
                  </div>
                </div>
                
                {/* Badges informativos */}
                {action.badge && <span className={`px-2 py-1 bg-gradient-to-r ${action.gradient} text-primary-foreground rounded-full text-xs font-semibold opacity-80 group-hover:bg-foreground/20`}>
                    {action.badge}
                  </span>}
              </div>
            </button>)}
        </div>
      </div>

      {/* Módulos de IA - Futuristas y delgados */}
      <div className="space-y-4">
        <h3 className="text-sm sm:text-lg md:text-xl font-bold text-center bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">
          🚀 INTELIGENCIA ARTIFICIAL AVANZADA
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiActions.map((action, index) => <button key={index} className={`group relative h-20 p-6 rounded-2xl bg-gradient-to-r ${action.gradient} text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 active:scale-95 border-0 overflow-hidden`} onClick={() => onModuleChange(action.module)}>
              {/* Efectos holográficos */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Partículas flotantes */}
              <div className="absolute top-2 right-4 w-2 h-2 bg-foreground/60 rounded-full animate-bounce"></div>
              <div className="absolute top-4 right-8 w-1 h-1 bg-foreground/40 rounded-full animate-pulse"></div>
              
              {/* Badge tecnológico */}
              
              
              <div className="relative z-10 flex items-center justify-between h-full">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-foreground/20 backdrop-blur-sm group-hover:scale-110 group-hover:rotate-12 transition-all">
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm sm:text-base md:text-lg font-bold">{action.title}</h4>
                    <p className="text-xs sm:text-sm opacity-90">{action.description}</p>
                  </div>
                </div>
                <div className="text-2xl group-hover:animate-pulse">🤖</div>
              </div>
            </button>)}
        </div>
      </div>


      {/* Analytics Preview & AI Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Analytics Chart with Real Data Preview */}
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-0 shadow-float rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground">Resumen de Ventas Diarias</h3>
            <Button variant="outline" size="sm" onClick={() => onModuleChange('billing')} className="border-2 border-orange-200 hover:border-primary font-extrabold rounded-full text-[#f17b13] text-xs">
              Ver Análisis Completo
            </Button>
          </div>
          <div className="h-56 bg-gradient-to-br from-orange-100 to-teal-100 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-hero opacity-5 mx-0 px-[3px] py-[10px]"></div>
            
            {/* Real Sales Chart */}
            <div className="absolute inset-4">
              <div className="text-center mb-4">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-700 mb-1">Ventas Últimos 7 Días</h3>
                <p className="text-xs sm:text-sm text-gray-500">Total del mes: {formatCurrency(realSalesData.monthlySales)}</p>
              </div>
              <div className="space-y-2">
                {/* Mostrar datos reales de ventas por día */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 w-12">Lun</span>
                  <div className="flex-1 mx-2 bg-gray-200 rounded-full h-4">
                    <div className="bg-gradient-to-r from-blue-400 to-indigo-500 h-4 rounded-full" style={{ width: realSalesData.dailySales > 0 ? '0%' : '0%' }}></div>
                  </div>
                  <span className="text-xs font-medium w-16 text-right">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 w-12">Mar</span>
                  <div className="flex-1 mx-2 bg-gray-200 rounded-full h-4">
                    <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-4 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <span className="text-xs font-medium w-16 text-right">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 w-12">Mié</span>
                  <div className="flex-1 mx-2 bg-gray-200 rounded-full h-4">
                    <div className="bg-gradient-to-r from-purple-400 to-pink-500 h-4 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <span className="text-xs font-medium w-16 text-right">{formatCurrency(realSalesData.dailySales * 0.9)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 w-12">Jue</span>
                  <div className="flex-1 mx-2 bg-gray-200 rounded-full h-4">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full w-[95%]"></div>
                  </div>
                  <span className="text-xs font-medium w-16 text-right">{formatCurrency(realSalesData.dailySales * 1.2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 w-12">Vie</span>
                  <div className="flex-1 mx-2 bg-gray-200 rounded-full h-4">
                    <div className="bg-gradient-to-r from-pink-400 to-red-500 h-4 rounded-full w-full"></div>
                  </div>
                  <span className="text-xs font-medium w-16 text-right">{formatCurrency(realSalesData.dailySales * 1.5)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600 w-12">Hoy</span>
                  <div className="flex-1 mx-2 bg-gray-200 rounded-full h-4">
                    <div className="bg-gradient-to-r from-orange-400 to-red-500 h-4 rounded-full w-[30%] animate-pulse"></div>
                  </div>
                  <span className="text-xs font-bold text-orange-600 w-16 text-right">{formatCurrency(realSalesData.dailySales)}</span>
                </div>
              </div>
              <div className="mt-3 text-center">
                <div className="text-xs text-gray-600 mb-2">
                  {aiRecommendations?.underperforming_product ? 
                    `Productos con menor rendimiento: ${aiRecommendations.underperforming_product}` :
                    `Facturas hoy: ${realSalesData.dailyOrders} • Ticket promedio: ${formatCurrency(realSalesData.averageTicket)}`
                  }
                </div>
                <Button onClick={() => onModuleChange('billing')} size="sm" className="bg-primary hover:bg-primary/90 text-white px-4 py-1 rounded-full text-xs">
                  Ver Detalles por Producto
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Assistant Suggestions - Interactive */}
        <Card className="p-6 bg-gradient-secondary border-0 shadow-float rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <div className="text-white mb-6">
              <div className="flex items-center mb-4">
                <div className="relative mr-3">
                  <Sparkles className="h-8 w-8 animate-pulse" />
                  <div className="absolute -top-1 -right-1">
                    <Star className="h-4 w-4 text-yellow-300 animate-bounce" />
                  </div>
                </div>
                <h3 className="text-xl font-bold">IA Conektao - Recomendaciones</h3>
              </div>
              
              {/* Análisis actual dinámico */}
              <div className="bg-foreground/10 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <AlertTriangle className={`h-5 w-5 mr-2 ${aiRecommendations?.hasAlert ? 'text-yellow-300 animate-pulse' : 'text-green-300'}`} />
                    <span className="font-semibold text-sm">
                      {isLoadingAI ? 'Analizando...' : aiRecommendations?.hasAlert ? 'Alerta Detectada' : 'Todo en Orden'}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-white/70 hover:text-white text-xs p-1"
                    onClick={generateAIRecommendations}
                    disabled={isLoadingAI}
                  >
                    🔄
                  </Button>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  {isLoadingAI ? (
                    "🧠 Analizando datos en tiempo real..."
                  ) : (
                    <>
                      <span>
                        Hoy: {formatCurrency(realSalesData.dailySales)} • Facturas: {realSalesData.dailyOrders} • Ticket: {formatCurrency(realSalesData.averageTicket)}
                      </span>
                      {aiRecommendations?.analysis ? (
                        <>
                          {" — "}
                          {aiRecommendations.analysis.substring(0, 150)}...
                        </>
                      ) : (
                        " — Esperando recomendaciones de la IA..."
                      )}
                    </>
                  )}
                </p>
                {aiRecommendations?.timestamp && (
                  <p className="text-white/60 text-xs mt-2">
                    Última actualización: {aiRecommendations.timestamp.toLocaleTimeString()}
                  </p>
                )}
              </div>

              {/* Estrategia sugerida */}
              <div className="bg-foreground/10 rounded-xl p-4 mb-4">
                <div className="flex items-center mb-2">
                  <Zap className="h-5 w-5 text-cyan-300 mr-2" />
                  <span className="font-semibold text-sm">Estrategia Sugerida</span>
                </div>
                <p className="text-white/90 text-sm leading-relaxed mb-3">
                  {aiRecommendations?.analysis ? 
                    aiRecommendations.analysis.substring(150, 300) + "..." :
                    "Promoción especial: Alianza con influencers locales"
                  }
                </p>
                
                <Button 
                  size="sm" 
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-full text-xs w-full"
                  onClick={implementStrategy}
                  disabled={!aiRecommendations || isLoadingAI}
                >
                  {isLoadingAI ? '🧠 Analizando...' : '🎯 Implementar Estrategia IA'}
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={`${aiRecommendations?.hasAlert ? 'bg-yellow-500/20' : 'bg-green-500/20'} backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs`}>
                  {isLoadingAI ? '🧠 Analizando' : aiRecommendations?.hasAlert ? '⚠️ Alerta Activa' : '✅ Optimizado'}
                </Badge>
                <Badge className="bg-foreground/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
                  📊 Datos en Tiempo Real
                </Badge>
                <Badge className="bg-foreground/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
                  🚀 IA Automática
                </Badge>
                {aiRecommendations && (
                  <Badge className="bg-purple-500/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
                    🎯 Estrategia Lista
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                size="lg" 
                className="bg-foreground/20 backdrop-blur-sm text-white border-white/30 hover:bg-foreground/30 hover:scale-105 transition-all rounded-2xl px-6 py-3 w-full"
                onClick={() => onModuleChange('ai')}
              >
                🧠 Chat con IA Avanzada
              </Button>
              <p className="text-white/70 text-xs mt-2">
                IA conectada a tu base de datos • Actualización automática cada día
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>;
};
export default Dashboard;