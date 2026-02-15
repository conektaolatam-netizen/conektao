import React, { useState } from "react";
import { CreditCard } from "lucide-react";

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
}

const METHODS = [
  { key: "transferencia", label: "Transferencia bancaria" },
  { key: "efectivo", label: "Efectivo" },
  { key: "datafono", label: "Datáfono / tarjeta" },
  { key: "nequi", label: "Nequi" },
  { key: "daviplata", label: "Daviplata" },
];

const Step4Payments = ({ data, onSave, saving, onBack }: Props) => {
  const config = data.payment_config || {};
  const [methods, setMethods] = useState<string[]>(config.methods || []);
  const [bankDetails, setBankDetails] = useState(config.bank_details || "");
  const [requireProof, setRequireProof] = useState(config.require_proof ?? true);

  const toggleMethod = (key: string) => {
    setMethods((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      payment_config: { methods, bank_details: bankDetails, require_proof: requireProof },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">¿Cómo te pagan?</h2>
        <p className="text-muted-foreground mt-1">Selecciona los métodos que aceptas</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {METHODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => toggleMethod(m.key)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              methods.includes(m.key)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-border/80"
            }`}
          >
            <span className="text-sm font-medium">{m.label}</span>
          </button>
        ))}
      </div>

      {methods.includes("transferencia") && (
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">
            Datos bancarios para transferencia
          </label>
          <textarea
            value={bankDetails}
            onChange={(e) => setBankDetails(e.target.value)}
            placeholder="Ej: Bancolombia Ahorros 123-456789-00, NIT 900123456"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
          />
        </div>
      )}

      <div className="flex items-center gap-3 p-4 bg-card/50 border border-border/50 rounded-xl">
        <input
          type="checkbox"
          checked={requireProof}
          onChange={(e) => setRequireProof(e.target.checked)}
          className="w-5 h-5 rounded accent-primary"
        />
        <div>
          <p className="text-sm font-medium text-foreground">Pedir foto del comprobante</p>
          <p className="text-xs text-muted-foreground">ALICIA pedirá comprobante al cliente</p>
        </div>
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

export default Step4Payments;
