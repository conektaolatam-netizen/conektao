import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, TrendingUp, TrendingDown, AlertCircle,
  MapPin, BarChart3, Users, Clock
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const RegionalManagerDashboard = () => {
  const branches = [
    { name: 'Zona T', sales: 4250000, target: 5000000, orders: 127, avgTime: '11 min', status: 'good' },
    { name: 'Andino', sales: 5800000, target: 5500000, orders: 156, avgTime: '9 min', status: 'excellent' },
    { name: 'Unicentro', sales: 3100000, target: 4500000, orders: 89, avgTime: '14 min', status: 'warning' },
    { name: 'Santafé', sales: 4100000, target: 4200000, orders: 112, avgTime: '12 min', status: 'good' },
    { name: 'Gran Estación', sales: 2800000, target: 4000000, orders: 78, avgTime: '16 min', status: 'critical' },
  ];

  const regionalAlerts = [
    { branch: 'Gran Estación', type: 'critical', message: 'Ventas 30% por debajo de meta', action: 'Revisar operación' },
    { branch: 'Unicentro', type: 'warning', message: 'Tiempo de servicio elevado', action: 'Verificar personal' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

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
                Región Bogotá Norte
              </h2>
              <p className="text-[#5C4033]/70">Vista de Gerente Regional · 5 Sucursales</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#5C4033]/60">Ventas del día</p>
              <p className="text-2xl font-bold text-[#5C4033]">{formatCurrency(20050000)}</p>
              <p className="text-sm text-green-600 flex items-center justify-end gap-1">
                <TrendingUp className="w-4 h-4" />
                +12% vs ayer
              </p>
            </div>
          </div>
        </motion.div>

        {/* Alerts Banner */}
        {regionalAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-semibold text-red-800">Alertas que requieren atención</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {regionalAlerts.map((alert, index) => (
                <div key={index} className={`
                  flex items-center justify-between p-3 rounded-lg
                  ${alert.type === 'critical' ? 'bg-red-100' : 'bg-amber-100'}
                `}>
                  <div>
                    <p className={`font-medium ${alert.type === 'critical' ? 'text-red-800' : 'text-amber-800'}`}>
                      {alert.branch}
                    </p>
                    <p className={`text-sm ${alert.type === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                      {alert.message}
                    </p>
                  </div>
                  <button className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${alert.type === 'critical' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'}
                  `}>
                    {alert.action}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Branches Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-[#5C4033]/10 overflow-hidden"
        >
          <div className="p-6 border-b border-[#5C4033]/10">
            <h3 className="text-lg font-semibold text-[#5C4033] flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Comparativo de Sucursales
            </h3>
          </div>
          
          <div className="divide-y divide-[#5C4033]/10">
            {branches.map((branch, index) => {
              const progress = (branch.sales / branch.target) * 100;
              return (
                <motion.div
                  key={branch.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="p-6 hover:bg-[#F5F0E8]/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${branch.status === 'excellent' ? 'bg-green-100' : 
                          branch.status === 'good' ? 'bg-blue-100' :
                          branch.status === 'warning' ? 'bg-amber-100' : 'bg-red-100'}
                      `}>
                        <MapPin className={`w-5 h-5 
                          ${branch.status === 'excellent' ? 'text-green-600' : 
                            branch.status === 'good' ? 'text-blue-600' :
                            branch.status === 'warning' ? 'text-amber-600' : 'text-red-600'}`} 
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#5C4033]">{branch.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-[#5C4033]/60">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {branch.orders} pedidos
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {branch.avgTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#5C4033]">{formatCurrency(branch.sales)}</p>
                      <p className="text-sm text-[#5C4033]/60">Meta: {formatCurrency(branch.target)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress 
                        value={Math.min(progress, 100)} 
                        className={`h-3 ${
                          branch.status === 'excellent' ? 'bg-green-100' :
                          branch.status === 'good' ? 'bg-blue-100' :
                          branch.status === 'warning' ? 'bg-amber-100' : 'bg-red-100'
                        }`}
                      />
                    </div>
                    <span className={`
                      font-semibold min-w-[60px] text-right
                      ${progress >= 100 ? 'text-green-600' : 
                        progress >= 80 ? 'text-blue-600' :
                        progress >= 60 ? 'text-amber-600' : 'text-red-600'}
                    `}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white"
          >
            <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-2xl font-bold">Andino</p>
            <p className="text-green-100">Mejor desempeño del día</p>
            <p className="text-sm mt-2 text-green-200">+5% sobre meta</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white"
          >
            <Clock className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-2xl font-bold">11.4 min</p>
            <p className="text-amber-100">Tiempo promedio regional</p>
            <p className="text-sm mt-2 text-amber-200">Meta: 10 min</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-br from-[#5C4033] to-[#3D2817] rounded-xl p-6 text-white"
          >
            <Users className="w-8 h-8 mb-3 opacity-80" />
            <p className="text-2xl font-bold">562</p>
            <p className="text-[#F5F0E8]/80">Pedidos totales hoy</p>
            <p className="text-sm mt-2 text-[#F5F0E8]/60">+8% vs mismo día semana pasada</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RegionalManagerDashboard;
