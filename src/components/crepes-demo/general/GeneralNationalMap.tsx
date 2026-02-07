import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, TrendingUp, Users, DollarSign } from 'lucide-react';

interface RegionMapData {
  id: string;
  name: string;
  shortName: string;
  x: number;
  y: number;
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  branches: number;
  salesToday: number;
  salesYesterday: number;
  manager: string;
  topAlert: string | null;
}

const regions: RegionMapData[] = [
  {
    id: 'costa',
    name: 'Costa Caribe',
    shortName: 'Costa',
    x: 220, y: 55,
    score: 83,
    status: 'healthy',
    branches: 5,
    salesToday: 18300000,
    salesYesterday: 67000000,
    manager: 'Andrés Marín',
    topAlert: null,
  },
  {
    id: 'santanderes',
    name: 'Santanderes',
    shortName: 'Santanderes',
    x: 200, y: 140,
    score: 87,
    status: 'healthy',
    branches: 3,
    salesToday: 9600000,
    salesYesterday: 36000000,
    manager: 'Lucía Pardo',
    topAlert: null,
  },
  {
    id: 'medellin',
    name: 'Medellín',
    shortName: 'Medellín',
    x: 140, y: 175,
    score: 90,
    status: 'healthy',
    branches: 6,
    salesToday: 24500000,
    salesYesterday: 89000000,
    manager: 'Juliana Restrepo',
    topAlert: null,
  },
  {
    id: 'eje-cafetero',
    name: 'Eje Cafetero',
    shortName: 'Eje Cafetero',
    x: 155, y: 225,
    score: 68,
    status: 'critical',
    branches: 4,
    salesToday: 9200000,
    salesYesterday: 38000000,
    manager: 'Natalia Giraldo',
    topAlert: 'Pereira (58%) y Armenia (65%) en estado crítico',
  },
  {
    id: 'bogota-norte',
    name: 'Bogotá Norte',
    shortName: 'Bog. Norte',
    x: 235, y: 200,
    score: 81,
    status: 'warning',
    branches: 5,
    salesToday: 20100000,
    salesYesterday: 74000000,
    manager: 'Carlos Mendoza',
    topAlert: 'San Martín (62%) necesita atención',
  },
  {
    id: 'bogota-sur',
    name: 'Bogotá Sur',
    shortName: 'Bog. Sur',
    x: 250, y: 230,
    score: 85,
    status: 'healthy',
    branches: 4,
    salesToday: 15200000,
    salesYesterday: 58000000,
    manager: 'Andrea López',
    topAlert: null,
  },
  {
    id: 'bogota-centro',
    name: 'Bogotá Centro',
    shortName: 'Bog. Centro',
    x: 270, y: 210,
    score: 88,
    status: 'warning',
    branches: 3,
    salesToday: 11800000,
    salesYesterday: 45000000,
    manager: 'Felipe Herrera',
    topAlert: 'Calle 90 (71%) con rotación alta',
  },
  {
    id: 'cali',
    name: 'Cali',
    shortName: 'Cali',
    x: 120, y: 275,
    score: 86,
    status: 'healthy',
    branches: 4,
    salesToday: 14800000,
    salesYesterday: 56000000,
    manager: 'Roberto Caicedo',
    topAlert: null,
  },
];

const getStatusColor = (status: string) => {
  if (status === 'critical') return '#EF4444';
  if (status === 'warning') return '#F59E0B';
  return '#10B981';
};

