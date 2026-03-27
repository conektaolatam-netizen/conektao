import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Smile, Ban, ListChecks } from "lucide-react";

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
  const [prohibitedWords, setProhibitedWords] = useState<string[]>(pr.prohibited_words || []);
  const [newProhibited, setNewProhibited] = useState("");
  const [rules, setRules] = useState<string[]>(pr.rules || []);
  const [newFormatRule, setNewFormatRule] = useState("");
  const [saving, setSaving] = useState(false);

  const addRule = () => { if (newRule.trim()) { setCustomRules([...customRules, newRule.trim()]); setNewRule(""); } };
  const removeRule = (i: number) => setCustomRules(customRules.filter((_, idx) => idx !== i));

  const addProhibited = () => { if (newProhibited.trim()) { setProhibitedWords([...prohibitedWords, newProhibited.trim()]); setNewProhibited(""); } };
  const removeProhibited = (i: number) => setProhibitedWords(prohibitedWords.filter((_, idx) => idx !== i));

  const addFormatRule = () => { if (newFormatRule.trim()) { setRules([...rules, newFormatRule.trim()]); setNewFormatRule(""); } };
  const removeFormatRule = (i: number) => setRules(rules.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      personality_rules: { ...pr, tone, name: assistantName, prohibited_words: prohibitedWords, rules },
      greeting_message: greeting,
      escalation_config: { human_phone: humanPhone, escalation_message: escMsg },
      custom_rules: customRules,
    });
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border/20 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><Smile className="h-5 w-5 text-white" /></div>
        <div><h3 className="text-lg font-semibold text-white">Personalidad de Alicia</h3><p className="text-xs text-white/80">¿Cómo quieres que hable Alicia?</p></div>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">¿Cómo se llama tu asistente?</label>
          <Input value={assistantName} onChange={e => setAssistantName(e.target.value)} className="border-border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">¿Qué tono debe usar?</label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="casual_professional">Cercana y profesional</SelectItem>
              <SelectItem value="very_casual">Muy casual (como una amiga)</SelectItem>
              <SelectItem value="formal">Formal (de usted)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Saludo inicial</label>
          <Textarea value={greeting} onChange={e => setGreeting(e.target.value)} rows={2} placeholder="¡Hola! Soy Alicia, ¿en qué te puedo ayudar?" className="border-border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Si el cliente necesita un humano, ¿a qué número lo envías?</label>
          <Input value={humanPhone} onChange={e => setHumanPhone(e.target.value)} placeholder="3001234567" className="border-border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Mensaje de escalamiento</label>
          <Input value={escMsg} onChange={e => setEscMsg(e.target.value)} placeholder="Comunícate al..." className="border-border" />
        </div>

        {/* Prohibited Words */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
            <Ban className="h-4 w-4 text-destructive" /> Palabras prohibidas adicionales
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Palabras o frases que Alicia NUNCA debe usar (además de las prohibidas por defecto como "mi amor", "cariño", etc.)
          </p>
          <div className="flex gap-2">
            <Input value={newProhibited} onChange={e => setNewProhibited(e.target.value)} placeholder='Ej: "parcero", "amiguita"' onKeyDown={e => e.key === "Enter" && addProhibited()} className="border-border" />
            <Button variant="outline" onClick={addProhibited} className="border-border"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
            {prohibitedWords.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-destructive/10 p-2 rounded-lg border border-destructive/20">
                <span className="flex-1 text-foreground">"{w}"</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeProhibited(i)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        </div>

        {/* Format / Style Rules */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
            <ListChecks className="h-4 w-4 text-primary" /> Reglas de formato y estilo adicionales
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Instrucciones sobre cómo debe escribir Alicia (además de las reglas base de formato)
          </p>
          <div className="flex gap-2">
            <Input value={newFormatRule} onChange={e => setNewFormatRule(e.target.value)} placeholder='Ej: "Usar siempre COP en vez de $"' onKeyDown={e => e.key === "Enter" && addFormatRule()} className="border-border" />
            <Button variant="outline" onClick={addFormatRule} className="border-border"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
            {rules.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm bg-primary/10 p-2 rounded-lg border border-primary/20">
                <span className="flex-1 text-foreground">{r}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFormatRule(i)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        </div>

        {/* Business Rules (existing) */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Consideraciones especiales del negocio</label>
          <p className="text-xs text-muted-foreground mb-2">Instrucciones que Alicia tomará en cuenta al interactuar</p>
          <div className="flex gap-2">
            <Input value={newRule} onChange={e => setNewRule(e.target.value)} placeholder={"Ej: Tono ante quejas: empático, transparente, responsable, profesional"} onKeyDown={e => e.key === "Enter" && addRule()} className="border-border" />
            <Button variant="outline" onClick={addRule} className="border-border"><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
            {customRules.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm bg-muted p-2.5 rounded-lg">
                <span className="flex-1 text-foreground">{r}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeRule(i)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white">
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
