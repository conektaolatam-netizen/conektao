import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, Trash2, Plus } from "lucide-react";

interface Props { config: any; onSave: (field: string, value: any) => Promise<void>; }

export default function AliciaConfigRestrictions({ config, onSave }: Props) {
  const allRules: string[] = config.custom_rules || [];
  const restrictionRules = allRules.filter(r => r.startsWith("[RESTRICCION]")).map(r => r.replace("[RESTRICCION] ", ""));
  
  const [noDeliveryProducts, setNoDeliveryProducts] = useState(restrictionRules.some(r => r.includes("NO domicilio")));
  const [noDeliveryText, setNoDeliveryText] = useState(restrictionRules.find(r => r.includes("NO domicilio"))?.replace("Productos NO domicilio: ", "") || "");
  const [timeRestrictions, setTimeRestrictions] = useState(restrictionRules.some(r => r.includes("horario")));
  const [timeText, setTimeText] = useState(restrictionRules.find(r => r.includes("horario"))?.replace("Restricción horario: ", "") || "");
  const [sizeRestrictions, setSizeRestrictions] = useState(restrictionRules.some(r => r.includes("tamaño")));
  const [sizeText, setSizeText] = useState(restrictionRules.find(r => r.includes("tamaño"))?.replace("Restricción tamaño: ", "") || "");
  const [otherRestrictions, setOtherRestrictions] = useState<string[]>(
    restrictionRules.filter(r => !r.includes("NO domicilio") && !r.includes("horario") && !r.includes("tamaño"))
  );
  const [newRestriction, setNewRestriction] = useState("");
  const [saving, setSaving] = useState(false);

  const addOther = () => { if (newRestriction.trim()) { setOtherRestrictions([...otherRestrictions, newRestriction.trim()]); setNewRestriction(""); } };
  const removeOther = (i: number) => setOtherRestrictions(otherRestrictions.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    const newRestrictions: string[] = [];
    if (noDeliveryProducts && noDeliveryText.trim()) newRestrictions.push(`[RESTRICCION] Productos NO domicilio: ${noDeliveryText.trim()}`);
    if (timeRestrictions && timeText.trim()) newRestrictions.push(`[RESTRICCION] Restricción horario: ${timeText.trim()}`);
    if (sizeRestrictions && sizeText.trim()) newRestrictions.push(`[RESTRICCION] Restricción tamaño: ${sizeText.trim()}`);
    otherRestrictions.forEach(r => newRestrictions.push(`[RESTRICCION] ${r}`));

    const otherRules = allRules.filter(r => !r.startsWith("[RESTRICCION]"));
    await onSave("custom_rules", [...otherRules, ...newRestrictions]);
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border/20 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><ShieldAlert className="h-5 w-5 text-white" /></div>
        <div><h3 className="text-lg font-semibold text-white">Restricciones</h3><p className="text-xs text-white/80">¿Hay algo que Alicia NO deba ofrecer?</p></div>
      </div>
      <div className="p-5 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
            <Switch checked={noDeliveryProducts} onCheckedChange={setNoDeliveryProducts} />
            <label className="text-sm text-foreground">¿Hay productos que NO vendes en domicilio?</label>
          </div>
          {noDeliveryProducts && (
            <Input value={noDeliveryText} onChange={e => setNoDeliveryText(e.target.value)} placeholder="Ej: Helados, sopas, platos especiales..." className="border-border ml-4" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
            <Switch checked={timeRestrictions} onCheckedChange={setTimeRestrictions} />
            <label className="text-sm text-foreground">¿Hay horarios donde ciertos productos no están disponibles?</label>
          </div>
          {timeRestrictions && (
            <Input value={timeText} onChange={e => setTimeText(e.target.value)} placeholder="Ej: Desayunos solo hasta las 11am, Almuerzos ejecutivos solo entre semana" className="border-border ml-4" />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
            <Switch checked={sizeRestrictions} onCheckedChange={setSizeRestrictions} />
            <label className="text-sm text-foreground">¿Hay tamaños o presentaciones que no manejas?</label>
          </div>
          {sizeRestrictions && (
            <Input value={sizeText} onChange={e => setSizeText(e.target.value)} placeholder="Ej: No hay tamaño familiar en pasta, las pizzas solo vienen en personal y mediana" className="border-border ml-4" />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Otras restricciones</label>
          <div className="flex gap-2">
            <Input value={newRestriction} onChange={e => setNewRestriction(e.target.value)} placeholder="Ej: No vendemos alcohol después de las 11pm" onKeyDown={e => e.key === "Enter" && addOther()} className="border-border" />
            <Button variant="outline" onClick={addOther} className="border-border"><Plus className="h-4 w-4" /></Button>
          </div>
          {otherRestrictions.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {otherRestrictions.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-red-900/20 border border-red-500/30 p-2.5 rounded-lg">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <span className="flex-1 text-foreground">{r}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-red-500" onClick={() => removeOther(i)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white">
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}