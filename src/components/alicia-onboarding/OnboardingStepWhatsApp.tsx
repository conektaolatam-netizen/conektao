import React, { useState } from "react";
import { MessageSquare, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
}

const OnboardingStepWhatsApp = ({ onSave, saving, onBack }: Props) => {
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) return;
    onSave({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Prepara tu número de WhatsApp</h2>
        <p className="text-muted-foreground mt-1">
          Para que ALICIA funcione, necesitas un número limpio
        </p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-foreground text-sm">Importante antes de continuar</p>
            <p className="text-sm text-muted-foreground mt-1">
              El número que uses para ALICIA <strong>no puede tener WhatsApp instalado</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3">Tienes 2 opciones:</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Usa un nuevo SIM</p>
                <p className="text-xs text-muted-foreground">
                  Un número que nunca se haya registrado en WhatsApp
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Elimina WhatsApp de ese número</p>
                <p className="text-xs text-muted-foreground">
                  Ve a WhatsApp → Ajustes → Cuenta → Eliminar cuenta. Espera unos minutos antes de continuar.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-4">
          <h3 className="font-semibold text-foreground text-sm mb-2">¿Por qué es necesario?</h3>
          <p className="text-xs text-muted-foreground">
            Meta requiere que el número sea exclusivo para la API de WhatsApp Business. 
            No se puede usar WhatsApp personal y ALICIA al mismo tiempo en el mismo número.
          </p>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-border hover:border-primary/50 transition-colors">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 w-5 h-5 rounded border-border text-primary focus:ring-primary/50"
        />
        <div>
          <p className="text-sm font-medium text-foreground">
            Confirmo que mi número está listo
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ya eliminé WhatsApp de ese número o estoy usando un SIM nuevo sin WhatsApp
          </p>
        </div>
      </label>

      <div className="flex gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 rounded-xl font-semibold border border-border text-foreground hover:bg-muted transition-all"
          >
            ← Atrás
          </button>
        )}
        <button
          type="submit"
          disabled={saving || !confirmed}
          className="flex-1 py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {confirmed && <CheckCircle2 className="w-4 h-4" />}
          {saving ? "Guardando..." : "Continuar →"}
        </button>
      </div>
    </form>
  );
};

export default OnboardingStepWhatsApp;
