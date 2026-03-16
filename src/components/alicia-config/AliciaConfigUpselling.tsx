import React, { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, MessageCircle, ShoppingBag, ArrowUpCircle, ClipboardCheck, DollarSign, ShieldCheck } from "lucide-react";

interface Props { config: any; onSave: (field: string, value: any) => Promise<void>; }

interface SuggestConfig {
  enabled: boolean;
  respect_first_no: boolean;
  suggest_upsizing: boolean;
  suggest_complements: boolean;
  suggest_on_greeting: boolean;
  suggest_before_close: boolean;
  no_prices_in_suggestions: boolean;
  max_suggestions_per_order: number;
}

const DEFAULT_CONFIG: SuggestConfig = {
  enabled: false,
  respect_first_no: true,
  suggest_upsizing: true,
  suggest_complements: true,
  suggest_on_greeting: true,
  suggest_before_close: true,
  no_prices_in_suggestions: true,
  max_suggestions_per_order: 2,
};

export default function AliciaConfigUpselling({ config, onSave }: Props) {
  const raw = config.suggest_configs || {};
  const initial: SuggestConfig = { ...DEFAULT_CONFIG, ...raw };

  const [state, setState] = useState<SuggestConfig>(initial);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof SuggestConfig>(key: K, value: SuggestConfig[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave("suggest_configs", state);
    setSaving(false);
  };

  const switches: { key: keyof SuggestConfig; label: string; desc: string; icon: React.ElementType }[] = [
    { key: "suggest_on_greeting", label: "Sugerir al saludar", desc: "Menciona 1-2 productos populares cuando el cliente saluda", icon: MessageCircle },
    { key: "suggest_complements", label: "Sugerir complementos", desc: "Sugiere bebidas, entradas u otros complementos tras un producto principal", icon: ShoppingBag },
    { key: "suggest_upsizing", label: "Sugerir tamaños mayores", desc: "Menciona tamaños más grandes si están disponibles", icon: ArrowUpCircle },
    { key: "suggest_before_close", label: "Sugerir antes de cerrar", desc: "Una última sugerencia ligera antes de confirmar el pedido", icon: ClipboardCheck },
    { key: "no_prices_in_suggestions", label: "No mencionar precios", desc: "Alicia no incluye precios al hacer sugerencias", icon: DollarSign },
    { key: "respect_first_no", label: "Respetar el primer 'no'", desc: "Si el cliente rechaza, no insistir con más sugerencias", icon: ShieldCheck },
  ];

  return (
    <div className="bg-card border border-border/20 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><Lightbulb className="h-5 w-5 text-white" /></div>
        <div>
          <h3 className="text-lg font-semibold text-white">Sugerencias Inteligentes</h3>
          <p className="text-xs text-white/80">Alicia sugiere productos extras para subir el ticket</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Master toggle */}
        <div className="flex items-center gap-3 bg-muted rounded-lg p-4">
          <Switch checked={state.enabled} onCheckedChange={v => update("enabled", v)} />
          <div>
            <label className="text-sm text-foreground font-medium block">Sistema de sugerencias</label>
            <span className="text-xs text-muted-foreground">
              {state.enabled ? "Alicia hará sugerencias según la configuración" : "Alicia no hará ninguna sugerencia"}
            </span>
          </div>
        </div>

        {state.enabled && (
          <>
            {/* Max suggestions selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Máximo de sugerencias por momento</label>
              <p className="text-xs text-muted-foreground mb-2">Cuántas sugerencias puede hacer Alicia en cada momento de la conversación</p>
              <Select value={state.max_suggestions_per_order.toString()} onValueChange={v => update("max_suggestions_per_order", Number(v))}>
                <SelectTrigger className="w-40 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n} {n === 1 ? "sugerencia" : "sugerencias"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Individual moment switches */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-foreground mb-2">Momentos y comportamiento</label>
              {switches.map(({ key, label, desc, icon: Icon }) => (
                <div key={key} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                  <div className="bg-muted rounded-md p-1.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground block">{label}</span>
                    <span className="text-xs text-muted-foreground">{desc}</span>
                  </div>
                  <Switch checked={state[key] as boolean} onCheckedChange={v => update(key, v)} />
                </div>
              ))}
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
