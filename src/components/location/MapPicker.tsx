import React, { useCallback, useEffect, useRef, useState } from "react";
import L, { type LeafletMouseEvent, type Map as LeafletMap, type Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2 } from "lucide-react";

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onSelect: (lat: number, lng: number, address: string) => void;
  className?: string;
}

const ensureLeafletMarkerIcons = () => {
  const iconDefault = L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown };
  if (iconDefault._getIconUrl) {
    delete iconDefault._getIconUrl;
  }

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
};

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "es" } },
    );

    if (res.ok) {
      const data = await res.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  } catch {
    // ignore
  }

  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

export default function MapPicker({ lat, lng, onSelect, className }: MapPickerProps) {
  const defaultLat = lat ?? 4.711;
  const defaultLng = lng ?? -74.072;

  const [markerPos, setMarkerPos] = useState<[number, number]>(
    lat !== null && lng !== null ? [lat, lng] : [defaultLat, defaultLng],
  );
  const [isReversing, setIsReversing] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const latestRequestRef = useRef(0);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const handleMapSelect = useCallback(async (clickLat: number, clickLng: number) => {
    setMarkerPos([clickLat, clickLng]);

    const requestId = ++latestRequestRef.current;
    setIsReversing(true);
    const address = await reverseGeocode(clickLat, clickLng);

    if (requestId !== latestRequestRef.current) return;

    setIsReversing(false);
    onSelectRef.current(clickLat, clickLng, address);
  }, []);

  useEffect(() => {
    if (lat !== null && lng !== null) {
      setMarkerPos([lat, lng]);
    }
  }, [lat, lng]);

  useEffect(() => {
    ensureLeafletMarkerIcons();

    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 14,
      scrollWheelZoom: true,
    });

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markerRef.current = L.marker(markerPos).addTo(map);

    const onMapClick = (event: LeafletMouseEvent) => {
      void handleMapSelect(event.latlng.lat, event.latlng.lng);
    };

    map.on("click", onMapClick);

    return () => {
      map.off("click", onMapClick);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [defaultLat, defaultLng, handleMapSelect, markerPos]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng(markerPos);
    }

    if (mapRef.current) {
      mapRef.current.setView(markerPos, mapRef.current.getZoom());
    }
  }, [markerPos]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-border ${className || ""}`}>
      <div ref={mapContainerRef} style={{ height: "260px", width: "100%" }} />

      {isReversing && (
        <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
          <Loader2 className="h-3 w-3 animate-spin" />
          Obteniendo dirección...
        </div>
      )}

      <p className="bg-muted/50 py-1.5 text-center text-[10px] text-muted-foreground">
        Haz clic en el mapa para seleccionar la ubicación
      </p>
    </div>
  );
}
