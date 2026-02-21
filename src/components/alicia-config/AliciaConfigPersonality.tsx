import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

interface Props { config: any; onSave: (fields: Record<string, any>) => Promise<void>; }

export default function AliciaConfigPersonality({ config, onSave }: Props) {
  const pr = config.personality_rules || {};
  const esc = config.escalation_config || {};
  const [tone, setTone] = useState(pr.tone || "casual_professional");
  const [assistantName, setAssistantName] = useState(pr.name || "Alicia");
  const [greeting, setGreeting] = useState(config.greeting_message || "");
  const [humanPhone, setHumanPhone] = useState(esc.human_phone || "");
  const [escMsg, setEscMsg] = useState(esc.escalation_message || "");
  const [customRules, setCustomRules] = useState<string[]>(config.custom_rules || []);
  const [newRule, setNewRule] = useState("");
  const [saving, setSaving] = useState(false);

  const addRule = () => { if (newRule.trim()) { setCustomRules([...customRules, newRule.trim()]); setNewRule(""); } };
  const removeRule = (i: number) => setCustomRules(customRules.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      personality_rules: { ...pr, tone, name: assistantName },
      greeting_message: greeting,
      escalation_config: { human_phone: humanPhone, escalation_message: escMsg },
      custom_rules: customRules,
    });
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Personalidad de Alicia</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div><Label>Nombre del asistente</Label><Input value={assistantName} onChange={e => setAssistantName(e.target.value)} /></div>
        <div>
          <Label>Tono</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="casual_professional">Cercana y profesional</SelectItem>
              <SelectItem value="very_casual">Muy casual (amiga)</SelectItem>
              <SelectItem value="formal">Formal (usted)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Saludo inicial</Label><Textarea value={greeting} onChange={e => setGreeting(e.target.value)} rows={2} placeholder="Hola! Soy Alicia..." /></div>
        <div><Label>Teléfono de escalamiento (cuando el cliente necesita un humano)</Label><Input value={humanPhone} onChange={e => setHumanPhone(e.target.value)} placeholder="3001234567" /></div>
        <div><Label>Mensaje de escalamiento</Label><Input value={escMsg} onChange={e => setEscMsg(e.target.value)} placeholder="Comunícate al..." /></div>
        <div>
          <Label>Reglas especiales del negocio</Label>
          <div className="flex gap-2 mt-1">
            <Input value={newRule} onChange={e => setNewRule(e.target.value)} placeholder="Ej: Si piden Camarones, preguntar: pizza, entrada o fettuccine?" onKeyDown={e => e.key === "Enter" && addRule()} />
            <Button variant="outline" onClick={addRule}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {customRules.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded">
                <span className="flex-1">{r}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeRule(i)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
      </CardContent>
    </Card>
  );
}