const GeneralNationalMap: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<RegionMapData | null>(null);
  const mapWidth = 420;
  const mapHeight = 380;

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-[#F0ECE6]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A3728] to-[#6B5744] flex items-center justify-center shadow-sm">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#4A3728]">Mapa Nacional</h2>
            <p className="text-xs text-[#8B7355]">42 sucursales · 8 regiones</p>
          </div>
        </div>
      </div>

      <div className="relative px-3 py-3">
        <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="w-full h-auto" style={{ maxHeight: '380px' }}>
          <defs>
            <radialGradient id="nationalMapBg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#FAFAF8" />
              <stop offset="100%" stopColor="#F5EDE4" />
            </radialGradient>
          </defs>
          <rect width={mapWidth} height={mapHeight} fill="url(#nationalMapBg)" rx="12" />

          {/* Simplified Colombia silhouette */}
          <path
            d="M180,30 Q220,25 260,40 Q300,55 310,80 Q315,110 300,130 Q290,150 280,170 Q275,190 280,210 Q285,230 270,255 Q260,275 240,290 Q220,305 200,320 Q180,335 160,330 Q140,320 120,300 Q105,280 100,260 Q95,240 100,220 Q108,200 115,185 Q120,170 115,150 Q110,130 120,110 Q130,90 145,70 Q155,55 170,40 Z"
            fill="#F0ECE6"
            stroke="#D4C4B0"
            strokeWidth="1.5"
          />

          {/* Region pins */}
          {regions.map((region) => {
            const color = getStatusColor(region.status);
            const isSelected = selectedRegion?.id === region.id;

            return (
              <g key={region.id} onClick={() => setSelectedRegion(isSelected ? null : region)} className="cursor-pointer">
                <motion.circle
                  cx={region.x} cy={region.y}
                  r={isSelected ? 30 : 20}
                  fill="none" stroke={color} strokeWidth={1} opacity={0.3}
                  animate={{ r: isSelected ? [30, 38] : [20, 27], opacity: [0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <circle cx={region.x} cy={region.y} r={isSelected ? 16 : 10} fill={`${color}20`} />
                <circle cx={region.x} cy={region.y} r={isSelected ? 10 : 7} fill={color} stroke="white" strokeWidth={2} />
                <text x={region.x} y={region.y + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={isSelected ? 7 : 5.5} fontWeight="bold">
                  {region.score}
                </text>
                <rect x={region.x - 28} y={region.y + (isSelected ? 16 : 12)} width={56} height={14} rx={3} fill="white" stroke={color} strokeWidth={0.5} opacity={0.95} />
                <text x={region.x} y={region.y + (isSelected ? 24 : 20)} textAnchor="middle" dominantBaseline="middle" fill="#4A3728" fontSize={6} fontWeight="600">
                  {region.shortName}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Region Popup */}
        <AnimatePresence>
          {selectedRegion && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-4 left-4 right-4 bg-white rounded-xl border border-[#E8E4DE] shadow-lg p-4 z-10"
            >
              <button onClick={() => setSelectedRegion(null)} className="absolute top-3 right-3 p-1 text-[#8B7355] hover:text-[#4A3728]">
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor(selectedRegion.status) }} />
                <h4 className="text-sm font-bold text-[#4A3728]">{selectedRegion.name}</h4>
                <span className={`text-xs font-bold ml-auto ${
                  selectedRegion.score >= 85 ? 'text-emerald-600' :
                  selectedRegion.score >= 70 ? 'text-amber-600' : 'text-rose-600'
                }`}>{selectedRegion.score}%</span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-[#FAFAF8] rounded-lg">
                  <DollarSign className="w-3 h-3 mx-auto text-[#8B7355] mb-0.5" />
                  <p className="text-[10px] text-[#8B7355]">Hoy</p>
                  <p className="text-xs font-bold text-[#4A3728]">{(selectedRegion.salesToday / 1000000).toFixed(1)}M</p>
                </div>
                <div className="text-center p-2 bg-[#FAFAF8] rounded-lg">
                  <TrendingUp className="w-3 h-3 mx-auto text-[#8B7355] mb-0.5" />
                  <p className="text-[10px] text-[#8B7355]">Ayer</p>
                  <p className="text-xs font-bold text-[#4A3728]">{(selectedRegion.salesYesterday / 1000000).toFixed(0)}M</p>
                </div>
                <div className="text-center p-2 bg-[#FAFAF8] rounded-lg">
                  <Users className="w-3 h-3 mx-auto text-[#8B7355] mb-0.5" />
                  <p className="text-[10px] text-[#8B7355]">Sucursales</p>
                  <p className="text-xs font-bold text-[#4A3728]">{selectedRegion.branches}</p>
                </div>
              </div>

              <div className="text-[11px] text-[#6B5744] mb-1">
                <span className="font-semibold">Gerente:</span> {selectedRegion.manager}
              </div>

              {selectedRegion.topAlert && (
                <div className="p-2.5 bg-gradient-to-r from-rose-50 to-amber-50 rounded-lg border border-rose-200 mt-2">
                  <p className="text-[11px] text-rose-700">⚠️ {selectedRegion.topAlert}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GeneralNationalMap;
