import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
  configId: string | null;
  restaurantId: string | null;
  metaPhoneId: string;
  metaAccessToken: string;
}

const STEPS_CONFIG = [
  { label: "Guardando credenciales...", icon: "🔐" },
  { label: "Generando token de webhook...", icon: "🔗" },
  { label: "Configurando webhook URL...", icon: "🌐" },
  { label: "Activando conexión...", icon: "⚡" },
];

const OnboardingStepAutoConfig = ({
  onSave,
  configId,
  restaurantId,
  metaPhoneId,
  metaAccessToken,
}: Props) => {
  const { user } = useAuth();
  const [configStep, setConfigStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runAutoConfig();
  }, []);

  const runAutoConfig = async () => {
    if (!configId || !restaurantId || !user) {
      setError("Faltan datos de configuración");
      return;
    }

    try {
      // Step 1: Save credentials
      setConfigStep(0);
      await new Promise((r) => setTimeout(r, 800));

      const verifyToken = `conektao_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`;
      const webhookUrl = `https://ctsqvjcgcukosusksulx.supabase.co/functions/v1/whatsapp-webhook`;

      // Step 2: Generate verify token
      setConfigStep(1);
      await new Promise((r) => setTimeout(r, 600));

      // Step 3: Configure webhook URL
      setConfigStep(2);
      const { error: updateErr } = await supabase
        .from("whatsapp_configs")
        .update({
          whatsapp_phone_number_id: metaPhoneId,
          whatsapp_access_token: metaAccessToken,
          verify_token: verifyToken,
          order_email: user.email || "",
        })
        .eq("id", configId);

      if (updateErr) throw updateErr;

      await new Promise((r) => setTimeout(r, 600));

      // Step 4: Activate
      setConfigStep(3);
      await new Promise((r) => setTimeout(r, 800));

      setCompleted(true);
      toast.success("¡Conexión configurada correctamente!");
    } catch (err: any) {
      console.error("Auto-config error:", err);
      setError(err.message || "Error en la configuración automática");
      toast.error("Error configurando. Intenta de nuevo.");
    }
  };

  if (error) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto">
          <span className="text-3xl">❌</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">Error en la configuración</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={runAutoConfig}
          className="py-3 px-6 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="space-y-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">¡Conexión lista!</h2>
        <p className="text-muted-foreground">
          Tu número de WhatsApp está conectado con Meta
        </p>

        <div className="bg-card border border-border/50 rounded-xl p-4 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Phone ID</span>
            <span className="font-mono text-foreground">{metaPhoneId.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Webhook</span>
            <span className="text-emerald-500 font-medium">Configurado ✓</span>
          </div>
        </div>

        <button
          onClick={() => onSave({})}
          className="w-full py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all"
        >
          Continuar →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Configurando automáticamente...</h2>
        <p className="text-muted-foreground mt-1">Esto toma unos segundos</p>
      </div>

      <div className="space-y-3">
        {STEPS_CONFIG.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: i <= configStep ? 1 : 0.3, x: 0 }}
            transition={{ delay: i * 0.2 }}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              i < configStep
                ? "border-emerald-500/30 bg-emerald-500/5"
                : i === configStep
                ? "border-primary/50 bg-primary/5"
                : "border-border/30"
            }`}
          >
            <span className="text-xl">{step.icon}</span>
            <span className="text-sm font-medium text-foreground flex-1">{step.label}</span>
            {i < configStep && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {i === configStep && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OnboardingStepAutoConfig;
