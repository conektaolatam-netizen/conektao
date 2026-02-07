import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, TrendingUp, Users, CloudSun, DollarSign } from 'lucide-react';

interface BranchMapData {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  salesToday: number;
  salesYesterday: number;
  staffPresent: string;
  aiRecommendation: string;
}

const branches: BranchMapData[] = [
  {
    id: 'andino',
    name: 'Crepes Andino',
    shortName: 'Andino',
    lat: 4.6669,
    lng: -74.0530,
    score: 92,
    status: 'healthy',
    salesToday: 5800000,
    salesYesterday: 18500000,
    staffPresent: '12/12',
    aiRecommendation: 'Mejor desempeño regional. Mantener estrategia de upselling actual.',
  },
  {
    id: 'zona-t',
    name: 'Crepes Zona T',
    shortName: 'Zona T',
    lat: 4.6697,
    lng: -74.0524,
    score: 87,
    status: 'healthy',
    salesToday: 4300000,
    salesYesterday: 16200000,
    staffPresent: '8/10',
    aiRecommendation: 'Lluvia prevista mañana. Reforzar operación de domicilios y promover bebidas calientes.',
  },
  {
    id: 'santa-fe',
    name: 'Crepes Santafé',
    shortName: 'Santafé',
    lat: 4.6517,
    lng: -74.0577,
    score: 84,
    status: 'healthy',
    salesToday: 4100000,
    salesYesterday: 15300000,
    staffPresent: '9/10',
    aiRecommendation: 'Monitorear tiempos de entrega a domicilio. 1 reclamo registrado hoy.',
  },
  {
    id: 'unicentro',
    name: 'Crepes Unicentro',
    shortName: 'Unicentro',
    lat: 4.7032,
    lng: -74.0428,
    score: 78,
    status: 'warning',
    salesToday: 3100000,
    salesYesterday: 12800000,
    staffPresent: '7/9',
    aiRecommendation: 'Tiempo de servicio de 14 min. Revisar rotación de turnos en horas pico 12-14h.',
  },
  {
    id: 'san-martin',
    name: 'Crepes San Martín',
    shortName: 'San Martín',
    lat: 4.6748,
    lng: -74.0626,
    score: 62,
    status: 'critical',
    salesToday: 2800000,
    salesYesterday: 11200000,
    staffPresent: '6/9',
    aiRecommendation: 'URGENTE: 3 ausencias, errores de preparación constantes, diferencia de caja. Requiere visita presencial.',
  },
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

// Map coordinates to SVG positions (simplified Bogotá north zone)
const mapBounds = {
  minLat: 4.645,
  maxLat: 4.71,
  minLng: -74.07,
  maxLng: -74.035,
};

const latLngToXY = (lat: number, lng: number, width: number, height: number) => {
  const x = ((lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng)) * width;
  const y = height - ((lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat)) * height;
  return { x, y };
};

const RegionalMap: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<BranchMapData | null>(null);
  const mapWidth = 500;
  const mapHeight = 380;

  const getStatusColor = (status: string) => {
    if (status === 'critical') return '#EF4444';
    if (status === 'warning') return '#F59E0B';
    return '#10B981';
  };

  const getPulseColor = (status: string) => {
    if (status === 'critical') return 'rgba(239,68,68,0.3)';
    if (status === 'warning') return 'rgba(245,158,11,0.3)';
    return 'rgba(16,185,129,0.2)';
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#F0ECE6]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A3728] to-[#6B5744] flex items-center justify-center shadow-sm">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#4A3728]">Mapa Regional</h2>
            <p className="text-xs text-[#8B7355]">Bogotá Norte · 5 sucursales</p>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="relative px-3 py-3">
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-auto"
          style={{ maxHeight: '380px' }}
        >
          {/* Background with subtle grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F0ECE6" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="mapBg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#FAFAF8" />
              <stop offset="100%" stopColor="#F5EDE4" />
            </radialGradient>
          </defs>
          <rect width={mapWidth} height={mapHeight} fill="url(#mapBg)" rx="12" />
          <rect width={mapWidth} height={mapHeight} fill="url(#grid)" rx="12" />

          {/* Street-like lines for context */}
          <line x1="0" y1={mapHeight * 0.3} x2={mapWidth} y2={mapHeight * 0.35} stroke="#E8E4DE" strokeWidth="2" strokeDasharray="8,4" />
          <line x1={mapWidth * 0.2} y1="0" x2={mapWidth * 0.25} y2={mapHeight} stroke="#E8E4DE" strokeWidth="2" strokeDasharray="8,4" />
          <line x1={mapWidth * 0.6} y1="0" x2={mapWidth * 0.55} y2={mapHeight} stroke="#E8E4DE" strokeWidth="1.5" strokeDasharray="6,4" />
          <line x1="0" y1={mapHeight * 0.7} x2={mapWidth} y2={mapHeight * 0.65} stroke="#E8E4DE" strokeWidth="1.5" strokeDasharray="6,4" />

          {/* Branch pins */}
          {branches.map((branch) => {
            const { x, y } = latLngToXY(branch.lat, branch.lng, mapWidth, mapHeight);
            const color = getStatusColor(branch.status);
            const isSelected = selectedBranch?.id === branch.id;

            return (
              <g key={branch.id} onClick={() => setSelectedBranch(isSelected ? null : branch)} className="cursor-pointer">
                {/* Pulse ring */}
                <motion.circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 28 : 18}
                  fill="none"
                  stroke={color}
                  strokeWidth={1}
                  opacity={0.3}
                  animate={{
                    r: isSelected ? [28, 35] : [18, 25],
                    opacity: [0.3, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                {/* Base circle */}
                <motion.circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 22 : 14}
                  fill={getPulseColor(branch.status)}
                  animate={{ scale: isSelected ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 1.5, repeat: isSelected ? Infinity : 0 }}
                />
                {/* Pin dot */}
                <circle cx={x} cy={y} r={isSelected ? 10 : 7} fill={color} stroke="white" strokeWidth={2} />
                {/* Score label */}
                <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={isSelected ? 8 : 6} fontWeight="bold">
                  {branch.score}
                </text>
                {/* Name label */}
                <rect x={x - 30} y={y + (isSelected ? 16 : 12)} width={60} height={16} rx={4} fill="white" stroke={color} strokeWidth={0.5} opacity={0.95} />
                <text x={x} y={y + (isSelected ? 25 : 21)} textAnchor="middle" dominantBaseline="middle" fill="#4A3728" fontSize={7} fontWeight="600">
                  {branch.shortName}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Branch Popup Card */}
        <AnimatePresence>
          {selectedBranch && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-4 left-4 right-4 bg-white rounded-xl border border-[#E8E4DE] shadow-lg p-4 z-10"
            >
              <button
                onClick={() => setSelectedBranch(null)}
                className="absolute top-3 right-3 p-1 text-[#8B7355] hover:text-[#4A3728] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: getStatusColor(selectedBranch.status) }} />
                <h4 className="text-sm font-bold text-[#4A3728]">{selectedBranch.name}</h4>
                <span className={`text-xs font-bold ml-auto ${
                  selectedBranch.score >= 85 ? 'text-emerald-600' :
                  selectedBranch.score >= 70 ? 'text-amber-600' : 'text-rose-600'
                }`}>
                  {selectedBranch.score}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-[#FAFAF8] rounded-lg">
                  <DollarSign className="w-3 h-3 mx-auto text-[#8B7355] mb-0.5" />
                  <p className="text-[10px] text-[#8B7355]">Hoy</p>
                  <p className="text-xs font-bold text-[#4A3728]">{(selectedBranch.salesToday / 1000000).toFixed(1)}M</p>
                </div>
                <div className="text-center p-2 bg-[#FAFAF8] rounded-lg">
                  <TrendingUp className="w-3 h-3 mx-auto text-[#8B7355] mb-0.5" />
                  <p className="text-[10px] text-[#8B7355]">Ayer</p>
                  <p className="text-xs font-bold text-[#4A3728]">{(selectedBranch.salesYesterday / 1000000).toFixed(1)}M</p>
                </div>
                <div className="text-center p-2 bg-[#FAFAF8] rounded-lg">
                  <Users className="w-3 h-3 mx-auto text-[#8B7355] mb-0.5" />
                  <p className="text-[10px] text-[#8B7355]">Personal</p>
                  <p className="text-xs font-bold text-[#4A3728]">{selectedBranch.staffPresent}</p>
                </div>
              </div>

              <div className="p-2.5 bg-gradient-to-r from-[#FAFAF8] to-[#F5EDE4] rounded-lg border border-[#F0ECE6]">
                <div className="flex items-start gap-1.5">
                  <CloudSun className="w-3.5 h-3.5 text-[#8B7355] mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-[#4A3728] leading-relaxed">{selectedBranch.aiRecommendation}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RegionalMap;
