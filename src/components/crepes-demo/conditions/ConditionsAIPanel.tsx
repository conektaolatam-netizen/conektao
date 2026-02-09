import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import WeatherCard from './WeatherCard';
import CalendarCard from './CalendarCard';
import NewsImpactCard from './NewsImpactCard';
import AIGlowBorder from '../ui/AIGlowBorder';

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
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D4AA] to-[#FF6B35] flex items-center justify-center shadow-lg"
            animate={{ 
              boxShadow: ['0 4px 20px rgba(0,212,170,0.2)', '0 4px 30px rgba(255,107,53,0.3)', '0 4px 20px rgba(0,212,170,0.2)']
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
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

      {/* AI Summary - Dark Futuristic Card */}
      {conditions?.aiSummary && (
        <AIGlowBorder>
          <div className="bg-[#1a1a2e] p-5 relative overflow-hidden">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
            <div className="relative flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="mt-0.5"
              >
                <Sparkles className="w-5 h-5 text-[#00D4AA]" />
              </motion.div>
              <div>
                <p className="text-xs font-medium text-[#00D4AA]/70 mb-1.5 uppercase tracking-wider">Resumen del Día con IA</p>
                <p className="text-white/90 text-sm leading-relaxed">{conditions.aiSummary}</p>
              </div>
            </div>
          </div>
        </AIGlowBorder>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-rose-400/60 bg-white shadow-[0_0_10px_rgba(244,63,94,0.12)]">
          <CardContent className="p-4">
            <p className="text-rose-700 text-sm">{error}</p>
          </CardContent>
        </Card>
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
