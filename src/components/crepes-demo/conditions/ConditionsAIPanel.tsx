import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import WeatherCard from './WeatherCard';
import CalendarCard from './CalendarCard';
import NewsImpactCard from './NewsImpactCard';

interface ConditionsData {
  weather: any;
  calendar: any;
  news: any;
  aiSummary: string;
  generatedAt: string;
  branch: {
    id: string;
    city: string;
  };
}

interface ConditionsAIPanelProps {
  branchId?: string;
  city?: string;
}

const ConditionsAIPanel: React.FC<ConditionsAIPanelProps> = ({ 
  branchId = "zona-t", 
  city = "Bogotá" 
}) => {
  const [conditions, setConditions] = useState<ConditionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConditions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://ctsqvjcgcukosusksulx.supabase.co/functions/v1/crepes-conditions-ai`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0c3F2amNnY3Vrb3N1c2tzdWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MjgzMTIsImV4cCI6MjA2OTUwNDMxMn0.aTDy7G6E9olaZwtpLW3Lgw4MAfeO704xI4QfIR0SDrg`,
          },
          body: JSON.stringify({ city, branch_id: branchId }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener condiciones');
      }

      const data = await response.json();
      setConditions(data);
    } catch (err) {
      console.error('Error fetching conditions:', err);
      setError('No se pudieron cargar las condiciones. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConditions();
  }, [branchId, city]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4A3728] flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-[#F5EDE4]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#4A3728]">IA de Condiciones</h2>
            <div className="flex items-center gap-1 text-xs text-[#8B7355]">
              <MapPin className="w-3 h-3" />
              <span>{city}</span>
            </div>
          </div>
        </div>
        <button
          onClick={fetchConditions}
          disabled={isLoading}
          className="p-2 text-[#8B7355]/40 hover:text-[#8B7355] transition-colors"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* AI Summary — White card, coffee left border */}
      {conditions?.aiSummary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-[#E8DFD4] shadow-sm overflow-hidden"
        >
          <div className="flex">
            {/* Left accent border */}
            <div className="w-1 bg-[#4A3728] rounded-l-xl flex-shrink-0" />
            <div className="p-5 flex items-start gap-3">
              <Sparkles className="w-4 h-4 mt-0.5 text-[#5C4033] flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider mb-1.5">Resumen del Día con IA</p>
                <p className="text-sm text-[#4A3728] leading-relaxed">{conditions.aiSummary}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-xl border border-[#E8DFD4] shadow-sm overflow-hidden">
          <div className="flex">
            <div className="w-1 bg-[#8B2500] rounded-l-xl flex-shrink-0" />
            <div className="p-4">
              <p className="text-sm text-[#8B2500]">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Weather Card - Full Width with operational actions */}
      <WeatherCard weather={conditions?.weather} isLoading={isLoading} />

      {/* Calendar + News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CalendarCard calendar={conditions?.calendar} isLoading={isLoading} />
        <NewsImpactCard news={conditions?.news} isLoading={isLoading} />
      </div>
    </motion.div>
  );
};

export default ConditionsAIPanel;
