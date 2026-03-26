import React, { useState } from "react";
import { Truck, Plus, X, Navigation, Loader2, CheckCircle2, Building2, Map } from "lucide-react";
import { toast } from "sonner";
import MapPicker from "@/components/location/MapPicker";

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
}

type PricingMode = "fixed" | "dynamic" | "courier_collects";
type LocationMode = "business" | "gps" | "map";

const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number; display: string } | null> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { "Accept-Language": "es" } }
    );
    if (res.ok) {
      const results = await res.json();
      if (results.length > 0) {
        return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon), display: results[0].display_name };
      }
    }
  } catch { /* ignore */ }
  return null;
};

const Step3Delivery = ({ data, onSave, saving, onBack }: Props) => {
  const config = data.delivery_config || {};
  const [enabled, setEnabled] = useState(config.enabled ?? true);
  const [freeZones, setFreeZones] = useState<string[]>(config.free_zones || []);
  const [newZone, setNewZone] = useState("");
  const [paidNote, setPaidNote] = useState(config.paid_delivery_note || "");
  const [pickupOnly, setPickupOnly] = useState(config.pickup_only_details || "");
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<string>(config.delivery_radius_km?.toString() || "");
  const [pricingMode, setPricingMode] = useState<PricingMode>(config.delivery_pricing_mode || "fixed");
  const [deliveryCost, setDeliveryCost] = useState<string>(config.delivery_cost?.toString() || "");
  const [baseFee, setBaseFee] = useState<string>(config.base_fee?.toString() || "");
  const [pricePerKm, setPricePerKm] = useState<string>(config.price_per_km?.toString() || "");
  const [restaurantLat, setRestaurantLat] = useState<number | null>(config.restaurant_location?.lat ?? null);
  const [restaurantLng, setRestaurantLng] = useState<number | null>(config.restaurant_location?.lng ?? null);
  const [locationAddress, setLocationAddress] = useState<string>(config.restaurant_location?.address || "");
  const [locationSource, setLocationSource] = useState<LocationMode>(config.restaurant_location?.source || "gps");
  const [locationMode, setLocationMode] = useState<LocationMode>(
    config.restaurant_location?.source === "manual" ? "map" : (config.restaurant_location?.source || "gps")
  );
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const hasLocation = restaurantLat !== null && restaurantLng !== null;
  const businessAddress = data.location_address || "";
  const hasBusinessAddress = businessAddress.trim().length > 0;

  const addZone = () => {
    if (newZone.trim() && !freeZones.includes(newZone.trim())) {
      setFreeZones([...freeZones, newZone.trim()]);
      setNewZone("");
    }
  };
  const removeZone = (z: string) => setFreeZones(freeZones.filter((x) => x !== z));

  const handleUseBusinessAddress = async () => {
    if (!hasBusinessAddress) return;
    setIsGeocoding(true);
    const result = await geocodeAddress(businessAddress);
    if (result) {
      setRestaurantLat(result.lat);
      setRestaurantLng(result.lng);
      setLocationAddress(businessAddress);
      setLocationSource("business");
      toast.success("Dirección de Tu Negocio aplicada");
    } else {
      setRestaurantLat(null);
      setRestaurantLng(null);
      setLocationAddress(businessAddress);
      setLocationSource("business");
      toast.warning("No se pudo geocodificar, se guardará como texto");
    }
    setIsGeocoding(false);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocalización no soportada"); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setRestaurantLat(lat);
        setRestaurantLng(lng);
        setLocationSource("gps");
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, { headers: { "Accept-Language": "es" } });
          if (res.ok) { const d = await res.json(); setLocationAddress(d.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`); }
        } catch { /* ignore */ }
        setIsLocating(false);
        toast.success("Ubicación capturada por GPS");
      },
      () => { setIsLocating(false); toast.error("No se pudo obtener ubicación"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMapSelect = (lat: number, lng: number, address: string) => {
    setRestaurantLat(lat);
    setRestaurantLng(lng);
    setLocationAddress(address);
    setLocationSource("map");
    toast.success("Ubicación seleccionada en el mapa");
  };

  const sourceLabel: Record<LocationMode, string> = { business: "Tu Negocio", gps: "GPS", map: "Mapa" };
  const sourceColor: Record<LocationMode, string> = {
    business: "bg-blue-900/30 text-blue-400 border-blue-500/30",
    gps: "bg-green-900/30 text-green-400 border-green-500/30",
    map: "bg-amber-900/30 text-amber-400 border-amber-500/30",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      delivery_config: {
        enabled,
        free_zones: freeZones,
        paid_delivery_note: paidNote,
        pickup_only_details: pickupOnly,
        delivery_radius_km: deliveryRadiusKm ? Number(deliveryRadiusKm) : null,
        delivery_pricing_mode: pricingMode,
        delivery_cost: deliveryCost ? Number(deliveryCost) : null,
        base_fee: baseFee ? Number(baseFee) : null,
        price_per_km: pricePerKm ? Number(pricePerKm) : null,
        restaurant_location: locationAddress
          ? { lat: restaurantLat, lng: restaurantLng, address: locationAddress, source: locationSource }
          : null,
        escalation_tag: "---CONSULTA_DOMICILIO---",
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">¿Haces domicilios?</h2>
      </div>

      <div className="flex gap-4">
        <button type="button" onClick={() => setEnabled(true)} className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${enabled ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
          Sí, hacemos domicilio
        </button>
        <button type="button" onClick={() => setEnabled(false)} className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${!enabled ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
          Solo recogida
        </button>
      </div>

      {enabled ? (
        <>
          {/* Location mode selector */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground/80">Ubicación del restaurante</label>
            <div className="grid gap-2">
              {/* Business */}
              <button type="button" onClick={() => hasBusinessAddress && setLocationMode("business")}
                disabled={!hasBusinessAddress}
                className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${locationMode === "business" ? "border-primary bg-primary/10" : "border-border"} ${!hasBusinessAddress ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Usar dirección de "Tu Negocio"</p>
                    {hasBusinessAddress ? (
                      <p className="text-xs text-muted-foreground truncate">{businessAddress}</p>
                    ) : (
                      <p className="text-xs text-destructive">No configurada en paso anterior</p>
                    )}
                  </div>
                </div>
              </button>
              {/* GPS */}
              <button type="button" onClick={() => setLocationMode("gps")}
                className={`text-left px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${locationMode === "gps" ? "border-primary bg-primary/10" : "border-border"}`}>
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Capturar ubicación actual (GPS)</p>
                    <p className="text-xs text-muted-foreground">Usa el GPS de tu dispositivo</p>
                  </div>
                </div>
              </button>
              {/* Map */}
              <button type="button" onClick={() => setLocationMode("map")}
                className={`text-left px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${locationMode === "map" ? "border-primary bg-primary/10" : "border-border"}`}>
                <div className="flex items-center gap-2">
                  <Map className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Seleccionar en el mapa</p>
                    <p className="text-xs text-muted-foreground">Haz clic en el mapa para elegir la ubicación</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Action per mode */}
            {locationMode === "business" && hasBusinessAddress && (
              <button type="button" onClick={handleUseBusinessAddress} disabled={isGeocoding}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all disabled:opacity-50">
                {isGeocoding ? <><Loader2 className="w-4 h-4 animate-spin" />Geocodificando...</> : <><Building2 className="w-4 h-4" />Aplicar dirección de Tu Negocio</>}
              </button>
            )}
            {locationMode === "gps" && (
              <button type="button" onClick={handleGetLocation} disabled={isLocating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all disabled:opacity-50">
                {isLocating ? <><Loader2 className="w-4 h-4 animate-spin" />Obteniendo...</> : <><Navigation className="w-4 h-4" />{hasLocation && locationSource === "gps" ? "Actualizar ubicación GPS" : "Capturar ubicación"}</>}
              </button>
            )}
            {locationMode === "map" && (
              <MapPicker
                lat={restaurantLat}
                lng={restaurantLng}
                onSelect={handleMapSelect}
              />
            )}

            {/* Current location result */}
            {locationAddress && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground truncate">{locationAddress}</p>
                    <span className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-semibold ${sourceColor[locationSource]}`}>
                      {sourceLabel[locationSource]}
                    </span>
                  </div>
                  {hasLocation && <p className="font-mono">{restaurantLat?.toFixed(6)}, {restaurantLng?.toFixed(6)}</p>}
                  {!hasLocation && <p className="text-amber-400 text-[10px]">⚠ Sin coordenadas — validación por distancia no disponible</p>}
                </div>
              </div>
            )}
          </div>

          {/* Radius */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">Radio de cobertura (km)</label>
            <input type="number" value={deliveryRadiusKm} onChange={e => setDeliveryRadiusKm(e.target.value)} placeholder="Ej: 6" min={0} step={0.5}
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          {/* Pricing mode */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground/80">Tipo de cobro del domicilio</label>
            <div className="grid gap-2">
              {([
                { value: "fixed", label: "Precio fijo", desc: "Siempre el mismo costo" },
                { value: "dynamic", label: "Por distancia", desc: "Se calcula automáticamente" },
                { value: "courier_collects", label: "Lo cobra el domiciliario", desc: "Pago directo" },
              ] as const).map(opt => (
                <button key={opt.value} type="button" onClick={() => setPricingMode(opt.value)}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition-all ${pricingMode === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs opacity-70">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional pricing fields */}
          {pricingMode === "fixed" && (
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Costo del domicilio</label>
              <input type="number" value={deliveryCost} onChange={e => setDeliveryCost(e.target.value)} placeholder="Ej: 5000" min={0}
                className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          )}
          {pricingMode === "dynamic" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1.5">Precio base</label>
                <input type="number" value={baseFee} onChange={e => setBaseFee(e.target.value)} placeholder="3000" min={0}
                  className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1.5">Precio por km</label>
                <input type="number" value={pricePerKm} onChange={e => setPricePerKm(e.target.value)} placeholder="1200" min={0}
                  className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
          )}
          {pricingMode === "courier_collects" && (
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Mensaje que Alicia dirá al cliente</label>
              <input type="text" value={paidNote} onChange={e => setPaidNote(e.target.value)} placeholder='Ej: "El domicilio se paga al domiciliario"'
                className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          )}

          {/* Free zones */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">Zonas con domicilio gratis</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={newZone} onChange={e => setNewZone(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addZone())} placeholder="Nombre del barrio o conjunto"
                className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <button type="button" onClick={addZone} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {freeZones.map((z) => (
                <span key={z} className="flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
                  {z}<button type="button" onClick={() => removeZone(z)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">Detalles de recogida (opcional)</label>
          <input type="text" value={pickupOnly} onChange={e => setPickupOnly(e.target.value)} placeholder='Ej: "Recoge en la barra, te avisamos cuando esté listo"'
            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
      )}

      <div className="flex gap-3">
        {onBack && (
          <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl font-semibold border border-border text-foreground hover:bg-muted transition-all">← Atrás</button>
        )}
        <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all disabled:opacity-50">
          {saving ? "Guardando..." : "Siguiente →"}
        </button>
      </div>
    </form>
  );
};

export default Step3Delivery;
