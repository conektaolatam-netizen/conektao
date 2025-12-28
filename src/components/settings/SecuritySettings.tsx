import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, Loader2, Check, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import SettingsHeader from "./SettingsHeader";
import SettingsSection from "./SettingsSection";
import useSettingsAudit from "@/hooks/useSettingsAudit";
import { cn } from "@/lib/utils";

interface SecuritySettingsProps {
  onBack: () => void;
}

const SecuritySettings = ({ onBack }: SecuritySettingsProps) => {
  const { user } = useAuth();
  const { logSettingsChange } = useSettingsAudit();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.newPassword) {
      newErrors.newPassword = "Ingresa una nueva contraseña";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Mínimo 6 caracteres";
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      await logSettingsChange({
        section: 'security',
        action: 'update',
        before: { password: "***" },
        after: { password: "***" },
      });

      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess(true);
      toast.success("Contraseña actualizada ✓");

      setTimeout(() => setSuccess(false), 2000);
    } catch (error: any) {
      toast.error("Error al cambiar contraseña: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasInput = formData.newPassword || formData.confirmPassword;

  return (
    <div className="flex flex-col h-full bg-background">
      <SettingsHeader title="Seguridad" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Warning */}
        <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Zona Sensible</p>
              <p className="text-xs text-muted-foreground mt-1">
                Asegúrate de recordar tu nueva contraseña. Si la olvidas, tendrás que
                usar la opción de recuperación.
              </p>
            </div>
          </div>
        </div>

        <SettingsSection title="Cambiar Contraseña">
          <div className="p-4 space-y-5">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="current" className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Contraseña Actual
              </Label>
              <div className="relative">
                <Input
                  id="current"
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  className="bg-muted/50 border-border/30 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new" className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Nueva Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="new"
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, newPassword: e.target.value }));
                    setErrors((prev) => ({ ...prev, newPassword: "" }));
                  }}
                  className={cn(
                    "bg-muted/50 border-border/30 pr-10",
                    errors.newPassword && "border-destructive"
                  )}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-destructive">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Confirmar Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                  className={cn(
                    "bg-muted/50 border-border/30 pr-10",
                    errors.confirmPassword && "border-destructive"
                  )}
                  placeholder="Repite la contraseña"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
        </SettingsSection>

        {/* Save Button */}
        <div className="mt-6">
          <Button
            onClick={handleSave}
            disabled={loading || !hasInput}
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
                Contraseña cambiada
              </span>
            ) : (
              "Cambiar contraseña"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
