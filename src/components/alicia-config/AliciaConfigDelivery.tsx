import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Truck, X, Navigation, Loader2, CheckCircle2, Building2, Map } from "lucide-react";
import { toast } from "sonner";
import MapPicker from "@/components/location/MapPicker";

interface Props { config: any; onSave: (field: string, value: any) => Promise<void>; }

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

export default function AliciaConfigDelivery({ config, onSave }: Props) {
  const dc = config.delivery_config || {};
  const [enabled, setEnabled] = useState(dc.enabled ?? true);
  const [freeZones, setFreeZones] = useState<string[]>(dc.free_zones || []);
  const [paidNote, setPaidNote] = useState(dc.paid_delivery_note || "");
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<string>(dc.delivery_radius_km?.toString() || "");
  const [deliveryCost, setDeliveryCost] = useState<string>(dc.delivery_cost?.toString() || "");
  const [pricingMode, setPricingMode] = useState<PricingMode>(dc.delivery_pricing_mode || "fixed");
  const [baseFee, setBaseFee] = useState<string>(dc.base_fee?.toString() || "");
  const [pricePerKm, setPricePerKm] = useState<string>(dc.price_per_km?.toString() || "");
  const [restaurantLat, setRestaurantLat] = useState<number | null>(dc.restaurant_location?.lat ?? null);
  const [restaurantLng, setRestaurantLng] = useState<number | null>(dc.restaurant_location?.lng ?? null);
  const [locationAddress, setLocationAddress] = useState<string>(dc.restaurant_location?.address || "");
  const [locationSource, setLocationSource] = useState<LocationMode>(dc.restaurant_location?.source || "gps");
  const [locationMode, setLocationMode] = useState<LocationMode>(
    dc.restaurant_location?.source === "manual" ? "map" : (dc.restaurant_location?.source || "gps")
  );
  const [newZone, setNewZone] = useState("");
  const [saving, setSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const hasLocation = restaurantLat !== null && restaurantLng !== null;
  const businessAddress = config.location_address || "";
  const hasBusinessAddress = businessAddress.trim().length > 0;

  const addZone = () => { if (newZone.trim()) { setFreeZones([...freeZones, newZone.trim()]); setNewZone(""); } };
  const removeZone = (i: number) => setFreeZones(freeZones.filter((_, idx) => idx !== i));

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
      toast.warning("No se pudo geocodificar la dirección, se guardará como texto");
    }
    setIsGeocoding(false);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setRestaurantLat(lat);
        setRestaurantLng(lng);
        setLocationSource("gps");
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "es" } }
          );
          if (res.ok) {
            const data = await res.json();
            setLocationAddress(data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        } catch { /* ignore */ }
        setIsLocating(false);
        toast.success("Ubicación capturada por GPS");
      },
      () => { setIsLocating(false); toast.error("No se pudo obtener la ubicación"); },
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

  const handleSave = async () => {
    setSaving(true);
    await onSave("delivery_config", {
      enabled,
      free_zones: freeZones,
      paid_delivery_note: paidNote,
      delivery_radius_km: deliveryRadiusKm ? Number(deliveryRadiusKm) : null,
      delivery_cost: deliveryCost ? Number(deliveryCost) : null,
      delivery_pricing_mode: pricingMode,
      base_fee: baseFee ? Number(baseFee) : null,
      price_per_km: pricePerKm ? Number(pricePerKm) : null,
      restaurant_location: locationAddress
        ? { lat: restaurantLat, lng: restaurantLng, address: locationAddress, source: locationSource }
        : null,
      escalation_tag: "---CONSULTA_DOMICILIO---",
    });
    setSaving(false);
  };

  const sourceLabel: Record<LocationMode, string> = { business: "Tu Negocio", gps: "GPS", map: "Mapa" };
  const sourceColor: Record<LocationMode, string> = {
    business: "bg-blue-900/30 text-blue-400 border-blue-500/30",
    gps: "bg-green-900/30 text-green-400 border-green-500/30",
    map: "bg-amber-900/30 text-amber-400 border-amber-500/30",
  };

  return (
    <div className="bg-card border border-border/20 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><Truck className="h-5 w-5 text-white" /></div>
        <div><h3 className="text-lg font-semibold text-white">Domicilios</h3><p className="text-xs text-white/80">Configura cobertura, precios y validación por distancia</p></div>
      </div>
      <div className="p-5 space-y-5">
        {/* Toggle */}
        <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
          <Switch checked={enabled} onCheckedChange={setEnabled} />
          <label className="text-sm text-foreground font-medium">¿Haces domicilios?</label>
        </div>

        {enabled && (
          <>
            {/* Restaurant Location */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Ubicación del restaurante</label>
              <p className="text-xs text-muted-foreground">Se usa para calcular la distancia real al cliente</p>

              <RadioGroup value={locationMode} onValueChange={(v) => setLocationMode(v as LocationMode)} className="gap-2">
                {/* Option 1: Business address */}
                <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${!hasBusinessAddress ? "opacity-50 cursor-not-allowed border-border" : "border-border hover:bg-muted/50"}`}>
                  <RadioGroupItem value="business" disabled={!hasBusinessAddress} />
                  <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Usar dirección de "Tu Negocio"</p>
                    {hasBusinessAddress ? (
                      <p className="text-xs text-muted-foreground truncate">{businessAddress}</p>
                    ) : (
                      <p className="text-xs text-destructive">No has configurado dirección en la pestaña "Tu Negocio"</p>
                    )}
                  </div>
                </label>

                {/* Option 2: GPS */}
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="gps" />
                  <Navigation className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Capturar ubicación actual (GPS)</p>
                    <p className="text-xs text-muted-foreground">Usa el GPS de tu dispositivo</p>
                  </div>
                </label>

                {/* Option 3: Map */}
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="map" />
                  <Map className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Seleccionar en el mapa</p>
                    <p className="text-xs text-muted-foreground">Haz clic en el mapa para elegir la ubicación</p>
                  </div>
                </label>
              </RadioGroup>

              {/* Action per mode */}
              {locationMode === "business" && hasBusinessAddress && (
                <Button type="button" variant="outline" onClick={handleUseBusinessAddress} disabled={isGeocoding} className="w-full border-border">
                  {isGeocoding ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Geocodificando...</> : <><Building2 className="w-4 h-4 mr-2" />Aplicar dirección de Tu Negocio</>}
                </Button>
              )}

              {locationMode === "gps" && (
                <Button type="button" variant="outline" onClick={handleGetLocation} disabled={isLocating} className="w-full border-border">
                  {isLocating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Obteniendo ubicación...</> : <><Navigation className="w-4 h-4 mr-2" />{hasLocation && locationSource === "gps" ? "Actualizar ubicación GPS" : "Capturar ubicación actual"}</>}
                </Button>
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
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground truncate">{locationAddress}</p>
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 border ${sourceColor[locationSource]}`}>
                        {sourceLabel[locationSource]}
                      </Badge>
                    </div>
                    {hasLocation && (
                      <p className="font-mono">{restaurantLat?.toFixed(6)}, {restaurantLng?.toFixed(6)}</p>
                    )}
                    {!hasLocation && (
                      <p className="text-amber-400 text-[10px]">⚠ Sin coordenadas — validación por distancia no disponible</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Radius */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Radio de cobertura (km)</label>
              <p className="text-xs text-muted-foreground mb-1.5">Distancia máxima para hacer domicilios</p>
              <Input type="number" value={deliveryRadiusKm} onChange={e => setDeliveryRadiusKm(e.target.value)} placeholder="Ej: 6" className="border-border" min={0} step={0.5} />
            </div>

            {/* Pricing Mode */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Tipo de cobro del domicilio</label>
              <RadioGroup value={pricingMode} onValueChange={(v) => setPricingMode(v as PricingMode)} className="gap-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="fixed" />
                  <div><p className="text-sm font-medium text-foreground">Precio fijo</p><p className="text-xs text-muted-foreground">Siempre el mismo costo de domicilio</p></div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="dynamic" />
                  <div><p className="text-sm font-medium text-foreground">Precio dinámico por distancia</p><p className="text-xs text-muted-foreground">Se calcula automáticamente según la distancia</p></div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="courier_collects" />
                  <div><p className="text-sm font-medium text-foreground">Lo cobra el domiciliario</p><p className="text-xs text-muted-foreground">El cliente paga directamente al domiciliario</p></div>
                </label>
              </RadioGroup>

              {pricingMode === "fixed" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Costo del domicilio</label>
                  <Input type="number" value={deliveryCost} onChange={e => setDeliveryCost(e.target.value)} placeholder="Ej: 5000" className="border-border" min={0} />
                </div>
              )}
              {pricingMode === "dynamic" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Precio base</label>
                    <Input type="number" value={baseFee} onChange={e => setBaseFee(e.target.value)} placeholder="Ej: 3000" className="border-border" min={0} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Precio por km</label>
                    <Input type="number" value={pricePerKm} onChange={e => setPricePerKm(e.target.value)} placeholder="Ej: 1200" className="border-border" min={0} />
                  </div>
                </div>
              )}
              {pricingMode === "courier_collects" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Mensaje que Alicia dirá al cliente</label>
                  <Input value={paidNote} onChange={e => setPaidNote(e.target.value)} placeholder="El domicilio se paga al domiciliario" className="border-border" />
                </div>
              )}
            </div>

            {/* Free Zones */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Zonas con domicilio gratis</label>
              <p className="text-xs text-muted-foreground mb-1.5">En estas zonas no se cobra domicilio, sin importar el modo de precio</p>
              <div className="flex gap-2 mt-1">
                <Input value={newZone} onChange={e => setNewZone(e.target.value)} placeholder="Nombre del barrio o conjunto" onKeyDown={e => e.key === "Enter" && addZone()} className="border-border" />
                <Button variant="outline" onClick={addZone} className="border-border">Agregar</Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {freeZones.map((z, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 bg-teal-900/30 text-teal-400 border border-teal-500/30">
                    {z}<X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeZone(i)} />
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white">
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
