import { useState, useEffect, useCallback, useRef } from 'react';

export interface VehiclePosition {
  id: string;
  plate: string;
  lat: number;
  lng: number;
  heading: number;
  status: 'moving' | 'stopped' | 'delivering';
  routeNumber: string;
  driver: string;
  currentDeliveryIndex: number;
  totalDeliveries: number;
  deliveredCount: number;
  speed: number; // km/h simulated
}

export interface RoutePoint {
  lat: number;
  lng: number;
  clientName?: string;
  isDelivered?: boolean;
}

// Predefined routes in Ibagué
const IBAGUE_ROUTES = {
  NORTE: [
    { lat: 4.4425, lng: -75.2324, clientName: 'Planta Principal' },
    { lat: 4.4635, lng: -75.2165, clientName: 'Restaurante El Jordán' },
    { lat: 4.4589, lng: -75.2098, clientName: 'Asadero La Fogata' },
    { lat: 4.4542, lng: -75.2234, clientName: 'Hotel Dann Carlton' },
    { lat: 4.4501, lng: -75.2187, clientName: 'Panadería La Espiga' },
    { lat: 4.4478, lng: -75.2156, clientName: 'Pizzería Napoli' },
  ],
  CENTRO: [
    { lat: 4.4425, lng: -75.2324, clientName: 'Planta Principal' },
    { lat: 4.4385, lng: -75.2318, clientName: 'Hotel Lusitania' },
    { lat: 4.4356, lng: -75.2287, clientName: 'Restaurante Belén' },
    { lat: 4.4321, lng: -75.2345, clientName: 'Cafetería La Pola' },
    { lat: 4.4367, lng: -75.2298, clientName: 'Churrería El Español' },
    { lat: 4.4345, lng: -75.2276, clientName: 'Sazón Tolimense' },
  ],
  SUR: [
    { lat: 4.4425, lng: -75.2324, clientName: 'Planta Principal' },
    { lat: 4.4198, lng: -75.2412, clientName: 'Finca El Salado' },
    { lat: 4.4145, lng: -75.2378, clientName: 'Restaurante Cádiz' },
    { lat: 4.4087, lng: -75.2456, clientName: 'Asadero Picaleña' },
    { lat: 4.4023, lng: -75.2512, clientName: 'Hotel Campestre' },
    { lat: 4.3978, lng: -75.2567, clientName: 'Hacienda Santa Rosa' },
  ],
};

// Calculate heading between two points
const calculateHeading = (from: { lat: number; lng: number }, to: { lat: number; lng: number }): number => {
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};

// Linear interpolation between two points
const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const useGasVehicleSimulation = () => {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([
    {
      id: 'v1',
      plate: 'TIB-001',
      lat: 4.4550,
      lng: -75.2180,
      heading: 45,
      status: 'moving',
      routeNumber: 'R-NORTE-001',
      driver: 'Carlos Rodríguez',
      currentDeliveryIndex: 2,
      totalDeliveries: 5,
      deliveredCount: 2,
      speed: 35,
    },
    {
      id: 'v2',
      plate: 'TIB-002',
      lat: 4.4360,
      lng: -75.2310,
      heading: 120,
      status: 'delivering',
      routeNumber: 'R-CENTRO-001',
      driver: 'Miguel Ángel López',
      currentDeliveryIndex: 3,
      totalDeliveries: 5,
      deliveredCount: 3,
      speed: 0,
    },
    {
      id: 'v3',
      plate: 'TIB-003',
      lat: 4.4425,
      lng: -75.2324,
      heading: 180,
      status: 'stopped',
      routeNumber: 'R-SUR-001',
      driver: 'Juan David Martínez',
      currentDeliveryIndex: 0,
      totalDeliveries: 5,
      deliveredCount: 0,
      speed: 0,
    },
  ]);

  const progressRef = useRef<{ [key: string]: number }>({
    v1: 0.3,
    v2: 0.6,
    v3: 0,
  });

  const animationRef = useRef<number>();

  const updateVehicles = useCallback(() => {
    setVehicles(prev => prev.map(vehicle => {
      if (vehicle.status === 'stopped') return vehicle;

      const route = vehicle.id === 'v1' ? IBAGUE_ROUTES.NORTE :
                    vehicle.id === 'v2' ? IBAGUE_ROUTES.CENTRO :
                    IBAGUE_ROUTES.SUR;

      // Get current progress
      let progress = progressRef.current[vehicle.id] || 0;
      
      // Calculate which segment we're in
      const totalSegments = route.length - 1;
      const segmentProgress = progress * totalSegments;
      const currentSegment = Math.floor(segmentProgress);
      const segmentT = segmentProgress - currentSegment;

      if (currentSegment >= totalSegments) {
        // Route completed, restart
        progressRef.current[vehicle.id] = 0;
        return {
          ...vehicle,
          lat: route[0].lat,
          lng: route[0].lng,
          currentDeliveryIndex: 0,
          deliveredCount: 0,
          status: 'moving' as const,
        };
      }

      const from = route[currentSegment];
      const to = route[currentSegment + 1];

      // Interpolate position
      const newLat = lerp(from.lat, to.lat, segmentT);
      const newLng = lerp(from.lng, to.lng, segmentT);
      const heading = calculateHeading(from, to);

      // Simulate delivery stops
      const isNearClient = segmentT > 0.9 && currentSegment > 0;
      const newStatus = isNearClient ? 'delivering' : 'moving';
      const speed = newStatus === 'delivering' ? 0 : 25 + Math.random() * 20;

      // Update progress (slower when delivering)
      const progressIncrement = newStatus === 'delivering' ? 0.0005 : 0.002;
      progressRef.current[vehicle.id] = Math.min(1, progress + progressIncrement);

      return {
        ...vehicle,
        lat: newLat,
        lng: newLng,
        heading,
        status: newStatus,
        speed: Math.round(speed),
        deliveredCount: Math.min(currentSegment, vehicle.totalDeliveries),
        currentDeliveryIndex: Math.min(currentSegment + 1, vehicle.totalDeliveries),
      };
    }));

    animationRef.current = requestAnimationFrame(updateVehicles);
  }, []);

  useEffect(() => {
    // Start simulation
    animationRef.current = requestAnimationFrame(updateVehicles);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateVehicles]);

  const routes = {
    NORTE: IBAGUE_ROUTES.NORTE,
    CENTRO: IBAGUE_ROUTES.CENTRO,
    SUR: IBAGUE_ROUTES.SUR,
  };

  return { vehicles, routes };
};
