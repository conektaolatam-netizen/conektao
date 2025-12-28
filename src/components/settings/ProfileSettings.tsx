import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Mail, Phone, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SettingsHeader from "./SettingsHeader";
import SettingsSection from "./SettingsSection";
import useSettingsAudit from "@/hooks/useSettingsAudit";
import { cn } from "@/lib/utils";

interface ProfileSettingsProps {
  onBack: () => void;
}

const ProfileSettings = ({ onBack }: ProfileSettingsProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const { logSettingsChange } = useSettingsAudit();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    email: user?.email || "",
    phone: profile?.phone || "",
  });

  const [originalData, setOriginalData] = useState(formData);

  useEffect(() => {
    const data = {
      full_name: profile?.full_name || "",
      email: user?.email || "",
      phone: profile?.phone || "",
    };
    setFormData(data);
    setOriginalData(data);
  }, [profile, user]);

  useEffect(() => {
    setIsDirty(JSON.stringify(formData) !== JSON.stringify(originalData));
  }, [formData, originalData]);

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq("id", user?.id);

      if (error) throw error;

      // Update email if changed
      if (formData.email !== originalData.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });
        if (emailError) throw emailError;
      }

      // Log the change
      await logSettingsChange({
        section: 'profile',
        action: 'update',
        before: originalData,
        after: formData,
      });

      await refreshProfile();
      setOriginalData(formData);
      setSuccess(true);
      toast.success("Perfil actualizado ✓");

      setTimeout(() => setSuccess(false), 2000);
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = {
    owner: "Propietario",
    admin: "Administrador",
    employee: "Empleado",
  }[profile?.role || "employee"];

  return (
    <div className="flex flex-col h-full bg-background">
      <SettingsHeader title="Perfil Personal" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <SettingsSection>
          <div className="p-4 space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Nombre Completo
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                className="bg-muted/50 border-border/30"
                placeholder="Tu nombre"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="bg-muted/50 border-border/30"
                placeholder="tu@email.com"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                Teléfono
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="bg-muted/50 border-border/30"
                placeholder="+57 300 123 4567"
              />
            </div>

            {/* Role (read-only) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rol en el sistema</Label>
              <div className="flex items-center gap-2">
                <Badge variant={profile?.role === "owner" ? "default" : "secondary"}>
                  {roleLabel}
                </Badge>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Save Button */}
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
      </div>
    </div>
  );
};

export default ProfileSettings;
