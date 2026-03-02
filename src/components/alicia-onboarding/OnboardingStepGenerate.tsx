import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
  configId: string | null;
}

const OnboardingStepGenerate = ({ onSave, onBack, configId }: Props) => {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!configId) {
      toast.error("No se encontró la configuración");
      return;
    }

    setGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke(
        "generate-alicia",
        { body: { config_id: configId } }
      );

      if (error) throw new Error(error.message);
      if (result?.error) throw new Error(result.error);

      // Activate Alicia
      await supabase
        .from("whatsapp_configs")
        .update({
          is_active: true,
          setup_completed: true,
        })
        .eq("id", configId);

      setGenerated(true);
      toast.success("¡ALICIA está lista!");
    } catch (err: any) {
      console.error("Generate error:", err);
      toast.error(err.message || "Error generando ALICIA");
    } finally {
      setGenerating(false);
    }
  };

  if (generated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto shadow-lg shadow-primary/30"
        >
          <PartyPopper className="w-12 h-12 text-primary-foreground" />
        </motion.div>

        <div>
          <h2 className="text-3xl font-bold text-foreground">
            ¡Tu ALICIA ya está lista y funcionando! 🎉
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            Tu asistente virtual está activa y lista para recibir pedidos por WhatsApp.
            Los clientes ya pueden escribirle.
          </p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 max-w-sm mx-auto">
          <p className="text-sm font-medium text-emerald-600">
            ALICIA responderá automáticamente a cada mensaje en tu número de WhatsApp Business
          </p>
        </div>

        <button
          onClick={() => onSave({ generated: true })}
          className="w-full max-w-sm mx-auto py-4 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all text-lg shadow-lg shadow-primary/25"
        >
          Ir al Dashboard →
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 text-center py-8">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto">
        <Sparkles className="w-10 h-10 text-primary-foreground" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Crear mi ALICIA</h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Vamos a generar tu asistente personalizada con toda la configuración que ingresaste.
          ALICIA conocerá tu menú, horarios, precios, zonas y reglas.
        </p>
      </div>

      <div className="bg-card border border-border/50 rounded-xl p-4 max-w-sm mx-auto text-left space-y-2">
        <p className="text-sm font-medium text-foreground">ALICIA incluirá:</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>✅ Tu menú completo con precios</li>
          <li>✅ Horarios de atención</li>
          <li>✅ Zonas y costos de entrega</li>
          <li>✅ Métodos de pago</li>
          <li>✅ Reglas especiales de tu negocio</li>
          <li>✅ Personalidad y tono de conversación</li>
        </ul>
      </div>

      <div className="flex gap-3 max-w-sm mx-auto">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={generating}
            className="flex-1 py-3 rounded-xl font-semibold border border-border text-foreground hover:bg-muted transition-all disabled:opacity-50"
          >
            ← Atrás
          </button>
        )}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex-1 py-4 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all disabled:opacity-50 text-lg shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
        >
          {generating && <Loader2 className="w-5 h-5 animate-spin" />}
          {generating ? "Generando..." : "🚀 Crear mi ALICIA"}
        </button>
      </div>
    </div>
  );
};

export default OnboardingStepGenerate;
