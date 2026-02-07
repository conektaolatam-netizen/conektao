import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, TrendingUp, Users, DollarSign } from 'lucide-react';
import { GoogleMap, useJsApiLoader, OverlayViewF, OverlayView } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDBPW9xami4sYbNYOniQh4dstgT9J943_0';

interface RegionMapData {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
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
    lat: 10.4,
    lng: -75.5,
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
    lat: 7.13,
    lng: -73.13,
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
    lat: 6.25,
    lng: -75.56,
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
    lat: 4.81,
    lng: -75.69,
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
    lat: 4.72,
    lng: -74.05,
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
    lat: 4.58,
    lng: -74.1,
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
    lat: 4.65,
    lng: -74.07,
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
    lat: 3.45,
    lng: -76.53,
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

const mapContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '420px',
  borderRadius: '0 0 16px 16px',
};

const colombiaCenter = { lat: 5.5, lng: -74.5 };

const mapStyles: google.maps.MapTypeStyle[] = [
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#E8E4DE' }] },
  { featureType: 'landscape', elementType: 'geometry.fill', stylers: [{ color: '#FAFAF8' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#D4C4B0' }, { weight: 1.5 }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#E8E4DE' }, { weight: 0.5 }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#8B7355' }] },
  { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
];

const RegionPin: React.FC<{
  region: RegionMapData;
  isSelected: boolean;
  onClick: () => void;
}> = ({ region, isSelected, onClick }) => {
  const color = getStatusColor(region.status);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="cursor-pointer flex flex-col items-center"
      style={{ transform: 'translate(-50%, -50%)' }}
    >
      {/* Pulse ring */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full animate-ping"
          style={{
            width: isSelected ? 48 : 32,
            height: isSelected ? 48 : 32,
            backgroundColor: `${color}20`,
          }}
        />
        {/* Outer glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: isSelected ? 40 : 28,
            height: isSelected ? 40 : 28,
            backgroundColor: `${color}15`,
          }}
        />
        {/* Main circle */}
        <div
          className="relative rounded-full flex items-center justify-center shadow-lg border-2 border-white"
          style={{
            width: isSelected ? 32 : 22,
            height: isSelected ? 32 : 22,
            backgroundColor: color,
          }}
        >
          <span className="text-white font-bold" style={{ fontSize: isSelected ? 11 : 8 }}>
            {region.score}
          </span>
        </div>
      </div>
      {/* Label */}
      <div
        className="mt-1 px-2 py-0.5 rounded-md bg-white/95 border shadow-sm text-center whitespace-nowrap"
        style={{ borderColor: `${color}40` }}
      >
        <span className="text-[10px] font-semibold text-[#4A3728]">{region.shortName}</span>
      </div>
    </div>
  );
};

const GeneralNationalMap: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<RegionMapData | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handlePinClick = (region: RegionMapData) => {
    const isAlreadySelected = selectedRegion?.id === region.id;
    setSelectedRegion(isAlreadySelected ? null : region);
    if (!isAlreadySelected && mapRef.current) {
      mapRef.current.panTo({ lat: region.lat, lng: region.lng });
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
            <h2 className="text-lg font-bold text-[#4A3728]">Mapa Nacional</h2>
            <p className="text-xs text-[#8B7355]">42 sucursales · 8 regiones</p>
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
            center={colombiaCenter}
            zoom={5.8}
            onLoad={onLoad}
            onClick={() => setSelectedRegion(null)}
            options={{
              styles: mapStyles,
              disableDefaultUI: true,
              zoomControl: true,
              zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
              gestureHandling: 'cooperative',
              minZoom: 5,
              maxZoom: 10,
              restriction: {
                latLngBounds: { north: 14, south: -5, west: -82, east: -66 },
                strictBounds: false,
              },
            }}
          >
            {regions.map((region) => (
              <OverlayViewF
                key={region.id}
                position={{ lat: region.lat, lng: region.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <RegionPin
                  region={region}
                  isSelected={selectedRegion?.id === region.id}
                  onClick={() => handlePinClick(region)}
                />
              </OverlayViewF>
            ))}
          </GoogleMap>
        )}

        {/* Region Popup */}
        <AnimatePresence>
          {selectedRegion && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl border border-[#E8E4DE] shadow-lg p-4 z-10"
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
