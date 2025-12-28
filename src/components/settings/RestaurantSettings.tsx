import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building, MapPin, Hash, Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import SettingsHeader from "./SettingsHeader";
import SettingsSection from "./SettingsSection";
import useSettingsAudit from "@/hooks/useSettingsAudit";
import { cn } from "@/lib/utils";

interface RestaurantSettingsProps {
  onBack: () => void;
}

const RestaurantSettings = ({ onBack }: RestaurantSettingsProps) => {
  const { profile, restaurant, refreshProfile } = useAuth();
  const { logSettingsChange } = useSettingsAudit();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState({
    name: restaurant?.name || "",
    address: restaurant?.address || "",
    nit: (restaurant as any)?.nit || "",
  });

  const [originalData, setOriginalData] = useState(formData);

  useEffect(() => {
    const data = {
      name: restaurant?.name || "",
      address: restaurant?.address || "",
      nit: (restaurant as any)?.nit || "",
    };
    setFormData(data);
    setOriginalData(data);
  }, [restaurant]);

  useEffect(() => {
    setIsDirty(JSON.stringify(formData) !== JSON.stringify(originalData));
  }, [formData, originalData]);

  const handleSave = async () => {
    if (profile?.role !== "owner") {
      toast.error("Solo el propietario puede modificar estos datos");
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from("restaurants")
        .update({
          name: formData.name,
          address: formData.address,
        })
        .eq("id", restaurant?.id);

      if (error) throw error;

      await logSettingsChange({
        section: 'restaurant',
        action: 'update',
        before: originalData,
        after: formData,
      });

      await refreshProfile();
      setOriginalData(formData);
      setSuccess(true);
      toast.success("Datos del restaurante actualizados ✓");

      setTimeout(() => setSuccess(false), 2000);
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = profile?.role === "owner";

  return (
    <div className="flex flex-col h-full bg-background">
      <SettingsHeader title="Restaurante" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!isOwner && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-500">
              Solo el propietario puede modificar estos datos
            </p>
          </div>
        )}

        <SettingsSection>
          <div className="p-4 space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                <Building className="h-4 w-4 text-primary" />
                Nombre del Establecimiento
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-muted/50 border-border/30"
                placeholder="Mi Restaurante"
                disabled={!isOwner}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Dirección
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                className="bg-muted/50 border-border/30"
                placeholder="Calle 123 #45-67"
                disabled={!isOwner}
              />
            </div>

            {/* NIT */}
            <div className="space-y-2">
              <Label htmlFor="nit" className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                NIT (opcional)
              </Label>
              <Input
                id="nit"
                value={formData.nit}
                onChange={(e) => setFormData((prev) => ({ ...prev, nit: e.target.value }))}
                className="bg-muted/50 border-border/30"
                placeholder="900.123.456-7"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Funcionalidad próximamente disponible
              </p>
            </div>
          </div>
        </SettingsSection>

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

export default RestaurantSettings;
