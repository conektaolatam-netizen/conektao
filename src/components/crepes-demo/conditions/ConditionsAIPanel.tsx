import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B7355] to-[#5C4033] flex items-center justify-center shadow-lg"
            animate={{ 
              boxShadow: ['0 4px 20px rgba(92,64,51,0.2)', '0 4px 30px rgba(92,64,51,0.35)', '0 4px 20px rgba(92,64,51,0.2)']
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-[#F5EDE4]" />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold text-[#4A3728]">IA de Condiciones</h2>
            <div className="flex items-center gap-1 text-sm text-[#8B7355]">
              <MapPin className="w-3 h-3" />
              <span>{city}</span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchConditions}
          disabled={isLoading}
          className="border-[#D4C4B0] text-[#5C4033] hover:bg-[#F5EDE4] hover:border-[#8B7355]"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* AI Summary */}
      {conditions?.aiSummary && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-[#5C4033] to-[#6B5744] text-white border-0 overflow-hidden relative shadow-lg">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
            <CardContent className="p-6 relative">
              <div className="flex items-start gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6 text-[#E8DFD4]" />
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-[#E8DFD4]/80 mb-2">Resumen del Día con IA</p>
                  <p className="text-white leading-relaxed">{conditions.aiSummary}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="p-4">
            <p className="text-rose-700 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Conditions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WeatherCard weather={conditions?.weather} isLoading={isLoading} />
        <CalendarCard calendar={conditions?.calendar} isLoading={isLoading} />
        <NewsImpactCard news={conditions?.news} isLoading={isLoading} />
      </div>
    </motion.div>
  );
};

export default ConditionsAIPanel;
