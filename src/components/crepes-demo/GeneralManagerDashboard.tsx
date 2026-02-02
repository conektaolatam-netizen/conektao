import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, TrendingUp, MessageSquare, Globe,
  DollarSign, Users, BarChart3, Send, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const GeneralManagerDashboard = () => {
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Buenos días. Tienes 3 regiones por debajo del 80% de meta hoy. ¿Quieres que profundice en alguna?' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const regions = [
    { name: 'Bogotá Norte', sales: 89500000, target: 95000000, branches: 5, trend: 'up' },
    { name: 'Bogotá Sur', sales: 67200000, target: 80000000, branches: 4, trend: 'down' },
    { name: 'Medellín', sales: 78900000, target: 85000000, branches: 4, trend: 'up' },
    { name: 'Cali', sales: 45600000, target: 60000000, branches: 3, trend: 'down' },
    { name: 'Costa', sales: 52300000, target: 55000000, branches: 3, trend: 'stable' },
  ];

  const kpis = [
    { label: 'Ventas Totales', value: '$333.5M', change: '+8.2%', trend: 'up' },
    { label: 'Ticket Promedio', value: '$42.800', change: '+3.1%', trend: 'up' },
    { label: 'NPS', value: '87', change: '+2', trend: 'up' },
    { label: 'Rotación Personal', value: '4.2%', change: '-0.8%', trend: 'down' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0,
      notation: 'compact'
    }).format(value);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    setChatMessages(prev => [...prev, { role: 'user', content: inputValue }]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Analizando datos de Bogotá Sur y Cali... El problema principal es el tiempo de servicio (16 min promedio vs 10 min meta). Recomiendo revisar turnos de cocina en horas pico. ¿Quieres que genere un reporte detallado para el comité?' 
      }]);
    }, 2000);
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
          <h2 className="text-3xl font-bold text-[#5C4033]">
            Panel Ejecutivo
          </h2>
          <p className="text-[#5C4033]/70">Vista de Gerente General · Nacional</p>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi, index) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-[#5C4033]/10"
            >
              <p className="text-sm text-[#5C4033]/60 mb-1">{kpi.label}</p>
              <p className="text-2xl font-bold text-[#5C4033]">{kpi.value}</p>
              <p className={`text-sm flex items-center gap-1 mt-1
                ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}
              `}>
                <TrendingUp className={`w-3 h-3 ${kpi.trend === 'down' ? 'rotate-180' : ''}`} />
                {kpi.change}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Regional Map / List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#5C4033]/10 overflow-hidden"
          >
            <div className="p-6 border-b border-[#5C4033]/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#5C4033] flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Desempeño por Región
              </h3>
              <span className="text-sm text-[#5C4033]/60">19 sucursales activas</span>
            </div>
            
            <div className="divide-y divide-[#5C4033]/10">
              {regions.map((region, index) => {
                const progress = (region.sales / region.target) * 100;
                return (
                  <motion.div
                    key={region.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="p-5 hover:bg-[#F5F0E8]/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-3 h-3 rounded-full
                          ${progress >= 90 ? 'bg-green-500' : 
                            progress >= 75 ? 'bg-amber-500' : 'bg-red-500'}
                        `} />
                        <span className="font-medium text-[#5C4033]">{region.name}</span>
                        <span className="text-xs text-[#5C4033]/50">{region.branches} sucursales</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-[#5C4033]">{formatCurrency(region.sales)}</span>
                        <span className={`
                          text-sm font-medium px-2 py-0.5 rounded-full
                          ${progress >= 90 ? 'bg-green-100 text-green-700' : 
                            progress >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}
                        `}>
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-[#5C4033]/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                        className={`h-full rounded-full
                          ${progress >= 90 ? 'bg-green-500' : 
                            progress >= 75 ? 'bg-amber-500' : 'bg-red-500'}
                        `}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* AI Chat */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-b from-[#5C4033] to-[#3D2817] rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#2DD4BF] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Asistente Ejecutivo</h3>
                <p className="text-xs text-white/60">IA Conversacional</p>
              </div>
            </div>
            
            <div className="h-[300px] overflow-y-auto p-4 space-y-3">
              <AnimatePresence>
                {chatMessages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      max-w-[90%] p-3 rounded-xl text-sm
                      ${msg.role === 'user' 
                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white' 
                        : 'bg-white/10 text-white/90'}
                    `}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/10 p-3 rounded-xl">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Pregunta sobre tu negocio..."
                  className="flex-1 px-4 py-2 rounded-full bg-white/10 text-white placeholder-white/50 text-sm border border-white/10 focus:outline-none focus:border-white/30"
                />
                <Button 
                  onClick={handleSendMessage}
                  size="icon"
                  className="rounded-full bg-gradient-to-r from-[#FF6B35] to-[#2DD4BF]"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GeneralManagerDashboard;
