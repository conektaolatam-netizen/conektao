import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield, ExternalLink } from "lucide-react";

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
}

const OnboardingStepMeta = ({ data, onSave, saving, onBack }: Props) => {
  const [phoneNumberId, setPhoneNumberId] = useState(data?.meta_phone_id || "");
  const [accessToken, setAccessToken] = useState(data?.meta_access_token || "");
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [phoneName, setPhoneName] = useState("");

  const validateCredentials = async () => {
    if (!phoneNumberId.trim() || !accessToken.trim()) {
      toast.error("Ingresa ambos campos");
      return;
    }

    setValidating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke(
        "meta-phone-register",
        {
          body: {
            phone_number_id: phoneNumberId.trim(),
            access_token: accessToken.trim(),
          },
        }
      );

      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);

      setValidated(true);
      setPhoneName(result?.display_phone_number || "Verificado");
      toast.success("¡Credenciales válidas!");
    } catch (err: any) {
      toast.error(err.message || "Credenciales inválidas");
      setValidated(false);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validated) {
      toast.error("Primero valida las credenciales");
      return;
    }
    onSave({
      meta_phone_id: phoneNumberId.trim(),
      meta_access_token: accessToken.trim(),
      meta_verified: true,
      meta_phone_name: phoneName,
    });
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Conecta tu número con Meta</h2>
        <p className="text-muted-foreground mt-1">
          Necesitamos tus credenciales de la API de WhatsApp Business
        </p>
      </div>

      <div className="bg-card border border-border/50 rounded-xl p-4 space-y-2">
        <p className="text-sm font-medium text-foreground">¿Dónde encuentro estos datos?</p>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Ve a <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">developers.facebook.com <ExternalLink className="w-3 h-3" /></a></li>
          <li>Selecciona tu App → WhatsApp → Configuración de la API</li>
          <li>Copia el <strong>Phone Number ID</strong> y el <strong>Permanent Access Token</strong></li>
        </ol>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">
            Phone Number ID
          </label>
          <input
            type="text"
            value={phoneNumberId}
            onChange={(e) => { setPhoneNumberId(e.target.value); setValidated(false); }}
            placeholder="123456789012345"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-1.5">
            Permanent Access Token
          </label>
          <input
            type="password"
            value={accessToken}
            onChange={(e) => { setAccessToken(e.target.value); setValidated(false); }}
            placeholder="EAA..."
            className={inputClass}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Debe ser un token permanente de System User, no temporal
          </p>
        </div>
      </div>

      {!validated && (
        <button
          type="button"
          onClick={validateCredentials}
          disabled={validating || !phoneNumberId.trim() || !accessToken.trim()}
          className="w-full py-3 rounded-xl font-semibold border-2 border-primary text-primary hover:bg-primary/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {validating && <Loader2 className="w-4 h-4 animate-spin" />}
          {validating ? "Validando..." : "Validar credenciales"}
        </button>
      )}

      {validated && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
          <p className="text-sm font-semibold text-emerald-600">✅ Credenciales válidas</p>
          {phoneName && (
            <p className="text-xs text-muted-foreground mt-1">Número: {phoneName}</p>
          )}
        </div>
      )}

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
          disabled={saving || !validated}
          className="flex-1 py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Continuar →"}
        </button>
      </div>
    </form>
  );
};

export default OnboardingStepMeta;
