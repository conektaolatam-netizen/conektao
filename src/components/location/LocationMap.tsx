import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  radius?: number;
  onLocationChange: (lat: number, lng: number) => void;
  mapboxToken?: string;
}

const LocationMap = ({
  latitude,
  longitude,
  radius = 100,
  onLocationChange,
  mapboxToken
}: LocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    if (!mapboxToken) {
      setMapError('Token de Mapbox no configurado');
      setIsLoading(false);
      return;
    }

    try {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [longitude, latitude],
        zoom: 16,
        pitch: 45,
        bearing: -17.6,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.innerHTML = `
        <div class="marker-pin">
          <div class="marker-pulse"></div>
          <div class="marker-icon">📍</div>
        </div>
      `;

      marker.current = new mapboxgl.Marker({
        element: el,
        draggable: true,
        anchor: 'bottom'
      })
        .setLngLat([longitude, latitude])
        .addTo(map.current);

      // Handle marker drag
      marker.current.on('dragend', () => {
        const lngLat = marker.current?.getLngLat();
        if (lngLat) {
          onLocationChange(lngLat.lat, lngLat.lng);
          updateRadiusCircle(lngLat.lat, lngLat.lng);
        }
      });

      // Handle map click
      map.current.on('click', (e) => {
        const { lat, lng } = e.lngLat;
        marker.current?.setLngLat([lng, lat]);
        onLocationChange(lat, lng);
        updateRadiusCircle(lat, lng);
      });

      // Add radius circle
      map.current.on('load', () => {
        setIsLoading(false);
        addRadiusCircle(latitude, longitude);
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setMapError('Error cargando el mapa');
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Error inicializando el mapa');
      setIsLoading(false);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update radius when it changes
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      updateRadiusCircle(latitude, longitude);
    }
  }, [radius]);

  const createGeoJSONCircle = (lat: number, lng: number, radiusInMeters: number) => {
    const points = 64;
    const km = radiusInMeters / 1000;
    const coords = [];

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = km / (111.32 * Math.cos((lat * Math.PI) / 180));
      const dy = km / 110.574;
      coords.push([
        lng + dx * Math.cos(angle),
        lat + dy * Math.sin(angle)
      ]);
    }
    coords.push(coords[0]); // Close the circle

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [coords]
      },
      properties: {}
    };
  };

  const addRadiusCircle = (lat: number, lng: number) => {
    if (!map.current) return;

    const circleData = createGeoJSONCircle(lat, lng, radius);

    if (map.current.getSource('radius-circle')) {
      (map.current.getSource('radius-circle') as mapboxgl.GeoJSONSource).setData(circleData as any);
    } else {
      map.current.addSource('radius-circle', {
        type: 'geojson',
        data: circleData as any
      });

      map.current.addLayer({
        id: 'radius-circle-fill',
        type: 'fill',
        source: 'radius-circle',
        paint: {
          'fill-color': '#FF6A00',
          'fill-opacity': 0.15
        }
      });

      map.current.addLayer({
        id: 'radius-circle-stroke',
        type: 'line',
        source: 'radius-circle',
        paint: {
          'line-color': '#FF6A00',
          'line-width': 2,
          'line-opacity': 0.8
        }
      });
    }
  };

  const updateRadiusCircle = (lat: number, lng: number) => {
    if (!map.current || !map.current.getSource('radius-circle')) return;
    
    const circleData = createGeoJSONCircle(lat, lng, radius);
    (map.current.getSource('radius-circle') as mapboxgl.GeoJSONSource).setData(circleData as any);
  };

  const handleZoomIn = () => map.current?.zoomIn();
  const handleZoomOut = () => map.current?.zoomOut();
  const handleReset = () => {
    map.current?.flyTo({
      center: [longitude, latitude],
      zoom: 16,
      pitch: 45,
      bearing: -17.6
    });
  };

  if (mapError) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-card/50 rounded-xl">
        <div className="text-center p-6">
          <p className="text-muted-foreground">{mapError}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Usa "Ubicación actual" para capturar coordenadas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[300px] rounded-xl overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Map Controls */}
      <div className="absolute bottom-4 left-4 flex gap-2 z-10">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="h-8 w-8 bg-card/90 backdrop-blur-sm"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="h-8 w-8 bg-card/90 backdrop-blur-sm"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleReset}
          className="h-8 w-8 bg-card/90 backdrop-blur-sm"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-center">
          Haz clic en el mapa o arrastra el marcador para ajustar la ubicación
        </div>
      </div>

      <style>{`
        .custom-marker {
          cursor: grab;
        }
        .custom-marker:active {
          cursor: grabbing;
        }
        .marker-pin {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .marker-pulse {
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: hsl(25, 100%, 50%);
          opacity: 0.4;
          animation: pulse 2s ease-out infinite;
        }
        .marker-icon {
          position: relative;
          font-size: 24px;
          z-index: 1;
        }
        @keyframes pulse {
          0% {
            transform: scale(0.5);
            opacity: 0.6;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LocationMap;
