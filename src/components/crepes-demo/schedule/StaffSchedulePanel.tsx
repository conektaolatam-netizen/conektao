import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CloudRain, Sun, CloudSun, Cloud, 
  Users, ChefHat, IceCream, Coffee, UtensilsCrossed,
  Sparkles, Moon, ChevronDown, X, Plus, Check
} from 'lucide-react';
import AIGlowBorder from '../ui/AIGlowBorder';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  { id: 'meseras', name: 'Meseras', icon: <Users className="w-3.5 h-3.5" />, color: 'text-[#1a1a2e]', bgColor: 'bg-white border-[#1a1a2e]/20 shadow-[0_0_8px_rgba(0,212,170,0.08)]' },
  { id: 'cocina-interna', name: 'Cocina Interna', icon: <ChefHat className="w-3.5 h-3.5" />, color: 'text-[#1a1a2e]', bgColor: 'bg-white border-[#1a1a2e]/20 shadow-[0_0_8px_rgba(255,107,53,0.08)]' },
  { id: 'estacion-crepes', name: 'Estación Crepes', icon: <UtensilsCrossed className="w-3.5 h-3.5" />, color: 'text-[#1a1a2e]', bgColor: 'bg-white border-[#1a1a2e]/20 shadow-[0_0_8px_rgba(0,212,170,0.08)]' },
  { id: 'estacion-waffles', name: 'Estación Waffles', icon: <UtensilsCrossed className="w-3.5 h-3.5" />, color: 'text-[#1a1a2e]', bgColor: 'bg-white border-[#1a1a2e]/20 shadow-[0_0_8px_rgba(255,107,53,0.08)]' },
  { id: 'postres', name: 'Postres y Dulces', icon: <Coffee className="w-3.5 h-3.5" />, color: 'text-[#1a1a2e]', bgColor: 'bg-white border-[#1a1a2e]/20 shadow-[0_0_8px_rgba(0,212,170,0.08)]' },
  { id: 'heladeria', name: 'Heladería', icon: <IceCream className="w-3.5 h-3.5" />, color: 'text-[#1a1a2e]', bgColor: 'bg-white border-[#1a1a2e]/20 shadow-[0_0_8px_rgba(255,107,53,0.08)]' },
  { id: 'caja', name: 'Caja Principal', icon: <Coffee className="w-3.5 h-3.5" />, color: 'text-[#1a1a2e]', bgColor: 'bg-white border-[#1a1a2e]/20 shadow-[0_0_8px_rgba(0,212,170,0.08)]' },
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
  alto: { bg: 'bg-white', text: 'text-red-600', border: 'border-red-400/60 shadow-[0_0_8px_rgba(239,68,68,0.15)]', label: 'Alto' },
  medio: { bg: 'bg-white', text: 'text-amber-600', border: 'border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.15)]', label: 'Medio' },
  bajo: { bg: 'bg-white', text: 'text-emerald-600', border: 'border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.15)]', label: 'Bajo' },
};

const SUNDAY_INDEX = 6;

