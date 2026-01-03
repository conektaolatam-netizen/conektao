import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useGasVehicleSimulation, VehiclePosition } from '@/hooks/useGasVehicleSimulation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Clock, Flame, AlertTriangle } from 'lucide-react';

interface GasRouteMapProps {
  mapboxToken: string;
  className?: string;
}

const GasRouteMap: React.FC<GasRouteMapProps> = ({ mapboxToken, className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const { vehicles, routes } = useGasVehicleSimulation();
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-75.2324, 4.4350], // Ibagué center
      zoom: 13,
      pitch: 45,
      bearing: -17.6,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add route lines when map loads
    map.current.on('load', () => {
      if (!map.current) return;

      // Add route sources and layers
      const routeColors = {
        NORTE: '#22c55e', // green
        CENTRO: '#3b82f6', // blue
        SUR: '#f97316', // orange
      };

      Object.entries(routes).forEach(([routeKey, points]) => {
        const coordinates = points.map(p => [p.lng, p.lat]);
        
        map.current!.addSource(`route-${routeKey}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates,
            },
          },
        });

        map.current!.addLayer({
          id: `route-line-${routeKey}`,
          type: 'line',
          source: `route-${routeKey}`,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': routeColors[routeKey as keyof typeof routeColors],
            'line-width': 4,
            'line-opacity': 0.7,
          },
        });

        // Add glowing effect
        map.current!.addLayer({
          id: `route-glow-${routeKey}`,
          type: 'line',
          source: `route-${routeKey}`,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': routeColors[routeKey as keyof typeof routeColors],
            'line-width': 12,
            'line-opacity': 0.2,
            'line-blur': 8,
          },
        });

        // Add client markers
        points.forEach((point, index) => {
          if (index === 0) return; // Skip plant

          const el = document.createElement('div');
          el.className = 'client-marker';
          el.innerHTML = `
            <div class="w-6 h-6 rounded-full bg-background/90 border-2 flex items-center justify-center text-xs font-bold" 
                 style="border-color: ${routeColors[routeKey as keyof typeof routeColors]}; color: ${routeColors[routeKey as keyof typeof routeColors]}">
              ${index}
            </div>
          `;

          new mapboxgl.Marker(el)
            .setLngLat([point.lng, point.lat])
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<div class="p-2">
                  <strong>${point.clientName}</strong>
                </div>`
              )
            )
            .addTo(map.current!);
        });
      });

      // Add plant marker
      const plantEl = document.createElement('div');
      plantEl.innerHTML = `
        <div class="relative">
          <div class="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-30"></div>
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg border-2 border-white/30">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2Z"/>
            </svg>
          </div>
        </div>
      `;
      new mapboxgl.Marker(plantEl)
        .setLngLat([-75.2324, 4.4425])
        .addTo(map.current);
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update vehicle markers
  useEffect(() => {
    if (!map.current) return;

    vehicles.forEach(vehicle => {
      const markerId = vehicle.id;
      
      if (markersRef.current[markerId]) {
        // Update existing marker
        markersRef.current[markerId].setLngLat([vehicle.lng, vehicle.lat]);
        
        // Update rotation
        const el = markersRef.current[markerId].getElement();
        const truckIcon = el.querySelector('.truck-icon');
        if (truckIcon) {
          (truckIcon as HTMLElement).style.transform = `rotate(${vehicle.heading}deg)`;
        }

        // Update status indicator
        const statusIndicator = el.querySelector('.status-indicator');
        if (statusIndicator) {
          statusIndicator.className = `status-indicator absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
            vehicle.status === 'moving' ? 'bg-green-500 animate-pulse' :
            vehicle.status === 'delivering' ? 'bg-yellow-500' :
            'bg-gray-500'
          }`;
        }
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'vehicle-marker cursor-pointer';
        el.innerHTML = `
          <div class="relative">
            <div class="status-indicator absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
              vehicle.status === 'moving' ? 'bg-green-500 animate-pulse' :
              vehicle.status === 'delivering' ? 'bg-yellow-500' :
              'bg-gray-500'
            }"></div>
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-white/20">
              <div class="truck-icon transition-transform duration-300" style="transform: rotate(${vehicle.heading}deg)">
                <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18,18.5A1.5,1.5,0,1,1,19.5,17,1.5,1.5,0,0,1,18,18.5M19.5,9.5L21.46,12H17V9.5H19.5M6,18.5A1.5,1.5,0,1,1,7.5,17,1.5,1.5,0,0,1,6,18.5M20,8H17V4H3C1.89,4,1,4.89,1,6V17H3A3,3,0,0,0,9,17H15A3,3,0,0,0,21,17H23V12L20,8Z"/>
                </svg>
              </div>
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span class="text-xs font-bold text-white bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
                ${vehicle.plate}
              </span>
            </div>
          </div>
        `;

        el.addEventListener('click', () => setSelectedVehicle(vehicle));

        const marker = new mapboxgl.Marker(el)
          .setLngLat([vehicle.lng, vehicle.lat])
          .addTo(map.current!);

        markersRef.current[markerId] = marker;
      }
    });
  }, [vehicles]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />
      
      {/* Vehicle Info Cards */}
      <div className="absolute top-4 left-4 space-y-2 max-h-[calc(100%-2rem)] overflow-auto">
        {vehicles.map(vehicle => (
          <Card 
            key={vehicle.id}
            className={`bg-background/80 backdrop-blur-xl border-border/50 cursor-pointer transition-all hover:scale-105 ${
              selectedVehicle?.id === vehicle.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => {
              setSelectedVehicle(vehicle);
              map.current?.flyTo({
                center: [vehicle.lng, vehicle.lat],
                zoom: 15,
                duration: 1000,
              });
            }}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                vehicle.status === 'moving' ? 'bg-green-500/20' :
                vehicle.status === 'delivering' ? 'bg-yellow-500/20' :
                'bg-gray-500/20'
              }`}>
                <Truck className={`w-5 h-5 ${
                  vehicle.status === 'moving' ? 'text-green-400' :
                  vehicle.status === 'delivering' ? 'text-yellow-400' :
                  'text-gray-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{vehicle.plate}</span>
                  <Badge variant="outline" className={`text-[10px] ${
                    vehicle.status === 'moving' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                    vehicle.status === 'delivering' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                    'bg-gray-500/10 text-gray-400 border-gray-500/30'
                  }`}>
                    {vehicle.status === 'moving' ? 'En movimiento' :
                     vehicle.status === 'delivering' ? 'Entregando' : 'Detenido'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{vehicle.routeNumber}</span>
                  <span>•</span>
                  <span>{vehicle.deliveredCount}/{vehicle.totalDeliveries}</span>
                </div>
              </div>
              {vehicle.speed > 0 && (
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">{vehicle.speed}</span>
                  <span className="text-xs text-muted-foreground block">km/h</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4">
        <Card className="bg-background/80 backdrop-blur-xl border-border/50">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Ruta Norte</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Ruta Centro</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">Ruta Sur</span>
            </div>
            <div className="flex items-center gap-2 text-xs pt-1 border-t border-border/50">
              <Flame className="w-3 h-3 text-orange-500" />
              <span className="text-muted-foreground">Planta GLP</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* No token warning */}
      {!mapboxToken && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Token de Mapbox requerido</h3>
              <p className="text-sm text-muted-foreground">
                Para ver el mapa de rutas, configura tu token público de Mapbox en la configuración.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GasRouteMap;
