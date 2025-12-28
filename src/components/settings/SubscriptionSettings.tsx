import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, RefreshCw, Percent, Loader2, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import SettingsHeader from "./SettingsHeader";
import SettingsSection from "./SettingsSection";
import SettingsRow from "./SettingsRow";
import useSettingsAudit from "@/hooks/useSettingsAudit";
import { cn } from "@/lib/utils";

interface SubscriptionSettingsProps {
  onBack: () => void;
}

interface SubscriptionData {
  plan_type: string;
  billing_cycle: string;
  auto_renew: boolean;
  service_charge_enabled: boolean;
  service_charge_percentage: number;
}

const SubscriptionSettings = ({ onBack }: SubscriptionSettingsProps) => {
  const { profile, restaurant } = useAuth();
  const { logSettingsChange } = useSettingsAudit();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState<SubscriptionData>({
    plan_type: "basic",
    billing_cycle: "monthly",
    auto_renew: true,
    service_charge_enabled: false,
    service_charge_percentage: 0,
  });

  const [originalData, setOriginalData] = useState(formData);

  useEffect(() => {
    loadSettings();
  }, [restaurant?.id]);

  useEffect(() => {
    setIsDirty(JSON.stringify(formData) !== JSON.stringify(originalData));
  }, [formData, originalData]);

  const loadSettings = async () => {
    if (!restaurant?.id) return;

    try {
      const { data, error } = await supabase
        .from("subscription_settings")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        const settings = {
          plan_type: data.plan_type || "basic",
          billing_cycle: data.billing_cycle || "monthly",
          auto_renew: data.auto_renew ?? true,
          service_charge_enabled: data.service_charge_enabled ?? false,
          service_charge_percentage: data.service_charge_percentage ?? 0,
        };
        setFormData(settings);
        setOriginalData(settings);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (profile?.role !== "owner") {
      toast.error("Solo el propietario puede modificar la suscripción");
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from("subscription_settings")
        .upsert(
          {
            restaurant_id: restaurant?.id,
            ...formData,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "restaurant_id" }
        );

      if (error) throw error;

      await logSettingsChange({
        section: 'subscription',
        action: 'update',
        before: originalData,
        after: formData,
      });

      setOriginalData(formData);
      setSuccess(true);
      toast.success("Configuración actualizada ✓");

      setTimeout(() => setSuccess(false), 2000);
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = profile?.role === "owner";

  const planLabels: Record<string, string> = {
    basic: "Básico",
    premium: "Premium",
    enterprise: "Empresarial",
  };

  const cycleLabels: Record<string, string> = {
    monthly: "Mensual",
    yearly: "Anual",
  };

  if (fetching) {
    return (
      <div className="flex flex-col h-full bg-background">
        <SettingsHeader title="Suscripción" onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <SettingsHeader title="Suscripción" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!isOwner && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-500">
              Solo el propietario puede modificar la suscripción
            </p>
          </div>
        )}

        {/* Plan Section */}
        <SettingsSection title="Plan Actual">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{planLabels[formData.plan_type]}</p>
                  <p className="text-xs text-muted-foreground">
                    Ciclo: {cycleLabels[formData.billing_cycle]}
                  </p>
                </div>
              </div>
              <Badge variant="default" className="bg-primary/20 text-primary border-0">
                Activo
              </Badge>
            </div>

            {isOwner && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">Tipo de Plan</Label>
                  <select
                    className="w-full p-3 rounded-lg bg-muted/50 border border-border/30 text-sm"
                    value={formData.plan_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, plan_type: e.target.value }))}
                  >
                    <option value="basic">Básico</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Empresarial</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Ciclo de Facturación</Label>
                  <select
                    className="w-full p-3 rounded-lg bg-muted/50 border border-border/30 text-sm"
                    value={formData.billing_cycle}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, billing_cycle: e.target.value }))
                    }
                  >
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual (-20%)</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </SettingsSection>

        {/* Toggles Section */}
        <SettingsSection title="Opciones">
          <SettingsRow
            icon={<RefreshCw className="h-4 w-4" />}
            label="Renovación Automática"
            description="Renovar automáticamente la suscripción"
            showChevron={false}
            rightElement={
              <Switch
                checked={formData.auto_renew}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, auto_renew: checked }))
                }
                disabled={!isOwner}
              />
            }
          />
          <SettingsRow
            icon={<Percent className="h-4 w-4" />}
            label="Cobro de Servicio"
            description="Agregar % de servicio a facturas"
            showChevron={false}
            rightElement={
              <Switch
                checked={formData.service_charge_enabled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, service_charge_enabled: checked }))
                }
                disabled={!isOwner}
              />
            }
          />
        </SettingsSection>

        {/* Service Charge Percentage */}
        {formData.service_charge_enabled && isOwner && (
          <SettingsSection title="Porcentaje de Servicio">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.service_charge_percentage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      service_charge_percentage: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-24 bg-muted/50 border-border/30"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          </SettingsSection>
        )}

        {/* Save Button */}
        {isOwner && (
          <div className="mt-6">
            <Button
              onClick={handleSave}
              disabled={loading || !isDirty}
              className={cn(
                "w-full h-12 text-base font-medium",
                "bg-gradient-to-r from-primary to-primary/80",
                "hover:shadow-lg hover:shadow-primary/30",
                "transition-all duration-300",
                success && "bg-green-500 from-green-500 to-green-600"
              )}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : success ? (
                <span className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Guardado
                </span>
              ) : (
                "Guardar cambios"
              )}
            </Button>
            {!isDirty && !loading && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                No hay cambios pendientes
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionSettings;
