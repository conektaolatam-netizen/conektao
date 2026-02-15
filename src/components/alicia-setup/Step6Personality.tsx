import React, { useState } from "react";
import { Sparkles } from "lucide-react";

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
}

const TONES = [
  { key: "casual_professional", label: "Cercana y profesional", desc: "Natural, cálida pero con respeto" },
  { key: "very_casual", label: "Muy casual", desc: "Como una amiga, usa jerga local" },
  { key: "formal", label: "Profesional", desc: "Más formal, trato de usted" },
];

const Step6Personality = ({ data, onSave, saving, onBack }: Props) => {
  const config = data.personality_rules || {};
  const escConfig = data.escalation_config || {};
  const [tone, setTone] = useState(config.tone || "casual_professional");
  const [humanPhone, setHumanPhone] = useState(escConfig.human_phone || "");
  const [customRules, setCustomRules] = useState(
    (data.custom_rules || []).join("\n")
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rulesArray = customRules.split("\n").filter((r: string) => r.trim());
    onSave({
      personality_rules: {
        ...config,
        tone,
        name: "Alicia",
      },
      escalation_config: {
        human_phone: humanPhone,
        escalation_message: humanPhone
          ? `Claro, comunícate al ${humanPhone} y con gusto te atienden 😊`
          : "",
      },
      custom_rules: rulesArray,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Personalidad de ALICIA</h2>
        <p className="text-muted-foreground mt-1">¿Cómo quieres que hable con tus clientes?</p>
      </div>

      <div className="space-y-3">
        {TONES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTone(t.key)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              tone === t.key
                ? "border-primary bg-primary/10"
                : "border-border hover:border-border/80"
            }`}
          >
            <p className={`font-semibold text-sm ${tone === t.key ? "text-primary" : "text-foreground"}`}>
              {t.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">
          Teléfono de escalamiento (cuando ALICIA no pueda resolver)
        </label>
        <input
          type="tel"
          value={humanPhone}
          onChange={(e) => setHumanPhone(e.target.value)}
          placeholder="3001234567"
          className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-1.5">
          Reglas especiales de tu negocio (una por línea)
        </label>
        <textarea
          value={customRules}
          onChange={(e) => setCustomRules(e.target.value)}
          placeholder={"Solo un sabor por pizza\nNo hacemos mitad y mitad\nCrea Tu Pizza: escalar a humano"}
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Reglas que ALICIA debe respetar siempre
        </p>
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

export default Step6Personality;
