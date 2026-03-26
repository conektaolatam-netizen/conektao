import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2 } from "lucide-react";

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onSelect: (lat: number, lng: number, address: string) => void;
  className?: string;
}

function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "es" } }
    );
    if (res.ok) {
      const data = await res.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  } catch { /* ignore */ }
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

export default function MapPicker({ lat, lng, onSelect, className }: MapPickerProps) {
  const defaultLat = lat ?? 4.711;
  const defaultLng = lng ?? -74.072;
  const [markerPos, setMarkerPos] = useState<[number, number]>(
    lat !== null && lng !== null ? [lat, lng] : [defaultLat, defaultLng]
  );
  const [isReversing, setIsReversing] = useState(false);

  useEffect(() => {
    if (lat !== null && lng !== null) {
      setMarkerPos([lat, lng]);
    }
  }, [lat, lng]);

  const handleClick = useCallback(async (clickLat: number, clickLng: number) => {
    setMarkerPos([clickLat, clickLng]);
    setIsReversing(true);
    const address = await reverseGeocode(clickLat, clickLng);
    setIsReversing(false);
    onSelect(clickLat, clickLng, address);
  }, [onSelect]);

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border ${className || ""}`}>
      <MapContainer
        center={[defaultLat, defaultLng]}
        zoom={14}
        style={{ height: "260px", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={markerPos} />
        <ClickHandler onSelect={handleClick} />
        {lat !== null && lng !== null && <RecenterMap lat={lat} lng={lng} />}
      </MapContainer>
      {isReversing && (
        <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs text-muted-foreground border border-border">
          <Loader2 className="w-3 h-3 animate-spin" />
          Obteniendo dirección...
        </div>
      )}
      <p className="text-[10px] text-muted-foreground text-center py-1.5 bg-muted/50">
        Haz clic en el mapa para seleccionar la ubicación
      </p>
    </div>
  );
}
