import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Thermometer, Droplets, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
}

interface WeatherCardProps {
  weather: WeatherData | null;
  isLoading: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather, isLoading }) => {
  const getWeatherIcon = (condition: string) => {
    const conditionLower = condition?.toLowerCase() || '';
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return <CloudRain className="w-12 h-12 text-blue-400" />;
    }
    if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
      return <CloudLightning className="w-12 h-12 text-yellow-400" />;
    }
    if (conditionLower.includes('snow')) {
      return <CloudSnow className="w-12 h-12 text-blue-200" />;
    }
    if (conditionLower.includes('cloud')) {
      return <Cloud className="w-12 h-12 text-gray-400" />;
    }
    return <Sun className="w-12 h-12 text-yellow-500" />;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-[#5C4033]/5 to-[#8B7355]/5 border-[#5C4033]/10 overflow-hidden">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-12 w-12 bg-[#5C4033]/10 rounded-full" />
            <div className="h-4 w-24 bg-[#5C4033]/10 rounded" />
            <div className="h-6 w-16 bg-[#5C4033]/10 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-[#5C4033]/5 to-[#8B7355]/10 border-[#5C4033]/10 overflow-hidden relative">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-orange-500/5 pointer-events-none" />
        
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-[#5C4033]/60 font-medium mb-1">Clima Hoy</p>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {getWeatherIcon(weather.condition)}
              </motion.div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-[#5C4033]">{weather.temp}°C</p>
              <p className="text-sm text-[#5C4033]/60 capitalize">{weather.description}</p>
            </div>
          </div>

          {/* Humidity */}
          <div className="flex items-center gap-2 mb-4 text-sm text-[#5C4033]/70">
            <Droplets className="w-4 h-4" />
            <span>Humedad: {weather.humidity}%</span>
          </div>

          {/* Sales Impact */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`p-3 rounded-lg ${weather.salesImpact.dineIn >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-1 mb-1">
                {weather.salesImpact.dineIn >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs text-[#5C4033]/60">Mesa</span>
              </div>
              <p className={`text-lg font-bold ${weather.salesImpact.dineIn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {weather.salesImpact.dineIn > 0 ? '+' : ''}{weather.salesImpact.dineIn}%
              </p>
            </div>
            <div className={`p-3 rounded-lg ${weather.salesImpact.delivery >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-1 mb-1">
                {weather.salesImpact.delivery >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs text-[#5C4033]/60">Domicilio</span>
              </div>
              <p className={`text-lg font-bold ${weather.salesImpact.delivery >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {weather.salesImpact.delivery > 0 ? '+' : ''}{weather.salesImpact.delivery}%
              </p>
            </div>
          </div>

          {/* Recommendation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100"
          >
            <p className="text-sm text-[#5C4033] leading-relaxed">
              {weather.recommendation}
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WeatherCard;
