import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Percent, Info, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import SettingsHeader from "./SettingsHeader";
import SettingsSection from "./SettingsSection";
import SettingsRow from "./SettingsRow";
import { useTipConfig } from "@/context/TipConfigContext";
import useSettingsAudit from "@/hooks/useSettingsAudit";
import { cn } from "@/lib/utils";

interface TipsSettingsProps {
  onBack: () => void;
}

const TipsSettings = ({ onBack }: TipsSettingsProps) => {
  const { profile } = useAuth();
  const { tipEnabled, defaultTipPercentage, updateTipConfig, refreshTipConfig, isLoading } = useTipConfig();
  const { logSettingsChange } = useSettingsAudit();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [formData, setFormData] = useState({
    tip_enabled: tipEnabled,
    default_tip_percentage: defaultTipPercentage,
  });

  const [originalData, setOriginalData] = useState(formData);

  useEffect(() => {
    const data = {
      tip_enabled: tipEnabled,
      default_tip_percentage: defaultTipPercentage,
    };
    setFormData(data);
    setOriginalData(data);
  }, [tipEnabled, defaultTipPercentage]);

  useEffect(() => {
    setIsDirty(JSON.stringify(formData) !== JSON.stringify(originalData));
  }, [formData, originalData]);

  const handleSave = async () => {
    if (profile?.role !== "owner") {
      toast.error("Solo el propietario puede modificar las propinas");
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const successUpdate = await updateTipConfig({
        tipEnabled: formData.tip_enabled,
        defaultTipPercentage: formData.default_tip_percentage,
      });

      if (!successUpdate) throw new Error("No se pudo actualizar");

      await logSettingsChange({
        section: 'tips',
        action: 'update',
        before: originalData,
        after: formData,
      });

      await refreshTipConfig();
      setOriginalData(formData);
      setSuccess(true);
      toast.success("Configuración de propinas actualizada ✓");

      setTimeout(() => setSuccess(false), 2000);
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = profile?.role === "owner";

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <SettingsHeader title="Propinas" onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <SettingsHeader title="Propinas" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!isOwner && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-500">
              Solo el propietario puede modificar las propinas
            </p>
          </div>
        )}

        {/* Main Toggle */}
        <SettingsSection>
          <SettingsRow
            icon={<Percent className="h-4 w-4" />}
            label="Activar propinas voluntarias"
            description="Permitir que los clientes dejen propina"
            showChevron={false}
            rightElement={
              <Switch
                checked={formData.tip_enabled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, tip_enabled: checked }))
                }
                disabled={!isOwner}
              />
            }
          />
        </SettingsSection>

        {/* Percentage Input */}
        {formData.tip_enabled && (
          <SettingsSection title="Porcentaje por Defecto">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={formData.default_tip_percentage}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      default_tip_percentage: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-24 bg-muted/50 border-border/30"
                  disabled={!isOwner}
                />
                <span className="text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Por ley es 10%, pero puedes ajustarlo (ej: 5%, 8%, 12%)
              </p>
            </div>
          </SettingsSection>
        )}

        {/* Help Accordion */}
        {formData.tip_enabled && (
          <SettingsSection>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Info className="h-4 w-4 text-secondary" />
                </div>
                <span className="text-sm font-medium">¿Cómo funciona?</span>
              </div>
              {showHelp ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showHelp && (
              <div className="px-4 pb-4">
                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                  <ul className="text-sm text-foreground/80 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-secondary">•</span>
                      Los meseros y cajeros pueden ajustar la propina al cobrar
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary">•</span>
                      El cliente puede dar más o menos del porcentaje sugerido
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary">•</span>
                      Hay una opción "No dio propina" para casos sin propina
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary">•</span>
                      La propina se suma automáticamente al total de la cuenta
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary">•</span>
                      Después del pago, aparecerá un modal para distribuir entre meseros
                    </li>
                  </ul>
                </div>
              </div>
            )}
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

export default TipsSettings;
