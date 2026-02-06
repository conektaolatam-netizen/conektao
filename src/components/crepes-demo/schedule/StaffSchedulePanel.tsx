import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CloudRain, Sun, CloudSun, Cloud, 
  Users, ChefHat, IceCream, Coffee, UtensilsCrossed,
  Sparkles, TrendingUp, TrendingDown, AlertTriangle,
  Moon
} from 'lucide-react';

type Area = {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
};

type StaffMember = {
  name: string;
  area: string;
  isResting: boolean;
};

type DaySchedule = {
  day: string;
  dayShort: string;
  date: string;
  weather: { icon: React.ReactNode; label: string; temp: string };
  insight: string;
  insightType: 'positive' | 'warning' | 'neutral';
  expectedTraffic: 'alto' | 'medio' | 'bajo';
  staff: StaffMember[];
};

const areas: Area[] = [
  { id: 'meseras', name: 'Meseras', icon: <Users className="w-3.5 h-3.5" />, color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  { id: 'cocina-interna', name: 'Cocina Interna', icon: <ChefHat className="w-3.5 h-3.5" />, color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
  { id: 'estacion-crepes', name: 'Estación Crepes', icon: <UtensilsCrossed className="w-3.5 h-3.5" />, color: 'text-rose-700', bgColor: 'bg-rose-50 border-rose-200' },
  { id: 'estacion-waffles', name: 'Estación Waffles', icon: <UtensilsCrossed className="w-3.5 h-3.5" />, color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' },
  { id: 'postres', name: 'Postres y Dulces', icon: <Coffee className="w-3.5 h-3.5" />, color: 'text-pink-700', bgColor: 'bg-pink-50 border-pink-200' },
  { id: 'heladeria', name: 'Heladería', icon: <IceCream className="w-3.5 h-3.5" />, color: 'text-sky-700', bgColor: 'bg-sky-50 border-sky-200' },
  { id: 'caja', name: 'Caja Principal', icon: <Coffee className="w-3.5 h-3.5" />, color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
];

const allStaff = [
  'María Fernanda', 'Valentina', 'Daniela', 'Alejandra', 'Camila',
  'Natalia', 'Isabella', 'Sofía', 'Carolina', 'Andrea',
  'Paula', 'Juliana', 'Mariana', 'Catalina', 'Laura',
  'Gabriela', 'Luisa', 'Diana', 'Paola', 'Ángela',
  'Marcela', 'Tatiana', 'Sandra', 'Mónica',
];

const weekSchedule: DaySchedule[] = [
  {
    day: 'Lunes', dayShort: 'Lun', date: '3 Feb',
    weather: { icon: <Sun className="w-4 h-4 text-amber-500" />, label: 'Soleado', temp: '21°C' },
    insight: 'Inicio de semana tranquilo. Buen día para capacitaciones rápidas con el equipo de cocina interna.',
    insightType: 'neutral',
    expectedTraffic: 'bajo',
    staff: [
      { name: 'María Fernanda', area: 'meseras', isResting: false },
      { name: 'Valentina', area: 'meseras', isResting: false },
      { name: 'Daniela', area: 'meseras', isResting: false },
      { name: 'Alejandra', area: 'meseras', isResting: false },
      { name: 'Camila', area: 'meseras', isResting: false },
      { name: 'Natalia', area: 'meseras', isResting: false },
      { name: 'Isabella', area: 'cocina-interna', isResting: false },
      { name: 'Sofía', area: 'cocina-interna', isResting: false },
      { name: 'Carolina', area: 'cocina-interna', isResting: false },
      { name: 'Andrea', area: 'estacion-crepes', isResting: false },
      { name: 'Paula', area: 'estacion-crepes', isResting: false },
      { name: 'Juliana', area: 'estacion-waffles', isResting: false },
      { name: 'Mariana', area: 'estacion-waffles', isResting: false },
      { name: 'Catalina', area: 'postres', isResting: false },
      { name: 'Laura', area: 'heladeria', isResting: false },
      { name: 'Gabriela', area: 'heladeria', isResting: false },
      { name: 'Luisa', area: 'heladeria', isResting: false },
      { name: 'Diana', area: 'caja', isResting: false },
      { name: 'Paola', area: 'caja', isResting: false },
      { name: 'Ángela', area: 'meseras', isResting: true },
      { name: 'Marcela', area: 'meseras', isResting: true },
      { name: 'Tatiana', area: 'cocina-interna', isResting: true },
      { name: 'Sandra', area: 'estacion-crepes', isResting: true },
      { name: 'Mónica', area: 'postres', isResting: true },
    ],
  },
  {
    day: 'Martes', dayShort: 'Mar', date: '4 Feb',
    weather: { icon: <CloudSun className="w-4 h-4 text-gray-500" />, label: 'Parcial', temp: '19°C' },
    insight: 'Tráfico moderado esperado. Mantener equipo estándar. Valentina y Daniela tienen mejor rendimiento en meseras martes.',
    insightType: 'neutral',
    expectedTraffic: 'medio',
    staff: [
      { name: 'Valentina', area: 'meseras', isResting: false },
      { name: 'Daniela', area: 'meseras', isResting: false },
      { name: 'Alejandra', area: 'meseras', isResting: false },
      { name: 'Camila', area: 'meseras', isResting: false },
      { name: 'Ángela', area: 'meseras', isResting: false },
      { name: 'Marcela', area: 'meseras', isResting: false },
      { name: 'Tatiana', area: 'cocina-interna', isResting: false },
      { name: 'Sofía', area: 'cocina-interna', isResting: false },
      { name: 'Carolina', area: 'cocina-interna', isResting: false },
      { name: 'Sandra', area: 'estacion-crepes', isResting: false },
      { name: 'Paula', area: 'estacion-crepes', isResting: false },
      { name: 'Juliana', area: 'estacion-waffles', isResting: false },
      { name: 'Mariana', area: 'estacion-waffles', isResting: false },
      { name: 'Mónica', area: 'postres', isResting: false },
      { name: 'Laura', area: 'heladeria', isResting: false },
      { name: 'Gabriela', area: 'heladeria', isResting: false },
      { name: 'Luisa', area: 'heladeria', isResting: false },
      { name: 'Diana', area: 'caja', isResting: false },
      { name: 'Paola', area: 'caja', isResting: false },
      { name: 'María Fernanda', area: 'meseras', isResting: true },
      { name: 'Natalia', area: 'meseras', isResting: true },
      { name: 'Isabella', area: 'cocina-interna', isResting: true },
      { name: 'Andrea', area: 'estacion-crepes', isResting: true },
      { name: 'Catalina', area: 'postres', isResting: true },
    ],
  },
  {
    day: 'Miércoles', dayShort: 'Mié', date: '5 Feb',
    weather: { icon: <Cloud className="w-4 h-4 text-gray-400" />, label: 'Nublado', temp: '17°C' },
    insight: 'Día nublado. Históricamente +15% en sopas y bebidas calientes. Reforzar estación de postres y cocina interna.',
    insightType: 'positive',
    expectedTraffic: 'medio',
    staff: [
      { name: 'María Fernanda', area: 'meseras', isResting: false },
      { name: 'Daniela', area: 'meseras', isResting: false },
      { name: 'Natalia', area: 'meseras', isResting: false },
      { name: 'Camila', area: 'meseras', isResting: false },
      { name: 'Ángela', area: 'meseras', isResting: false },
      { name: 'Marcela', area: 'meseras', isResting: false },
      { name: 'Isabella', area: 'cocina-interna', isResting: false },
      { name: 'Sofía', area: 'cocina-interna', isResting: false },
      { name: 'Tatiana', area: 'cocina-interna', isResting: false },
      { name: 'Carolina', area: 'cocina-interna', isResting: false },
      { name: 'Andrea', area: 'estacion-crepes', isResting: false },
      { name: 'Paula', area: 'estacion-crepes', isResting: false },
      { name: 'Juliana', area: 'estacion-waffles', isResting: false },
      { name: 'Catalina', area: 'postres', isResting: false },
      { name: 'Mónica', area: 'postres', isResting: false },
      { name: 'Laura', area: 'heladeria', isResting: false },
      { name: 'Gabriela', area: 'heladeria', isResting: false },
      { name: 'Luisa', area: 'heladeria', isResting: false },
      { name: 'Diana', area: 'caja', isResting: false },
      { name: 'Paola', area: 'caja', isResting: false },
      { name: 'Valentina', area: 'meseras', isResting: true },
      { name: 'Alejandra', area: 'meseras', isResting: true },
      { name: 'Mariana', area: 'estacion-waffles', isResting: true },
      { name: 'Sandra', area: 'estacion-crepes', isResting: true },
    ],
  },
  {
    day: 'Jueves', dayShort: 'Jue', date: '6 Feb',
    weather: { icon: <CloudSun className="w-4 h-4 text-amber-400" />, label: 'Parcial', temp: '20°C' },
    insight: 'Jueves previo a fin de semana. Tráfico sube desde las 6 PM. Asegurar meseras completas en turno noche.',
    insightType: 'positive',
    expectedTraffic: 'medio',
    staff: [
      { name: 'María Fernanda', area: 'meseras', isResting: false },
      { name: 'Valentina', area: 'meseras', isResting: false },
      { name: 'Alejandra', area: 'meseras', isResting: false },
      { name: 'Camila', area: 'meseras', isResting: false },
      { name: 'Natalia', area: 'meseras', isResting: false },
      { name: 'Marcela', area: 'meseras', isResting: false },
      { name: 'Ángela', area: 'meseras', isResting: false },
      { name: 'Isabella', area: 'cocina-interna', isResting: false },
      { name: 'Sofía', area: 'cocina-interna', isResting: false },
      { name: 'Carolina', area: 'cocina-interna', isResting: false },
      { name: 'Andrea', area: 'estacion-crepes', isResting: false },
      { name: 'Sandra', area: 'estacion-crepes', isResting: false },
      { name: 'Juliana', area: 'estacion-waffles', isResting: false },
      { name: 'Mariana', area: 'estacion-waffles', isResting: false },
      { name: 'Catalina', area: 'postres', isResting: false },
      { name: 'Laura', area: 'heladeria', isResting: false },
      { name: 'Gabriela', area: 'heladeria', isResting: false },
      { name: 'Luisa', area: 'heladeria', isResting: false },
      { name: 'Diana', area: 'caja', isResting: false },
      { name: 'Paola', area: 'caja', isResting: false },
      { name: 'Daniela', area: 'meseras', isResting: true },
      { name: 'Paula', area: 'estacion-crepes', isResting: true },
      { name: 'Tatiana', area: 'cocina-interna', isResting: true },
      { name: 'Mónica', area: 'postres', isResting: true },
    ],
  },
  {
    day: 'Viernes', dayShort: 'Vie', date: '7 Feb',
    weather: { icon: <CloudRain className="w-4 h-4 text-blue-500" />, label: 'Lluvia', temp: '16°C' },
    insight: '⚠️ Lluvia fuerte pronosticada. Domicilios suben +40%. Reforzar cocina interna y empaques. Reducir 1 mesera si el salón baja.',
    insightType: 'warning',
    expectedTraffic: 'alto',
    staff: [
      { name: 'María Fernanda', area: 'meseras', isResting: false },
      { name: 'Valentina', area: 'meseras', isResting: false },
      { name: 'Daniela', area: 'meseras', isResting: false },
      { name: 'Alejandra', area: 'meseras', isResting: false },
      { name: 'Camila', area: 'meseras', isResting: false },
      { name: 'Natalia', area: 'meseras', isResting: false },
      { name: 'Ángela', area: 'meseras', isResting: false },
      { name: 'Isabella', area: 'cocina-interna', isResting: false },
      { name: 'Sofía', area: 'cocina-interna', isResting: false },
      { name: 'Carolina', area: 'cocina-interna', isResting: false },
      { name: 'Tatiana', area: 'cocina-interna', isResting: false },
      { name: 'Andrea', area: 'estacion-crepes', isResting: false },
      { name: 'Paula', area: 'estacion-crepes', isResting: false },
      { name: 'Sandra', area: 'estacion-crepes', isResting: false },
      { name: 'Juliana', area: 'estacion-waffles', isResting: false },
      { name: 'Mariana', area: 'estacion-waffles', isResting: false },
      { name: 'Catalina', area: 'postres', isResting: false },
      { name: 'Mónica', area: 'postres', isResting: false },
      { name: 'Laura', area: 'heladeria', isResting: false },
      { name: 'Gabriela', area: 'heladeria', isResting: false },
      { name: 'Luisa', area: 'heladeria', isResting: false },
      { name: 'Diana', area: 'caja', isResting: false },
      { name: 'Paola', area: 'caja', isResting: false },
      { name: 'Marcela', area: 'meseras', isResting: true },
    ],
  },
  {
    day: 'Sábado', dayShort: 'Sáb', date: '8 Feb',
    weather: { icon: <Sun className="w-4 h-4 text-amber-500" />, label: 'Soleado', temp: '22°C' },
    insight: '🔥 Día de mayor tráfico de la semana. Todo el equipo activo. Heladería será el área más demandada. Asegurar Gabriela en helados.',
    insightType: 'positive',
    expectedTraffic: 'alto',
    staff: [
      { name: 'María Fernanda', area: 'meseras', isResting: false },
      { name: 'Valentina', area: 'meseras', isResting: false },
      { name: 'Daniela', area: 'meseras', isResting: false },
      { name: 'Alejandra', area: 'meseras', isResting: false },
      { name: 'Camila', area: 'meseras', isResting: false },
      { name: 'Natalia', area: 'meseras', isResting: false },
      { name: 'Ángela', area: 'meseras', isResting: false },
      { name: 'Marcela', area: 'meseras', isResting: false },
      { name: 'Isabella', area: 'cocina-interna', isResting: false },
      { name: 'Sofía', area: 'cocina-interna', isResting: false },
      { name: 'Carolina', area: 'cocina-interna', isResting: false },
      { name: 'Tatiana', area: 'cocina-interna', isResting: false },
      { name: 'Andrea', area: 'estacion-crepes', isResting: false },
      { name: 'Paula', area: 'estacion-crepes', isResting: false },
      { name: 'Sandra', area: 'estacion-crepes', isResting: false },
      { name: 'Juliana', area: 'estacion-waffles', isResting: false },
      { name: 'Mariana', area: 'estacion-waffles', isResting: false },
      { name: 'Catalina', area: 'postres', isResting: false },
      { name: 'Mónica', area: 'postres', isResting: false },
      { name: 'Laura', area: 'heladeria', isResting: false },
      { name: 'Gabriela', area: 'heladeria', isResting: false },
      { name: 'Luisa', area: 'heladeria', isResting: false },
      { name: 'Diana', area: 'caja', isResting: false },
      { name: 'Paola', area: 'caja', isResting: false },
    ],
  },
  {
    day: 'Domingo', dayShort: 'Dom', date: '9 Feb',
    weather: { icon: <CloudSun className="w-4 h-4 text-amber-400" />, label: 'Parcial', temp: '20°C' },
    insight: 'Domingo familiar. Almuerzo será el pico fuerte (12-3 PM). Después de las 4 PM baja 35%. Se puede liberar 2 meseras a las 5 PM.',
    insightType: 'neutral',
    expectedTraffic: 'alto',
    staff: [
      { name: 'María Fernanda', area: 'meseras', isResting: false },
      { name: 'Valentina', area: 'meseras', isResting: false },
      { name: 'Daniela', area: 'meseras', isResting: false },
      { name: 'Camila', area: 'meseras', isResting: false },
      { name: 'Natalia', area: 'meseras', isResting: false },
      { name: 'Ángela', area: 'meseras', isResting: false },
      { name: 'Marcela', area: 'meseras', isResting: false },
      { name: 'Isabella', area: 'cocina-interna', isResting: false },
      { name: 'Sofía', area: 'cocina-interna', isResting: false },
      { name: 'Carolina', area: 'cocina-interna', isResting: false },
      { name: 'Andrea', area: 'estacion-crepes', isResting: false },
      { name: 'Paula', area: 'estacion-crepes', isResting: false },
      { name: 'Juliana', area: 'estacion-waffles', isResting: false },
      { name: 'Mariana', area: 'estacion-waffles', isResting: false },
      { name: 'Catalina', area: 'postres', isResting: false },
      { name: 'Laura', area: 'heladeria', isResting: false },
      { name: 'Gabriela', area: 'heladeria', isResting: false },
      { name: 'Luisa', area: 'heladeria', isResting: false },
      { name: 'Diana', area: 'caja', isResting: false },
      { name: 'Paola', area: 'caja', isResting: false },
      { name: 'Alejandra', area: 'meseras', isResting: true },
      { name: 'Tatiana', area: 'cocina-interna', isResting: true },
      { name: 'Sandra', area: 'estacion-crepes', isResting: true },
      { name: 'Mónica', area: 'postres', isResting: true },
    ],
  },
];

const trafficColors = {
  alto: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Alto' },
  medio: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Medio' },
  bajo: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Bajo' },
};

const insightColors = {
  positive: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  neutral: 'bg-[#F5EDE4] border-[#D4C4B0] text-[#5C4033]',
};

const StaffSchedulePanel = () => {
  const [selectedDay, setSelectedDay] = useState(0);
  const today = weekSchedule[selectedDay];
  const activeStaff = today.staff.filter(s => !s.isResting);
  const restingStaff = today.staff.filter(s => s.isResting);
  const traffic = trafficColors[today.expectedTraffic];

  const getStaffByArea = (areaId: string) => activeStaff.filter(s => s.area === areaId);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#E8DFD4] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#E8DFD4]/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5C4033] to-[#8B7355] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#4A3728]">Programación Semanal</h3>
              <p className="text-xs text-[#8B7355]">Organiza horarios y descansos con IA</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${traffic.bg} ${traffic.text} ${traffic.border}`}>
              Tráfico {traffic.label}
            </span>
            <span className="text-xs text-[#8B7355] bg-[#F5EDE4] px-2.5 py-1 rounded-full">
              {activeStaff.length} activas
            </span>
          </div>
        </div>

        {/* Day selector */}
        <div className="flex gap-1">
          {weekSchedule.map((day, i) => {
            const isSelected = i === selectedDay;
            const isWeekend = i >= 5;
            return (
              <button
                key={day.day}
                onClick={() => setSelectedDay(i)}
                className={`flex-1 py-2 px-1 rounded-xl text-center transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#5C4033] text-white shadow-md'
                    : isWeekend
                    ? 'bg-[#F5EDE4]/80 text-[#5C4033] hover:bg-[#E8DFD4]'
                    : 'bg-transparent text-[#8B7355] hover:bg-[#F5EDE4]'
                }`}
              >
                <div className="text-[10px] font-medium">{day.dayShort}</div>
                <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#4A3728]'}`}>{day.date.split(' ')[0]}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="p-5 space-y-4"
        >
          {/* Day header with weather */}
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-[#4A3728]">{today.day}, {today.date}</h4>
            <div className="flex items-center gap-2 text-sm text-[#8B7355]">
              {today.weather.icon}
              <span>{today.weather.label}</span>
              <span className="font-medium text-[#4A3728]">{today.weather.temp}</span>
            </div>
          </div>

          {/* AI Insight */}
          <div className={`p-3.5 rounded-xl border text-sm leading-relaxed ${insightColors[today.insightType]}`}>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-70" />
              <p>{today.insight}</p>
            </div>
          </div>

          {/* Areas with staff */}
          <div className="space-y-2.5">
            {areas.map(area => {
              const areaStaff = getStaffByArea(area.id);
              if (areaStaff.length === 0) return null;
              return (
                <div key={area.id} className={`rounded-xl border p-3 ${area.bgColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={area.color}>{area.icon}</span>
                      <span className={`text-xs font-semibold ${area.color}`}>{area.name}</span>
                    </div>
                    <span className="text-[10px] text-[#8B7355] bg-white/60 px-2 py-0.5 rounded-full">
                      {areaStaff.length} {areaStaff.length === 1 ? 'persona' : 'personas'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {areaStaff.map(s => (
                      <span
                        key={s.name}
                        className="text-xs bg-white/70 text-[#4A3728] px-2.5 py-1 rounded-lg font-medium"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resting staff */}
          {restingStaff.length > 0 && (
            <div className="rounded-xl border border-[#E8DFD4] bg-[#FDF8F3] p-3">
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-3.5 h-3.5 text-[#8B7355]" />
                <span className="text-xs font-semibold text-[#8B7355]">Descanso ({restingStaff.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {restingStaff.map(s => (
                  <span
                    key={s.name}
                    className="text-xs bg-[#E8DFD4]/50 text-[#8B7355] px-2.5 py-1 rounded-lg"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Summary bar */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E8DFD4]/60">
            <div className="flex items-center gap-4 text-[11px] text-[#8B7355]">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                {activeStaff.length} trabajando
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#D4C4B0]" />
                {restingStaff.length} descansando
              </span>
            </div>
            <span className="text-[10px] text-[#D4C4B0]">
              Total: {today.staff.length} colaboradoras
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default StaffSchedulePanel;
