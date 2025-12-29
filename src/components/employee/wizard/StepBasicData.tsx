import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { WizardData } from "./EmployeeCreationWizard";
import RolePresetSelector from "./RolePresetSelector";

interface StepBasicDataProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  onPresetChange: (preset: string) => void;
}

const StepBasicData = ({ data, onUpdate, onPresetChange }: StepBasicDataProps) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="space-y-8">
      {/* Personal Information */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Información personal</h3>
            <p className="text-sm text-muted-foreground">Datos básicos del empleado</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Nombre completo *
            </Label>
            <Input
              id="full_name"
              value={data.full_name}
              onChange={(e) => onUpdate({ full_name: e.target.value })}
              placeholder="Juan Pérez"
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              Teléfono
            </Label>
            <Input
              id="phone"
              value={data.phone}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              placeholder="+57 300 123 4567"
              className="h-11"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => onUpdate({ email: e.target.value })}
              placeholder="juan@ejemplo.com"
              className="h-11"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              Contraseña *
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={data.password}
                onChange={(e) => onUpdate({ password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {data.password && data.password.length < 6 && (
              <p className="text-xs text-destructive">La contraseña debe tener al menos 6 caracteres</p>
            )}
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Tipo de empleado</h3>
            <p className="text-sm text-muted-foreground">
              Selecciona un perfil base. Podrás personalizar los permisos en el siguiente paso.
            </p>
          </div>
        </div>

        <RolePresetSelector
          selectedPreset={data.selectedPreset}
          onPresetSelect={onPresetChange}
        />
      </div>
    </div>
  );
};

export default StepBasicData;
