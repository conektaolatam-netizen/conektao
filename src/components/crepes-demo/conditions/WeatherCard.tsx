import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Droplets, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface OperationalAction {
  area: string;
  icon: string;
  action: string;
  direction: "up" | "down" | "neutral";
}

interface WeatherData {
  condition: string;
  description: string;
  temp: number;
  humidity: number;
  icon: string;
  recommendation: string;
  salesImpact: {
    dineIn: number;
    delivery: number;
  };
  operationalActions?: OperationalAction[];
}

interface WeatherCardProps {
  weather: WeatherData | null;
  isLoading: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather, isLoading }) => {
  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition?.toLowerCase() || '';
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return <CloudRain className="w-12 h-12 text-[#5C4033]" />;
    }
    if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
      return <CloudLightning className="w-12 h-12 text-[#8B6914]" />;
    }
    if (conditionLower.includes('snow')) {
      return <CloudSnow className="w-12 h-12 text-[#6B5744]" />;
    }
    if (conditionLower.includes('cloud')) {
      return <Cloud className="w-12 h-12 text-[#8B7355]" />;
    }
    return <Sun className="w-12 h-12 text-[#8B6914]" />;
  };

  const getDirectionBorder = (direction: string) => {
    if (direction === 'up') return { border: 'border-l-[#2D5F2D]', icon: <ArrowUp className="w-3.5 h-3.5 text-[#2D5F2D]" />, text: 'text-[#2D5F2D]' };
    if (direction === 'down') return { border: 'border-l-[#8B2500]', icon: <ArrowDown className="w-3.5 h-3.5 text-[#8B2500]" />, text: 'text-[#8B2500]' };
    return { border: 'border-l-[#8B6914]', icon: <Minus className="w-3.5 h-3.5 text-[#8B6914]" />, text: 'text-[#8B6914]' };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#E8DFD4] shadow-sm p-6 md:col-span-3">
        <div className="animate-pulse space-y-4">
          <div className="h-12 w-12 bg-[#F0ECE6] rounded-full" />
          <div className="h-4 w-24 bg-[#F0ECE6] rounded" />
          <div className="h-6 w-16 bg-[#F0ECE6] rounded" />
        </div>
      </div>
    );
  }

  if (!weather) return null;

  const hasActions = weather.operationalActions && weather.operationalActions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={hasActions ? 'md:col-span-3' : ''}
    >
      <div className="bg-white rounded-xl border border-[#E8DFD4] shadow-sm overflow-hidden">
        <div className="p-6">
          {/* Top section: weather info + sales impact */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-5">
            {/* Weather Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider mb-2">Clima Hoy</p>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    {getWeatherIcon(weather.condition)}
                  </motion.div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-[#4A3728]">{weather.temp}°C</p>
                  <p className="text-sm text-[#8B7355] capitalize">{weather.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#6B5744]">
                <Droplets className="w-4 h-4 text-[#5C4033]" />
                <span>Humedad: {weather.humidity}%</span>
              </div>
            </div>

            {/* Sales Impact */}
            <div className="flex flex-col justify-center">
              <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider mb-3">Impacto en Ventas (Histórico)</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Dine In */}
                <div className={`bg-white rounded-lg border border-[#E8DFD4] overflow-hidden`}>
                  <div className={`border-l-[3px] ${weather.salesImpact.dineIn >= 0 ? 'border-l-[#2D5F2D]' : 'border-l-[#8B2500]'} p-3`}>
                    <div className="flex items-center gap-1 mb-1">
                      {weather.salesImpact.dineIn >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-[#2D5F2D]" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-[#8B2500]" />
                      )}
                      <span className="text-xs text-[#6B5744]">Mesa</span>
                    </div>
                    <p className={`text-xl font-bold ${weather.salesImpact.dineIn >= 0 ? 'text-[#2D5F2D]' : 'text-[#8B2500]'}`}>
                      {weather.salesImpact.dineIn > 0 ? '+' : ''}{weather.salesImpact.dineIn}%
                    </p>
                  </div>
                </div>
                {/* Delivery */}
                <div className={`bg-white rounded-lg border border-[#E8DFD4] overflow-hidden`}>
                  <div className={`border-l-[3px] ${weather.salesImpact.delivery >= 0 ? 'border-l-[#2D5F2D]' : 'border-l-[#8B2500]'} p-3`}>
                    <div className="flex items-center gap-1 mb-1">
                      {weather.salesImpact.delivery >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-[#2D5F2D]" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-[#8B2500]" />
                      )}
                      <span className="text-xs text-[#6B5744]">Domicilio</span>
                    </div>
                    <p className={`text-xl font-bold ${weather.salesImpact.delivery >= 0 ? 'text-[#2D5F2D]' : 'text-[#8B2500]'}`}>
                      {weather.salesImpact.delivery > 0 ? '+' : ''}{weather.salesImpact.delivery}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg border border-[#E8DFD4] overflow-hidden h-full flex"
              >
                <div className="w-1 bg-[#5C4033] flex-shrink-0" />
                <div className="p-3 flex items-center">
                  <p className="text-sm text-[#4A3728] leading-relaxed">
                    {weather.recommendation}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Operational Actions */}
          {hasActions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="border-t border-[#E8DFD4] pt-4">
                <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider mb-3">
                  Acciones Operativas — Basado en histórico
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {weather.operationalActions!.map((action, idx) => {
                    const style = getDirectionBorder(action.direction);
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + idx * 0.08 }}
                        className={`bg-white rounded-lg border border-[#E8DFD4] overflow-hidden`}
                      >
                        <div className={`border-l-[3px] ${style.border} p-3 flex items-start gap-2.5`}>
                          <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
                            <span className="text-base">{action.icon}</span>
                            {style.icon}
                          </div>
                          <p className={`text-xs leading-relaxed ${style.text}`}>
                            {action.action}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherCard;
