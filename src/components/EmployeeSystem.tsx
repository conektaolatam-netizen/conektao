import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Calculator, UserCheck, ShoppingCart, Wallet, FileText, Package, BarChart3, DollarSign, ChefHat } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import EmployeeList from "./employee/EmployeeList";
import TimeTracking from "./employee/TimeTracking";
import PayrollCalculation from "./employee/PayrollCalculation";
import DailyPayroll from "./employee/DailyPayroll";
import POSBilling from "./POSBilling";
interface Employee {
  id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'employee';
  phone: string | null;
  is_active: boolean;
  permissions: any;
  created_at: string;
}
const EmployeeSystem = () => {
  const {
    profile,
    restaurant
  } = useAuth();
  const {
    dispatch
  } = useApp();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [showPOS, setShowPOS] = useState(false);
  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Cargando datos del usuario...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Guard clause: Si no hay restaurante asignado, mostrar mensaje
  if (!restaurant) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Cargando datos del establecimiento...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Vista para empleados - mostrar herramientas según permisos + control de tiempo
  if (profile.role === 'employee') {
    const perms = profile.permissions || {};
    if (showPOS) {
      return <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setShowPOS(false)} className="mb-4">
              ← Volver a herramientas
            </Button>
          </div>
          <POSBilling />
        </div>;
    }
    const tools = [
      // Comandar (solo agregar productos, sin facturar)
      perms.add_products_to_order && !perms.process_payments && {
        id: 'pos-waiter',
        title: 'Comandar',
        desc: 'Agregar productos y enviar a cocina',
        icon: ChefHat,
        action: () => setShowPOS(true)
      },
      // Facturación completa (para cajeros)
      perms.process_payments && {
        id: 'pos-billing',
        title: 'Facturación',
        desc: 'Sistema unificado de ventas',
        icon: ShoppingCart,
        action: () => setShowPOS(true)
      }, 
      (perms.manage_cash || perms.process_payments) && {
        id: 'cash',
        title: 'Caja',
        desc: 'Movimientos y pagos',
        icon: Wallet,
        action: () => dispatch({
          type: 'SET_ACTIVE_MODULE',
          payload: 'cash'
        })
      }, 
      (perms.view_inventory || perms.edit_inventory) && {
        id: 'inventory',
        title: 'Inventario',
        desc: 'Gestionar stock',
        icon: Package,
        action: () => dispatch({
          type: 'SET_ACTIVE_MODULE',
          payload: 'inventory'
        })
      }, 
      perms.view_reports && {
        id: 'reports',
        title: 'Reportes',
        desc: 'Ver métricas',
        icon: BarChart3,
        action: () => dispatch({
          type: 'SET_ACTIVE_MODULE',
          payload: 'reports'
        })
      }, 
      (perms.access_kitchen || perms.manage_kitchen_orders) && {
        id: 'kitchen',
        title: 'Cocina',
        desc: 'Panel de comandas digitales',
        icon: ChefHat,
        action: () => dispatch({
          type: 'SET_ACTIVE_MODULE',
          payload: 'kitchen'
        })
      }
    ].filter(Boolean) as Array<{
      id: string;
      title: string;
      desc: string;
      icon: any;
      action: () => void;
    }>;
    return <div className="space-y-8 p-6 bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen rounded-2xl">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-cyan-500 rounded-full shadow-lg">
            <Users className="h-6 w-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Mis Herramientas</h2>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Accesos asignados por tu administrador en <span className="font-semibold text-orange-600">{restaurant?.name}</span>
          </p>
        </div>

        {tools.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((t, index) => {
          const gradients = ['from-orange-400 to-pink-500', 'from-cyan-400 to-blue-500', 'from-green-400 to-emerald-500', 'from-purple-400 to-indigo-500', 'from-yellow-400 to-orange-500'];
          return <Card key={t.id} className="group hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${gradients[index % gradients.length]}`} />
                  <CardHeader className="text-center space-y-3 pb-2">
                    <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-r ${gradients[index % gradients.length]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <t.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                      {t.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <p className="text-slate-600 text-sm leading-relaxed">{t.desc}</p>
                    <Button size="lg" className={`w-full bg-gradient-to-r ${gradients[index % gradients.length]} hover:shadow-lg hover:scale-105 transition-all duration-300 border-0 text-white font-semibold`} onClick={t.action}>
                      Abrir Herramienta
                    </Button>
                  </CardContent>
                </Card>;
        })}
          </div>}

        <Card className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white border-0 shadow-2xl overflow-hidden">
          {/* Gradiente de fondo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-cyan-500/10 opacity-60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.1),transparent_50%)]" />
          <CardHeader className="relative text-center space-y-3">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-orange-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">Control de Tiempo</CardTitle>
            <p className="text-slate-300 text-lg">
              Registra tu entrada y salida de <span className="font-semibold text-orange-300">{restaurant?.name}</span>
            </p>
          </CardHeader>
          <CardContent className="relative">
            <TimeTracking viewMode="employee" />
          </CardContent>
        </Card>
      </div>;
  }

  // Vista completa para propietarios y administradores
  return <div className="space-y-8 p-6 bg-gradient-to-br from-gray-950 via-gray-900 to-black min-h-screen rounded-2xl">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-cyan-500 rounded-full shadow-lg">
          <Users className="h-8 w-8 text-white" />
          <h2 className="text-3xl font-bold text-white">Sistema de Empleados</h2>
        </div>
        <p className="text-xl text-white font-semibold max-w-3xl mx-auto drop-shadow-lg">Gestión de empleados, tiempo y nómina.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 bg-popover">
        <TabsList className="grid w-full grid-cols-5 border-0 shadow-lg rounded-xl p-2">
          <TabsTrigger value="list" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300">
            <Users className="h-4 w-4" />
            Empleados
          </TabsTrigger>
          <TabsTrigger value="time" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300">
            <Clock className="h-4 w-4" />
            Control de Tiempo
          </TabsTrigger>
          <TabsTrigger value="daily-pay" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300">
            <DollarSign className="h-4 w-4" />
            Pago Diario
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300">
            <Calculator className="h-4 w-4" />
            Nómina
          </TabsTrigger>
          <TabsTrigger value="my-time" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg font-semibold transition-all duration-300">
            <UserCheck className="h-4 w-4" />
            Mi Tiempo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-pink-500" />
            <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-500">
              <CardTitle className="text-2xl font-bold text-white">
                Gestión de Empleados
              </CardTitle>
              <CardDescription className="text-white/90 text-lg">
                Administra el equipo, permisos y roles de los empleados
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-muted">
              <EmployeeList onEmployeeSelect={setSelectedEmployee} />
            </CardContent>
          </Card>
            </TabsContent>

        <TabsContent value="daily-pay" className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-yellow-500 to-orange-500" />
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Pago Diario - Empleados por Turno
              </CardTitle>
              <CardDescription className="text-slate-600 text-lg">
                Calcula el pago diario para empleados que trabajan por horas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <DailyPayroll />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500" />
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Control de Tiempo - Vista Gerencial
              </CardTitle>
              <CardDescription className="text-slate-600 text-lg">
                Monitorea los registros de entrada y salida de todos los empleados
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <TimeTracking viewMode="manager" selectedEmployeeId={selectedEmployee?.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-1 rounded-xl">
            <PayrollCalculation />
          </div>
        </TabsContent>

        <TabsContent value="my-time" className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-500" />
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Mi Control de Tiempo
              </CardTitle>
              <CardDescription className="text-slate-600 text-lg">
                Registra tu entrada y salida personal
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <TimeTracking viewMode="employee" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
};
export default EmployeeSystem;