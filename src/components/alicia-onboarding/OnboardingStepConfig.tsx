import React, { useState } from "react";
import { Settings, Plus, X } from "lucide-react";

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
}

const PAYMENT_OPTIONS = [
  { key: "efectivo", label: "Efectivo" },
  { key: "nequi", label: "Nequi" },
  { key: "daviplata", label: "Daviplata" },
  { key: "transferencia", label: "Transferencia bancaria" },
  { key: "tarjeta", label: "Tarjeta (datafono)" },
  { key: "wompi", label: "Wompi / PSE" },
];

const OnboardingStepConfig = ({ data, onSave, saving, onBack }: Props) => {
  const dc = data.delivery_config || {};
  const pc = data.payment_config || {};
  const oh = data.operating_hours || {};

  const [foodType, setFoodType] = useState(data.restaurant_description || "");
  const [city, setCity] = useState(data.location_address || "");
  const [neighborhood, setNeighborhood] = useState(data.location_details || "");
  const [openTime, setOpenTime] = useState(oh.open || "10:00");
  const [closeTime, setCloseTime] = useState(oh.close || "22:00");
  const [prepStartTime, setPrepStartTime] = useState(oh.prep_start || "09:30");
  const [deliveryEnabled, setDeliveryEnabled] = useState(dc.enabled ?? true);
  const [deliveryTime, setDeliveryTime] = useState(dc.estimated_time || "30-45 min");
  const [minOrder, setMinOrder] = useState(dc.min_order || "");
  const [selectedPayments, setSelectedPayments] = useState<string[]>(pc.methods || ["efectivo", "nequi"]);
  const [specialRules, setSpecialRules] = useState((data.custom_rules || []).join("\n"));

  // Delivery zones
  const [zones, setZones] = useState<{ name: string; cost: string }[]>(
    dc.zones || [{ name: "", cost: "" }]
  );

  const addZone = () => setZones([...zones, { name: "", cost: "" }]);
  const removeZone = (i: number) => setZones(zones.filter((_, idx) => idx !== i));
  const updateZone = (i: number, field: "name" | "cost", val: string) => {
    const copy = [...zones];
    copy[i][field] = val;
    setZones(copy);
  };

  const togglePayment = (key: string) => {
    setSelectedPayments((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodType.trim() || !city.trim()) {
      return;
    }

    const rulesArray = specialRules.split("\n").filter((r: string) => r.trim());
    const validZones = zones.filter((z) => z.name.trim() && z.cost.trim());

    onSave({
      restaurant_description: foodType.trim(),
      restaurant_name: data.restaurant_name,
      location_address: city.trim(),
      location_details: neighborhood.trim(),
      delivery_enabled: deliveryEnabled,
      operating_hours: {
        open: openTime,
        close: closeTime,
        prep_start: prepStartTime,
      },
      delivery_config: {
        estimated_time: deliveryTime,
        min_order: minOrder ? Number(minOrder) : 0,
        zones: validZones.map((z) => ({ name: z.name, cost: Number(z.cost) })),
      },
      payment_config: {
        methods: selectedPayments,
      },
      custom_rules: rulesArray,
    });
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
          <Settings className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Configura tu restaurante</h2>
        <p className="text-muted-foreground mt-1">ALICIA necesita conocer tu negocio</p>
      </div>

      {/* Food type */}
      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">
          ¿Qué tipo de comida vendes? *
        </label>
        <input
          type="text"
          value={foodType}
          onChange={(e) => setFoodType(e.target.value)}
          placeholder="Pizzas artesanales, hamburguesas gourmet, comida colombiana..."
          className={inputClass}
          required
        />
      </div>

      {/* City & neighborhood */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">
            Ciudad *
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Bogotá"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">
            Barrio
          </label>
          <input
            type="text"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            placeholder="Chapinero"
            className={inputClass}
          />
        </div>
      </div>

      {/* Hours */}
      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">Horarios</label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Preparación desde</p>
            <input type="time" value={prepStartTime} onChange={(e) => setPrepStartTime(e.target.value)} className={inputClass} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Abre</p>
            <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={inputClass} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Cierra</p>
            <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Delivery toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border">
        <span className="text-sm font-medium text-foreground">¿Haces domicilios?</span>
        <button
          type="button"
          onClick={() => setDeliveryEnabled(!deliveryEnabled)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
            deliveryEnabled
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {deliveryEnabled ? "Sí" : "No"}
        </button>
      </div>

      {deliveryEnabled && (
        <>
          {/* Delivery zones */}
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">
              Zonas de entrega y costos
            </label>
            <div className="space-y-2">
              {zones.map((z, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={z.name}
                    onChange={(e) => updateZone(i, "name", e.target.value)}
                    placeholder="Zona / barrio"
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    type="number"
                    value={z.cost}
                    onChange={(e) => updateZone(i, "cost", e.target.value)}
                    placeholder="$"
                    className={`${inputClass} w-24`}
                  />
                  {zones.length > 1 && (
                    <button type="button" onClick={() => removeZone(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addZone} className="text-sm text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Agregar zona
              </button>
            </div>
          </div>

          {/* Delivery time & min order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                Tiempo estimado
              </label>
              <input
                type="text"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="30-45 min"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                Pedido mínimo ($)
              </label>
              <input
                type="number"
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder="15000"
                className={inputClass}
              />
            </div>
          </div>
        </>
      )}

      {/* Payment methods */}
      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-2">
          Métodos de pago aceptados
        </label>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_OPTIONS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => togglePayment(p.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                selectedPayments.includes(p.key)
                  ? "bg-primary/15 border-primary text-primary"
                  : "bg-muted/50 border-border text-muted-foreground hover:border-border/80"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Special rules */}
      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">
          Reglas especiales (opcional)
        </label>
        <textarea
          value={specialRules}
          onChange={(e) => setSpecialRules(e.target.value)}
          placeholder={"Solo un sabor por pizza\nNo hacemos mitad y mitad\nPedidos después de las 9pm tienen recargo"}
          rows={3}
          className={`${inputClass} resize-none`}
        />
        <p className="text-xs text-muted-foreground mt-1">Una regla por línea</p>
      </div>

      <div className="flex gap-3">
        {onBack && (
          <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl font-semibold border border-border text-foreground hover:bg-muted transition-all">
            ← Atrás
          </button>
        )}
        <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all disabled:opacity-50">
          {saving ? "Guardando..." : "Siguiente →"}
        </button>
      </div>
    </form>
  );
};

export default OnboardingStepConfig;
