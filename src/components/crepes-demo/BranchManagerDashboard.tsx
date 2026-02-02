import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, AlertTriangle, CheckCircle2, Users, 
  TrendingUp, ShoppingBag, Timer, ThermometerSun 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const BranchManagerDashboard = () => {
  const operationalMetrics = [
    { label: 'Pedidos en cola', value: 8, icon: ShoppingBag, status: 'warning', change: '+3 vs promedio' },
    { label: 'Tiempo promedio', value: '12 min', icon: Timer, status: 'good', change: '-2 min vs ayer' },
    { label: 'Personal activo', value: '6/8', icon: Users, status: 'warning', change: '2 en break' },
    { label: 'Temp. cocina', value: '24°C', icon: ThermometerSun, status: 'good', change: 'Óptima' },
  ];

  const activeOrders = [
    { id: '#2847', table: 'Mesa 5', items: 3, time: '8 min', status: 'cooking', priority: 'normal' },
    { id: '#2848', table: 'Domicilio', items: 2, time: '5 min', status: 'cooking', priority: 'high' },
    { id: '#2849', table: 'Mesa 12', items: 4, time: '3 min', status: 'pending', priority: 'normal' },
    { id: '#2850', table: 'Mesa 3', items: 1, time: '1 min', status: 'pending', priority: 'normal' },
  ];

  const alerts = [
    { type: 'warning', message: 'Stock bajo: Helado de vainilla (quedan 4 porciones)', time: 'Hace 5 min' },
    { type: 'info', message: 'Pico de demanda detectado - considera refuerzos', time: 'Hace 12 min' },
  ];

  return (
    <div className="min-h-screen p-8 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[#5C4033]">
                Sucursal Zona T
              </h2>
              <p className="text-[#5C4033]/70">Vista de Gerente de Sucursal</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-700 text-sm font-medium">Operación Normal</span>
            </div>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {operationalMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-[#5C4033]/10"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${metric.status === 'good' ? 'bg-green-100' : 'bg-amber-100'}
                `}>
                  <metric.icon className={`w-5 h-5 ${metric.status === 'good' ? 'text-green-600' : 'text-amber-600'}`} />
                </div>
                {metric.status === 'warning' && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                    Atención
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-[#5C4033]">{metric.value}</p>
              <p className="text-sm text-[#5C4033]/60">{metric.label}</p>
              <p className="text-xs text-[#5C4033]/40 mt-1">{metric.change}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Orders */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-[#5C4033]/10"
          >
            <h3 className="text-lg font-semibold text-[#5C4033] mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pedidos Activos
            </h3>
            <div className="space-y-3">
              {activeOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-[#F5F0E8] rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-[#5C4033]">{order.id}</span>
                    <span className="text-[#5C4033]/70">{order.table}</span>
                    <span className="text-sm text-[#5C4033]/50">{order.items} items</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`
                      px-3 py-1 rounded-full text-xs font-medium
                      ${order.status === 'cooking' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}
                    `}>
                      {order.status === 'cooking' ? 'En preparación' : 'Pendiente'}
                    </span>
                    <span className="text-sm font-medium text-[#5C4033]">{order.time}</span>
                    {order.priority === 'high' && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                        Prioritario
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Alerts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-[#5C4033]/10"
          >
            <h3 className="text-lg font-semibold text-[#5C4033] mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas
            </h3>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className={`
                    p-4 rounded-lg border-l-4
                    ${alert.type === 'warning' ? 'bg-amber-50 border-amber-400' : 'bg-blue-50 border-blue-400'}
                  `}
                >
                  <p className={`text-sm ${alert.type === 'warning' ? 'text-amber-800' : 'text-blue-800'}`}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </motion.div>
              ))}
            </div>

            {/* Quick stats */}
            <div className="mt-6 pt-6 border-t border-[#5C4033]/10">
              <h4 className="text-sm font-medium text-[#5C4033] mb-3">Hoy hasta ahora</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#5C4033]/70">Meta de ventas</span>
                    <span className="font-medium text-[#5C4033]">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#5C4033]/70">Satisfacción</span>
                    <span className="font-medium text-green-600">94%</span>
                  </div>
                  <Progress value={94} className="h-2 bg-green-100" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default BranchManagerDashboard;
