import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { User, Building, MapPin, CreditCard, Percent, Shield } from "lucide-react";
import SettingsHeader from "./settings/SettingsHeader";
import SettingsSection from "./settings/SettingsSection";
import SettingsRow from "./settings/SettingsRow";
import SettingsAccountCard from "./settings/SettingsAccountCard";
import ProfileSettings from "./settings/ProfileSettings";
import RestaurantSettings from "./settings/RestaurantSettings";
import LocationSettings from "./settings/LocationSettings";
import SubscriptionSettings from "./settings/SubscriptionSettings";
import TipsSettings from "./settings/TipsSettings";
import SecuritySettings from "./settings/SecuritySettings";

interface ProfileControlCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SettingsScreen = 
  | "main" 
  | "profile" 
  | "restaurant" 
  | "location" 
  | "subscription" 
  | "tips" 
  | "security";

const ProfileControlCenter = ({ open, onOpenChange }: ProfileControlCenterProps) => {
  const { user, profile, restaurant } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<SettingsScreen>("main");

  const handleClose = () => {
    setCurrentScreen("main");
    onOpenChange(false);
  };

  const handleBack = () => {
    setCurrentScreen("main");
  };

  const isOwner = profile?.role === "owner";

  // Render sub-screens
  if (currentScreen === "profile") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md h-[85vh] p-0 overflow-hidden bg-background border-border/30">
          <ProfileSettings onBack={handleBack} />
        </DialogContent>
      </Dialog>
    );
  }

  if (currentScreen === "restaurant") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md h-[85vh] p-0 overflow-hidden bg-background border-border/30">
          <RestaurantSettings onBack={handleBack} />
        </DialogContent>
      </Dialog>
    );
  }

  if (currentScreen === "location") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md h-[85vh] p-0 overflow-hidden bg-background border-border/30">
          <LocationSettings onBack={handleBack} />
        </DialogContent>
      </Dialog>
    );
  }

  if (currentScreen === "subscription") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md h-[85vh] p-0 overflow-hidden bg-background border-border/30">
          <SubscriptionSettings onBack={handleBack} />
        </DialogContent>
      </Dialog>
    );
  }

  if (currentScreen === "tips") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md h-[85vh] p-0 overflow-hidden bg-background border-border/30">
          <TipsSettings onBack={handleBack} />
        </DialogContent>
      </Dialog>
    );
  }

  if (currentScreen === "security") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md h-[85vh] p-0 overflow-hidden bg-background border-border/30">
          <SecuritySettings onBack={handleBack} />
        </DialogContent>
      </Dialog>
    );
  }

  // Main settings screen (iOS-style list)
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md h-[85vh] p-0 overflow-hidden bg-background border-border/30">
        <div className="flex flex-col h-full">
          <SettingsHeader 
            title="Configuración" 
            showBackButton={false}
          />

          <div className="flex-1 overflow-y-auto px-4 py-6">
            {/* Account Card */}
            <div className="mb-6">
              <SettingsAccountCard
                name={profile?.full_name || "Usuario"}
                email={user?.email || ""}
                role={profile?.role || "employee"}
                onClick={() => setCurrentScreen("profile")}
              />
            </div>

            {/* General Section */}
            <SettingsSection title="General">
              <SettingsRow
                icon={<User className="h-4 w-4" />}
                label="Perfil Personal"
                description="Nombre, email, teléfono"
                onClick={() => setCurrentScreen("profile")}
              />
              {isOwner && (
                <SettingsRow
                  icon={<Building className="h-4 w-4" />}
                  label="Restaurante"
                  description="Datos del establecimiento"
                  value={restaurant?.name}
                  onClick={() => setCurrentScreen("restaurant")}
                />
              )}
              {isOwner && (
                <SettingsRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Ubicación"
                  description="Control de asistencia"
                  onClick={() => setCurrentScreen("location")}
                />
              )}
            </SettingsSection>

            {/* Business Section */}
            {isOwner && (
              <SettingsSection title="Negocio">
                <SettingsRow
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Suscripción"
                  description="Plan y facturación"
                  onClick={() => setCurrentScreen("subscription")}
                />
                <SettingsRow
                  icon={<Percent className="h-4 w-4" />}
                  label="Propinas"
                  description="Configuración de propinas"
                  onClick={() => setCurrentScreen("tips")}
                />
              </SettingsSection>
            )}

            {/* Security Section */}
            <SettingsSection title="Seguridad">
              <SettingsRow
                icon={<Shield className="h-4 w-4" />}
                label="Cambiar Contraseña"
                description="Actualiza tu contraseña"
                onClick={() => setCurrentScreen("security")}
              />
            </SettingsSection>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                Conektao v1.0 • Todos los cambios se guardan automáticamente
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileControlCenter;
