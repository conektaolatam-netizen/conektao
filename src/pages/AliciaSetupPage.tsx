import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Step1Restaurant from "@/components/alicia-setup/Step1Restaurant";
import Step2Menu from "@/components/alicia-setup/Step2Menu";
import Step3Delivery from "@/components/alicia-setup/Step3Delivery";
import Step4Payments from "@/components/alicia-setup/Step4Payments";
import Step5Packaging from "@/components/alicia-setup/Step5Packaging";
import Step6Personality from "@/components/alicia-setup/Step6Personality";
import Step7Schedule from "@/components/alicia-setup/Step7Schedule";

const STEPS = [
  { label: "Restaurante", component: Step1Restaurant },
  { label: "Menú", component: Step2Menu },
  { label: "Domicilio", component: Step3Delivery },
  { label: "Pagos", component: Step4Payments },
  { label: "Empaques", component: Step5Packaging },
  { label: "Personalidad", component: Step6Personality },
  { label: "Horarios", component: Step7Schedule },
];

const AliciaSetupPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [configId, setConfigId] = useState<string | null>(null);
  const [configData, setConfigData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/alicia/registro");
      return;
    }
    if (user) loadOrCreateConfig();
  }, [user, authLoading]);

  const loadOrCreateConfig = async () => {
    try {
      // Check if user has a restaurant
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", user!.id)
        .maybeSingle();

      let restaurantId = profile?.restaurant_id;

      if (!restaurantId) {
        // Create restaurant for this user
        const { data: newRest, error: restErr } = await supabase
          .from("restaurants")
          .insert({ owner_id: user!.id, name: "Mi Restaurante" })
          .select()
          .single();
        if (restErr) throw restErr;
        restaurantId = newRest.id;

        await supabase
          .from("profiles")
          .update({ restaurant_id: restaurantId })
          .eq("id", user!.id);
      }

      // Check for existing whatsapp_config
      const { data: existing } = await supabase
        .from("whatsapp_configs")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      if (existing) {
        setConfigId(existing.id);
        setConfigData(existing);
        setCurrentStep(existing.setup_step || 0);
      } else {
        // Create new config
        const { data: newConfig, error: cfgErr } = await supabase
          .from("whatsapp_configs")
          .insert([{
            restaurant_id: restaurantId,
            is_active: false,
            setup_completed: false,
            setup_step: 0,
            whatsapp_phone_number_id: "pending",
            whatsapp_access_token: "pending",
            verify_token: "pending",
            order_email: user!.email || "",
          }])
          .select()
          .single();
        if (cfgErr) throw cfgErr;
        setConfigId(newConfig.id);
        setConfigData(newConfig);
      }
    } catch (err: any) {
      console.error("Setup load error:", err);
      toast.error("Error cargando configuración");
    } finally {
      setLoading(false);
    }
  };

  const saveStep = async (stepData: Record<string, any>) => {
    if (!configId) return;
    setSaving(true);
    try {
      const nextStep = currentStep + 1;
      const { error } = await supabase
        .from("whatsapp_configs")
        .update({ ...stepData, setup_step: nextStep })
        .eq("id", configId);
      if (error) throw error;

      setConfigData((prev: any) => ({ ...prev, ...stepData, setup_step: nextStep }));

      if (nextStep >= STEPS.length) {
        // Final step — activate
        await supabase
          .from("whatsapp_configs")
          .update({ setup_completed: true, is_active: true })
          .eq("id", configId);
        toast.success("¡ALICIA está lista! 🎉");
        navigate("/alicia-dashboard");
      } else {
        setCurrentStep(nextStep);
        toast.success(`Paso ${currentStep + 1} guardado`);
      }
    } catch (err: any) {
      toast.error("Error guardando: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const StepComponent = STEPS[currentStep].component;

  return (
    <div className="min-h-screen bg-background">
      {/* Progress bar */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-foreground">Crea tu ALICIA</h1>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1} de {STEPS.length}
            </span>
          </div>
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {STEPS.map((s, i) => (
              <span
                key={i}
                className={`text-xs whitespace-nowrap ${
                  i === currentStep
                    ? "text-primary font-semibold"
                    : i < currentStep
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <StepComponent
          data={configData}
          onSave={saveStep}
          saving={saving}
          onBack={currentStep > 0 ? () => setCurrentStep(currentStep - 1) : undefined}
        />
      </div>
    </div>
  );
};

export default AliciaSetupPage;
