import React, { useState } from "react";
import { Truck, Plus, X } from "lucide-react";

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
}

const Step3Delivery = ({ data, onSave, saving, onBack }: Props) => {
  const config = data.delivery_config || {};
  const [enabled, setEnabled] = useState(config.enabled ?? true);
  const [freeZones, setFreeZones] = useState<string[]>(config.free_zones || []);
  const [newZone, setNewZone] = useState("");
  const [paidNote, setPaidNote] = useState(config.paid_delivery_note || "");
  const [pickupOnly, setPickupOnly] = useState(config.pickup_only_details || "");

  const addZone = () => {
    if (newZone.trim() && !freeZones.includes(newZone.trim())) {
      setFreeZones([...freeZones, newZone.trim()]);
      setNewZone("");
    }
  };

  const removeZone = (z: string) => setFreeZones(freeZones.filter((x) => x !== z));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      delivery_config: {
        enabled,
        free_zones: freeZones,
        paid_delivery_note: paidNote,
        pickup_only_details: pickupOnly,
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
        <button
          type="button"
          onClick={() => setEnabled(true)}
          className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${
            enabled ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
          }`}
        >
          Sí, hacemos domicilio
        </button>
        <button
          type="button"
          onClick={() => setEnabled(false)}
          className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${
            !enabled ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
          }`}
        >
          Solo recogida
        </button>
      </div>

      {enabled ? (
        <>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">
              Zonas con domicilio gratis
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addZone())}
                placeholder="Nombre del barrio o conjunto"
                className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="button"
                onClick={addZone}
                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {freeZones.map((z) => (
                <span key={z} className="flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
                  {z}
                  <button type="button" onClick={() => removeZone(z)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1.5">
              ¿Cómo funciona el cobro del domicilio fuera de zona gratis?
            </label>
            <input
              type="text"
              value={paidNote}
              onChange={(e) => setPaidNote(e.target.value)}
              placeholder='Ej: "El domicilio se paga directamente al domiciliario"'
              className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">
            Detalles de recogida (opcional)
          </label>
          <input
            type="text"
            value={pickupOnly}
            onChange={(e) => setPickupOnly(e.target.value)}
            placeholder='Ej: "Recoge en la barra, te avisamos cuando esté listo"'
            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      )}

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

export default Step3Delivery;
