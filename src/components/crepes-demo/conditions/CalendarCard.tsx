import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, PartyPopper, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CalendarData {
  isHolidayToday: boolean;
  todayHoliday: string | null;
  isHolidayTomorrow: boolean;
  tomorrowHoliday: string | null;
  nextHoliday: { name: string; date: string; daysUntil: number } | null;
  recommendation: string;
  salesImpact: number;
}

interface CalendarCardProps {
  calendar: CalendarData | null;
  isLoading: boolean;
}

const CalendarCard: React.FC<CalendarCardProps> = ({ calendar, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="bg-white border-[#D4C4B0] shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-8 bg-[#E8DFD4] rounded" />
            <div className="h-4 w-32 bg-[#E8DFD4] rounded" />
            <div className="h-6 w-24 bg-[#E8DFD4] rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!calendar) return null;

  const today = new Date();
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="bg-white border-[#D4C4B0] shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-[#8B7355] font-medium mb-2">Calendario</p>
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-14 h-14 bg-gradient-to-br from-[#5C4033] to-[#8B7355] rounded-xl flex flex-col items-center justify-center text-white shadow-md"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <span className="text-xs uppercase font-medium">{monthNames[today.getMonth()].slice(0, 3)}</span>
                  <span className="text-xl font-bold">{today.getDate()}</span>
                </motion.div>
                <div>
                  <p className="font-semibold text-[#4A3728]">{dayNames[today.getDay()]}</p>
                  <p className="text-sm text-[#8B7355]">{today.getFullYear()}</p>
                </div>
              </div>
            </div>
            
            {calendar.isHolidayToday && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-sm"
              >
                <PartyPopper className="w-3 h-3" />
                Festivo
              </motion.div>
            )}
          </div>

          {/* Holiday Info */}
          {calendar.isHolidayToday && calendar.todayHoliday && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-4 p-3 bg-white rounded-lg border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.15)]"
            >
              <div className="flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800">{calendar.todayHoliday}</span>
              </div>
            </motion.div>
          )}

          {calendar.isHolidayTomorrow && calendar.tomorrowHoliday && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-4 p-3 bg-[#F5EDE4] rounded-lg border border-[#D4C4B0]"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#5C4033]" />
                <span className="text-sm text-[#4A3728]">
                  Mañana: <span className="font-medium">{calendar.tomorrowHoliday}</span>
                </span>
              </div>
            </motion.div>
          )}

          {/* Sales Impact */}
          {calendar.salesImpact !== 0 && (
            <div className="flex items-center gap-2 mb-4 p-2 bg-white rounded-lg border border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700">
                Ventas proyectadas: <span className="font-bold">+{calendar.salesImpact}%</span>
              </span>
            </div>
          )}

          {/* Next Holiday */}
          {calendar.nextHoliday && !calendar.isHolidayToday && (
            <div className="flex items-center gap-2 mb-4 text-sm text-[#6B5744]">
              <Clock className="w-4 h-4" />
              <span>
                Próximo: {calendar.nextHoliday.name} ({calendar.nextHoliday.daysUntil} días)
              </span>
            </div>
          )}

          {/* Recommendation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-3 bg-[#FDF8F3] rounded-lg border border-[#E8DFD4]"
          >
            <p className="text-sm text-[#4A3728] leading-relaxed">
              {calendar.recommendation}
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CalendarCard;
