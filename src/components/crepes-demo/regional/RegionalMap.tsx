import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, TrendingUp, Users, CloudSun, DollarSign } from 'lucide-react';
import { GoogleMap, useJsApiLoader, OverlayViewF, OverlayView } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDBPW9xami4sYbNYOniQh4dstgT9J943_0';

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

const getStatusColor = (status: string) => {
  if (status === 'critical') return '#EF4444';
  if (status === 'warning') return '#F59E0B';
  return '#10B981';
};

const mapContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '420px',
  borderRadius: '0 0 16px 16px',
};

const bogotaNorteCenter = { lat: 4.675, lng: -74.05 };

const mapStyles: google.maps.MapTypeStyle[] = [
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#E8E4DE' }] },
  { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#FAFAF8' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#E8E4DE' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#F0ECE6' }] },
  { featureType: 'road.local', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#F5F0EA' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#E8F0E4' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#8B7355' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8B7355' }] },
];

const BranchPin: React.FC<{
  branch: BranchMapData;
  isSelected: boolean;
  onClick: () => void;
}> = ({ branch, isSelected, onClick }) => {
  const color = getStatusColor(branch.status);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="cursor-pointer flex flex-col items-center"
      style={{ transform: 'translate(-50%, -50%)' }}
    >
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full animate-ping"
          style={{
            width: isSelected ? 48 : 32,
            height: isSelected ? 48 : 32,
            backgroundColor: `${color}20`,
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: isSelected ? 40 : 28,
            height: isSelected ? 40 : 28,
            backgroundColor: `${color}15`,
          }}
        />
        <div
          className="relative rounded-full flex items-center justify-center shadow-lg border-2 border-white"
          style={{
            width: isSelected ? 32 : 22,
            height: isSelected ? 32 : 22,
            backgroundColor: color,
          }}
        >
          <span className="text-white font-bold" style={{ fontSize: isSelected ? 11 : 8 }}>
            {branch.score}
          </span>
        </div>
      </div>
      <div
        className="mt-1 px-2 py-0.5 rounded-md bg-white/95 border shadow-sm text-center whitespace-nowrap"
        style={{ borderColor: `${color}40` }}
      >
        <span className="text-[10px] font-semibold text-[#4A3728]">{branch.shortName}</span>
      </div>
    </div>
  );
};

const RegionalMap: React.FC = () => {
  const [selectedBranch, setSelectedBranch] = useState<BranchMapData | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handlePinClick = (branch: BranchMapData) => {
    const isAlreadySelected = selectedBranch?.id === branch.id;
    setSelectedBranch(isAlreadySelected ? null : branch);
    if (!isAlreadySelected && mapRef.current) {
      mapRef.current.panTo({ lat: branch.lat, lng: branch.lng });
    }
  };

  if (loadError) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm p-8 text-center">
        <p className="text-sm text-rose-600">Error al cargar Google Maps</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden">
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

      <div className="relative">
        {!isLoaded ? (
          <div className="flex items-center justify-center" style={{ height: 420 }}>
            <div className="animate-spin w-8 h-8 border-2 border-[#D4C4B0] border-t-[#4A3728] rounded-full" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={bogotaNorteCenter}
            zoom={14}
            onLoad={onLoad}
            onClick={() => setSelectedBranch(null)}
            options={{
              styles: mapStyles,
              disableDefaultUI: true,
              zoomControl: true,
              zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
              gestureHandling: 'cooperative',
              minZoom: 12,
              maxZoom: 18,
            }}
          >
            {branches.map((branch) => (
              <OverlayViewF
                key={branch.id}
                position={{ lat: branch.lat, lng: branch.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <BranchPin
                  branch={branch}
                  isSelected={selectedBranch?.id === branch.id}
                  onClick={() => handlePinClick(branch)}
                />
              </OverlayViewF>
            ))}
          </GoogleMap>
        )}

        {/* Branch Popup Card */}
        <AnimatePresence>
          {selectedBranch && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl border border-[#E8E4DE] shadow-lg p-4 z-10"
            >
              <button
                onClick={() => setSelectedBranch(null)}
                className="absolute top-3 right-3 p-1 text-[#8B7355] hover:text-[#4A3728] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor(selectedBranch.status) }} />
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
