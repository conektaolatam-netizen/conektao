import React from "react";
import { Shield, Info } from "lucide-react";
import { WizardData } from "./EmployeeCreationWizard";
import { MODULE_PERMISSIONS, ROLE_PRESETS } from "@/lib/permissions";
import ModulePermissionCard from "./ModulePermissionCard";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StepPermissionsProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
}

const StepPermissions = ({ data, onUpdate }: StepPermissionsProps) => {
  const selectedPreset = ROLE_PRESETS[data.selectedPreset];

  const handlePermissionChange = (moduleKey: string, permissionKey: string, enabled: boolean) => {
    const currentModulePermissions = data.permissions[moduleKey] || [];
    let newModulePermissions: string[];

    if (enabled) {
      newModulePermissions = [...currentModulePermissions, permissionKey];
    } else {
      newModulePermissions = currentModulePermissions.filter(p => p !== permissionKey);
    }

    onUpdate({
      permissions: {
        ...data.permissions,
        [moduleKey]: newModulePermissions
      }
    });
  };

  const handleDangerConfirm = (moduleKey: string, permissionKey: string) => {
    const currentConfirmed = data.dangerConfirmed[moduleKey] || [];
    onUpdate({
      dangerConfirmed: {
        ...data.dangerConfirmed,
        [moduleKey]: [...currentConfirmed, permissionKey]
      }
    });
  };

  const moduleEntries = Object.entries(MODULE_PERMISSIONS);

  // Count total enabled permissions
  const totalEnabled = Object.values(data.permissions).reduce(
    (acc, perms) => acc + perms.length, 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Permisos del empleado</h3>
          <p className="text-sm text-muted-foreground">
            Basado en el perfil <span className="font-medium text-primary">{selectedPreset?.name}</span>. 
            Puedes ajustar cada permiso.
          </p>
        </div>
      </div>

      {/* Info alert */}
      <Alert className="border-primary/30 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          Los permisos marcados en <span className="text-amber-600 font-medium">amarillo</span> son 
          sensibles y requieren confirmación adicional. Se registrará quién los habilitó.
        </AlertDescription>
      </Alert>

      {/* Permission count summary */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <span className="text-sm text-muted-foreground">
          Permisos activos
        </span>
        <span className="text-lg font-bold text-primary">
          {totalEnabled}
        </span>
      </div>

      {/* Module cards */}
      <div className="space-y-4">
        {moduleEntries.map(([moduleKey, module]) => (
          <ModulePermissionCard
            key={moduleKey}
            moduleKey={moduleKey}
            module={module}
            enabledPermissions={data.permissions[moduleKey] || []}
            onPermissionChange={handlePermissionChange}
            onDangerConfirm={handleDangerConfirm}
          />
        ))}
      </div>
    </div>
  );
};

export default StepPermissions;
