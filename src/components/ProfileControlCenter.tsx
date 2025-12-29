import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  User, Building, MapPin, CreditCard, Percent, Shield, 
  Target, Lock, Wallet 
} from "lucide-react";
import SettingsHeader from "./settings/SettingsHeader";
import SettingsSection from "./settings/SettingsSection";
import SettingsRow from "./settings/SettingsRow";
import SettingsAccountCard from "./settings/SettingsAccountCard";
import ProfileSettings from "./settings/ProfileSettings";
import RestaurantSettings from "./settings/RestaurantSettings";
import LocationSettings from "./settings/LocationSettings";
import SubscriptionSettings from "./settings/SubscriptionSettings";
import TipsSettings from "./settings/TipsSettings";
import SalesGoalsSettings from "./settings/SalesGoalsSettings";
import PrivacyDataSettings from "./settings/PrivacyDataSettings";
import PaymentMethodsSettings from "./settings/PaymentMethodsSettings";

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
  | "sales_goals"
  | "privacy"
  | "payment_methods";

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
  const renderSubScreen = () => {
    switch (currentScreen) {
      case "profile":
        return <ProfileSettings onBack={handleBack} />;
      case "restaurant":
        return <RestaurantSettings onBack={handleBack} />;
      case "location":
        return <LocationSettings onBack={handleBack} />;
      case "subscription":
        return <SubscriptionSettings onBack={handleBack} />;
      case "tips":
        return <TipsSettings onBack={handleBack} />;
      case "sales_goals":
        return <SalesGoalsSettings onBack={handleBack} />;
      case "privacy":
        return <PrivacyDataSettings onBack={handleBack} />;
      case "payment_methods":
        return <PaymentMethodsSettings onBack={handleBack} />;
      default:
        return null;
    }
  };

  if (currentScreen !== "main") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md h-[85vh] p-0 overflow-hidden bg-background border-border/30">
          {renderSubScreen()}
        </DialogContent>
      </Dialog>
    );
  }

  // Main settings screen (iOS-style list)
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md h-[85vh] max-h-[85vh] p-0 overflow-hidden bg-background border-border/30 flex flex-col">
        <SettingsHeader 
          title="Configuración" 
          showBackButton={false}
        />

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
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
                  icon={<Target className="h-4 w-4" />}
                  label="Objetivos de Ventas"
                  description="Metas mensuales"
                  onClick={() => setCurrentScreen("sales_goals")}
                />
                <SettingsRow
                  icon={<Percent className="h-4 w-4" />}
                  label="Propinas"
                  description="Configuración y distribución"
                  onClick={() => setCurrentScreen("tips")}
                />
                <SettingsRow
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Suscripción"
                  description="Plan y facturación"
                  onClick={() => setCurrentScreen("subscription")}
                />
              </SettingsSection>
            )}

            {/* Security & Payments Section */}
            <SettingsSection title="Seguridad y Pagos">
              <SettingsRow
                icon={<Lock className="h-4 w-4" />}
                label="Privacidad y Datos"
                description="Contraseña y documentos"
                onClick={() => setCurrentScreen("privacy")}
              />
              {isOwner && (
                <SettingsRow
                  icon={<Wallet className="h-4 w-4" />}
                  label="Métodos de Pago"
                  description="Tarjetas para suscripción"
                  onClick={() => setCurrentScreen("payment_methods")}
                />
              )}
            </SettingsSection>

          {/* Footer */}
          <div className="mt-8 pb-4 text-center">
            <p className="text-xs text-muted-foreground">
              Conektao v1.0 • Todos los cambios se guardan automáticamente
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileControlCenter;