/* ─── Shared day content (areas + resting + summary) ─── */
const DayContent = ({ staff, insight }: { staff: StaffMember[]; insight: string }) => {
  const activeStaff = staff.filter(s => !s.isResting);
  const restingStaff = staff.filter(s => s.isResting);
  const getStaffByArea = (areaId: string) => activeStaff.filter(s => s.area === areaId);

  return (
    <div className="space-y-3 pt-1">
      <AIGlowBorder borderRadius="rounded-xl">
        <div className="bg-[#1a1a2e] p-3.5">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#00D4AA]" />
            <p className="text-sm text-white/85 leading-relaxed">{insight}</p>
          </div>
        </div>
      </AIGlowBorder>

      <div className="space-y-2">
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
                <span className="text-[10px] text-[#1a1a2e]/60 bg-[#1a1a2e]/5 px-2 py-0.5 rounded-full font-medium">
                  {areaStaff.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {areaStaff.map(s => (
                  <span key={s.name} className="text-xs bg-[#1a1a2e]/5 text-[#1a1a2e] px-2.5 py-1 rounded-lg font-medium border border-[#1a1a2e]/10">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {restingStaff.length > 0 && (
        <div className="rounded-xl border border-[#F0ECE6] bg-[#FAFAF8] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="w-3.5 h-3.5 text-[#8B7355]" />
            <span className="text-xs font-semibold text-[#8B7355]">Descanso ({restingStaff.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {restingStaff.map(s => (
              <span key={s.name} className="text-xs bg-[#F0ECE6]/70 text-[#8B7355] px-2.5 py-1 rounded-lg">
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[#F0ECE6]">
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
          Total: {staff.length} colaboradoras
        </span>
      </div>
    </div>
  );
};

/* ─── Sunday AI-assisted editing content ─── */
const SundayAIContent = ({
  sundayStaff,
  insight,
  onRemoveStaff,
  onAddStaff,
  onConfirm,
  onMoveToRest,
}: {
  sundayStaff: StaffMember[];
  insight: string;
  onRemoveStaff: (name: string) => void;
  onAddStaff: (name: string, areaId: string) => void;
  onConfirm: () => void;
  onMoveToRest: (name: string) => void;
}) => {
  const [addingToArea, setAddingToArea] = useState<string | null>(null);
  const activeStaff = sundayStaff.filter(s => !s.isResting);
  const restingStaff = sundayStaff.filter(s => s.isResting);
  const getStaffByArea = (areaId: string) => activeStaff.filter(s => s.area === areaId);

  const assignedNames = new Set(sundayStaff.map(s => s.name));
  const availableStaff = allStaff.filter(n => !assignedNames.has(n));

  return (
    <div className="space-y-3 pt-1">
      {/* AI proposal insight */}
      <AIGlowBorder borderRadius="rounded-xl">
        <div className="bg-[#1a1a2e] p-3.5">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#00D4AA]" />
            <div>
              <p className="text-sm text-white/85 leading-relaxed mb-2">{insight}</p>
              <p className="text-xs text-[#00D4AA]/70 leading-relaxed">
                💡 Propongo {activeStaff.filter(s => s.area === 'meseras').length} meseras para el pico del mediodía. Después de las 4 PM puedes liberar 2.
              </p>
            </div>
          </div>
        </div>
      </AIGlowBorder>

      {/* Editable areas */}
      <div className="space-y-2">
        {areas.map(area => {
          const areaStaff = getStaffByArea(area.id);
          if (areaStaff.length === 0 && addingToArea !== area.id) return null;
          return (
            <div key={area.id} className={`rounded-xl border p-3 ${area.bgColor}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={area.color}>{area.icon}</span>
                  <span className={`text-xs font-semibold ${area.color}`}>{area.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#1a1a2e]/60 bg-[#1a1a2e]/5 px-2 py-0.5 rounded-full font-medium">
                    {areaStaff.length}
                  </span>
                  <button
                    onClick={() => setAddingToArea(addingToArea === area.id ? null : area.id)}
                    className="w-5 h-5 rounded-full bg-white/70 hover:bg-white flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3 h-3 text-[#4A3728]" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {areaStaff.map(s => (
                  <span key={s.name} className="text-xs bg-[#1a1a2e]/5 text-[#1a1a2e] px-2.5 py-1 rounded-lg font-medium border border-[#1a1a2e]/10 flex items-center gap-1.5 group">
                    {s.name}
                    <button
                      onClick={() => onMoveToRest(s.name)}
                      title="Mover a descanso"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Moon className="w-3 h-3 text-[#8B7355] hover:text-amber-600" />
                    </button>
                    <button
                      onClick={() => onRemoveStaff(s.name)}
                      title="Quitar"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-red-400 hover:text-red-600" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add staff dropdown */}
              <AnimatePresence>
                {addingToArea === area.id && availableStaff.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 pt-2 border-t border-black/5 overflow-hidden"
                  >
                    <p className="text-[10px] text-[#8B7355] mb-1.5">Disponibles:</p>
                    <div className="flex flex-wrap gap-1">
                      {availableStaff.map(name => (
                        <button
                          key={name}
                          onClick={() => {
                            onAddStaff(name, area.id);
                            setAddingToArea(null);
                          }}
                          className="text-[11px] bg-white/50 hover:bg-white text-[#4A3728] px-2 py-0.5 rounded-md transition-colors border border-black/5"
                        >
                          + {name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Resting staff (editable) */}
      {restingStaff.length > 0 && (
        <div className="rounded-xl border border-[#F0ECE6] bg-[#FAFAF8] p-3">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="w-3.5 h-3.5 text-[#8B7355]" />
            <span className="text-xs font-semibold text-[#8B7355]">Descanso ({restingStaff.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {restingStaff.map(s => (
              <span key={s.name} className="text-xs bg-[#F0ECE6]/70 text-[#8B7355] px-2.5 py-1 rounded-lg flex items-center gap-1.5 group">
                {s.name}
                <button
                  onClick={() => onRemoveStaff(s.name)}
                  title="Quitar"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-red-400 hover:text-red-600" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confirm button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onConfirm}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D4AA] to-[#FF6B35] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg"
      >
        <Check className="w-4 h-4" />
        Confirmar programación
      </motion.button>
    </div>
  );
};

/* ─── Main component ─── */
const StaffSchedulePanel = () => {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [sundayConfirmed, setSundayConfirmed] = useState(false);
  const [sundayStaff, setSundayStaff] = useState<StaffMember[]>(
    () => [...weekSchedule[SUNDAY_INDEX].staff]
  );

  const toggleDay = useCallback((index: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleRemoveSundayStaff = useCallback((name: string) => {
    setSundayStaff(prev => prev.filter(s => s.name !== name));
  }, []);

  const handleAddSundayStaff = useCallback((name: string, areaId: string) => {
    setSundayStaff(prev => [...prev, { name, area: areaId, isResting: false }]);
  }, []);

  const handleMoveToRest = useCallback((name: string) => {
    setSundayStaff(prev => prev.map(s => s.name === name ? { ...s, isResting: true } : s));
  }, []);

  const handleConfirmSunday = useCallback(() => {
    setSundayConfirmed(true);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#F0ECE6]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5C4033] to-[#8B7355] flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#4A3728]">Programación Semanal</h3>
            <p className="text-xs text-[#8B7355]">Organiza horarios y descansos con IA</p>
          </div>
        </div>
      </div>

      {/* Days accordion */}
      <div className="divide-y divide-[#F0ECE6]">
        {weekSchedule.map((day, i) => {
          const isSunday = i === SUNDAY_INDEX;
          const isSundayUnconfirmed = isSunday && !sundayConfirmed;
          const isExpanded = expandedDays.has(i);
          const staff = isSunday ? sundayStaff : day.staff;
          const activeCount = staff.filter(s => !s.isResting).length;
          const traffic = trafficColors[day.expectedTraffic];

          return (
            <Collapsible
              key={day.day}
              open={isExpanded}
              onOpenChange={() => toggleDay(i)}
            >
              {/* Trigger row */}
              <CollapsibleTrigger asChild>
                <button
                  className={`w-full px-5 py-3.5 flex items-center justify-between hover:bg-[#FAFAF8] transition-colors text-left ${
                    isSundayUnconfirmed ? 'bg-gradient-to-r from-[#00D4AA]/5 to-[#FF6B35]/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col items-center min-w-[42px]">
                      <span className="text-[10px] font-medium text-[#8B7355]">{day.dayShort}</span>
                      <span className="text-sm font-bold text-[#4A3728]">{day.date.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#8B7355]">
                      {day.weather.icon}
                      <span>{day.weather.temp}</span>
                    </div>
                    {isSundayUnconfirmed ? (
                      <span className="text-xs font-medium text-[#FF6B35] flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Programar con IA
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#8B7355]">
                        {activeCount} activas
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${traffic.bg} ${traffic.text} ${traffic.border}`}>
                      {traffic.label}
                    </span>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-[#8B7355]" />
                    </motion.div>
                  </div>
                </button>
              </CollapsibleTrigger>

              {/* Expandable content */}
              <CollapsibleContent>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="px-5 pb-5"
                    >
                      {isSundayUnconfirmed ? (
                        <SundayAIContent
                          sundayStaff={sundayStaff}
                          insight={day.insight}
                          onRemoveStaff={handleRemoveSundayStaff}
                          onAddStaff={handleAddSundayStaff}
                          onConfirm={handleConfirmSunday}
                          onMoveToRest={handleMoveToRest}
                        />
                      ) : (
                        <DayContent staff={staff} insight={day.insight} />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

export default StaffSchedulePanel;
