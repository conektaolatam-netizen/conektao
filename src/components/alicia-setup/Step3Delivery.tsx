import React, { useState } from "react";
import { Truck, Plus, X, Navigation, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
}

type PricingMode = "fixed" | "dynamic" | "courier_collects";

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
  const [isLocating, setIsLocating] = useState(false);

  const hasLocation = restaurantLat !== null && restaurantLng !== null;

  const addZone = () => {
    if (newZone.trim() && !freeZones.includes(newZone.trim())) {
      setFreeZones([...freeZones, newZone.trim()]);
      setNewZone("");
    }
  };
  const removeZone = (z: string) => setFreeZones(freeZones.filter((x) => x !== z));

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocalización no soportada"); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setRestaurantLat(lat);
        setRestaurantLng(lng);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, { headers: { "Accept-Language": "es" } });
          if (res.ok) { const d = await res.json(); setLocationAddress(d.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`); }
        } catch { /* ignore */ }
        setIsLocating(false);
        toast.success("Ubicación capturada");
      },
      () => { setIsLocating(false); toast.error("No se pudo obtener ubicación"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
        restaurant_location: hasLocation ? { lat: restaurantLat, lng: restaurantLng, address: locationAddress } : null,
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
          {/* Location */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground/80">Ubicación del restaurante</label>
            <button type="button" onClick={handleGetLocation} disabled={isLocating} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all disabled:opacity-50">
              {isLocating ? <><Loader2 className="w-4 h-4 animate-spin" />Obteniendo...</> : <><Navigation className="w-4 h-4" />{hasLocation ? "Actualizar ubicación" : "Capturar ubicación"}</>}
            </button>
            {hasLocation && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{locationAddress || "Ubicación capturada"}</p>
                  <p className="font-mono mt-1">{restaurantLat?.toFixed(6)}, {restaurantLng?.toFixed(6)}</p>
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
