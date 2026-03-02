import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import OnboardingStepWhatsApp from "@/components/alicia-onboarding/OnboardingStepWhatsApp";
import OnboardingStepMeta from "@/components/alicia-onboarding/OnboardingStepMeta";
import OnboardingStepAutoConfig from "@/components/alicia-onboarding/OnboardingStepAutoConfig";
import OnboardingStepConfig from "@/components/alicia-onboarding/OnboardingStepConfig";
import OnboardingStepMenu from "@/components/alicia-onboarding/OnboardingStepMenu";
import Step6Personality from "@/components/alicia-setup/Step6Personality";
import OnboardingStepGenerate from "@/components/alicia-onboarding/OnboardingStepGenerate";

const STEPS = [
  { label: "WhatsApp" },
  { label: "Meta" },
  { label: "Conexión" },
  { label: "Restaurante" },
  { label: "Menú" },
  { label: "Personalidad" },
  { label: "Crear ALICIA" },
];

const AliciaSetupPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [configId, setConfigId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [configData, setConfigData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Meta credentials from step 2, passed to step 3
  const [metaPhoneId, setMetaPhoneId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/alicia/registro");
      return;
    }
    if (user) loadOrCreateConfig();
  }, [user, authLoading]);

  const loadOrCreateConfig = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id")
        .eq("id", user!.id)
        .maybeSingle();

      let restId = profile?.restaurant_id;

      if (!restId) {
        const { data: newRest, error: restErr } = await supabase
          .from("restaurants")
          .insert({ owner_id: user!.id, name: "Mi Restaurante" })
          .select()
          .single();
        if (restErr) throw restErr;
        restId = newRest.id;

        await supabase
          .from("profiles")
          .update({ restaurant_id: restId })
          .eq("id", user!.id);
      }

      setRestaurantId(restId);

      // Check for existing whatsapp_config
      const { data: existing } = await supabase
        .from("whatsapp_configs")
        .select("*")
        .eq("restaurant_id", restId)
        .maybeSingle();

      if (existing) {
        setConfigId(existing.id);
        setConfigData(existing);
        // Resume from saved step
        const savedStep = existing.setup_step || 0;
        setCurrentStep(savedStep);
        // Restore meta credentials if already saved
        if (existing.whatsapp_phone_number_id && existing.whatsapp_phone_number_id !== "pending") {
          setMetaPhoneId(existing.whatsapp_phone_number_id);
        }
        if (existing.whatsapp_access_token && existing.whatsapp_access_token !== "pending") {
          setMetaAccessToken(existing.whatsapp_access_token);
        }
      } else {
        // Generate unique placeholder to avoid unique constraint violation
        const uniqueId = crypto.randomUUID().slice(0, 8);
        const { data: newConfig, error: cfgErr } = await supabase
          .from("whatsapp_configs")
          .insert([{
            restaurant_id: restId,
            is_active: false,
            setup_completed: false,
            setup_step: 0,
            whatsapp_phone_number_id: `pending_${uniqueId}`,
            whatsapp_access_token: `pending_${uniqueId}`,
            verify_token: `pending_${uniqueId}`,
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

      // Handle meta credentials from step 2 (Meta)
      if (currentStep === 1 && stepData.meta_phone_id) {
        setMetaPhoneId(stepData.meta_phone_id);
        setMetaAccessToken(stepData.meta_access_token);
        // Save to onboarding session
        await supabase
          .from("onboarding_sessions" as any)
          .update({
            meta_phone_id: stepData.meta_phone_id,
            meta_access_token: stepData.meta_access_token,
            meta_verified: true,
            current_step: nextStep,
          })
          .eq("user_id", user!.id);
      }

      // For config step (step 3 = restaurant config), save to whatsapp_configs
      if (currentStep === 3) {
        const { error } = await supabase
          .from("whatsapp_configs")
          .update({ ...stepData, setup_step: nextStep })
          .eq("id", configId);
        if (error) throw error;
        setConfigData((prev: any) => ({ ...prev, ...stepData, setup_step: nextStep }));
      } else if (currentStep === 5) {
        // Personality step
        const { error } = await supabase
          .from("whatsapp_configs")
          .update({ ...stepData, setup_step: nextStep })
          .eq("id", configId);
        if (error) throw error;
        setConfigData((prev: any) => ({ ...prev, ...stepData, setup_step: nextStep }));
      } else {
        // For other steps, just update setup_step
        const { error } = await supabase
          .from("whatsapp_configs")
          .update({ setup_step: nextStep })
          .eq("id", configId);
        if (error) throw error;
      }

      // Update onboarding session step
      await supabase
        .from("onboarding_sessions" as any)
        .update({ current_step: nextStep })
        .eq("user_id", user!.id);

      if (nextStep >= STEPS.length) {
        // Final step completed — go to dashboard
        navigate("/alicia-dashboard");
      } else {
        setCurrentStep(nextStep);
        if (currentStep !== 2) { // Don't show toast for auto-config step
          toast.success(`Paso ${currentStep + 1} completado`);
        }
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

  const renderStep = () => {
    const commonProps = {
      data: configData,
      onSave: saveStep,
      saving,
      onBack: currentStep > 0 ? () => setCurrentStep(currentStep - 1) : undefined,
    };

    switch (currentStep) {
      case 0:
        return <OnboardingStepWhatsApp {...commonProps} />;
      case 1:
        return <OnboardingStepMeta {...commonProps} />;
      case 2:
        return (
          <OnboardingStepAutoConfig
            {...commonProps}
            configId={configId}
            restaurantId={restaurantId}
            metaPhoneId={metaPhoneId}
            metaAccessToken={metaAccessToken}
          />
        );
      case 3:
        return <OnboardingStepConfig {...commonProps} />;
      case 4:
        return <OnboardingStepMenu {...commonProps} />;
      case 5:
        return <Step6Personality {...commonProps} />;
      case 6:
        return <OnboardingStepGenerate {...commonProps} configId={configId} />;
      default:
        return null;
    }
  };

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
            {STEPS.map((_, i) => (
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
        {renderStep()}
      </div>
    </div>
  );
};

export default AliciaSetupPage;
