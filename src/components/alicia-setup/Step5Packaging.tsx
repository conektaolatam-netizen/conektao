import React, { useState } from "react";
import { Package, Plus, Trash2 } from "lucide-react";

interface PackageRule {
  type: string;
  cost: number;
}

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
}

const Step5Packaging = ({ data, onSave, saving, onBack }: Props) => {
  const [rules, setRules] = useState<PackageRule[]>(
    data.packaging_rules?.length ? data.packaging_rules : []
  );
  const [skip, setSkip] = useState(false);

  const addRule = () => setRules([...rules, { type: "", cost: 0 }]);
  const removeRule = (i: number) => setRules(rules.filter((_, idx) => idx !== i));
  const updateRule = (i: number, field: string, val: any) => {
    const updated = [...rules];
    (updated[i] as any)[field] = val;
    setRules(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      packaging_rules: skip ? [] : rules.filter((r) => r.type.trim()),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Empaques</h2>
        <p className="text-muted-foreground mt-1">¿Cobras empaque para llevar? (opcional)</p>
      </div>

      <div className="flex items-center gap-3 p-4 bg-card/50 border border-border/50 rounded-xl">
        <input
          type="checkbox"
          checked={skip}
          onChange={(e) => setSkip(e.target.checked)}
          className="w-5 h-5 rounded accent-primary"
        />
        <p className="text-sm text-foreground">No cobro empaque, saltar este paso</p>
      </div>

      {!skip && (
        <>
          {rules.map((r, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={r.type}
                onChange={(e) => updateRule(i, "type", e.target.value)}
                placeholder="Tipo (ej: Pizza, Pasta)"
                className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  value={r.cost || ""}
                  onChange={(e) => updateRule(i, "cost", Number(e.target.value))}
                  placeholder="0"
                  className="w-24 px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button type="button" onClick={() => removeRule(i)} className="p-2 text-destructive/60 hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addRule} className="flex items-center gap-1 text-sm text-primary hover:underline">
            <Plus className="w-3 h-3" /> Agregar empaque
          </button>
        </>
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

export default Step5Packaging;
