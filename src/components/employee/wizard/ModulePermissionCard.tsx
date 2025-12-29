import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertTriangle, Check, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ModuleDefinition, Permission } from "@/lib/permissions";
import DangerousPermissionModal from "./DangerousPermissionModal";

interface ModulePermissionCardProps {
  moduleKey: string;
  module: ModuleDefinition;
  enabledPermissions: string[];
  onPermissionChange: (moduleKey: string, permissionKey: string, enabled: boolean) => void;
  onDangerConfirm: (moduleKey: string, permissionKey: string) => void;
}

const ModulePermissionCard = ({
  moduleKey,
  module,
  enabledPermissions,
  onPermissionChange,
  onDangerConfirm
}: ModulePermissionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dangerModal, setDangerModal] = useState<{ permission: Permission; open: boolean } | null>(null);

  const Icon = module.icon;
  const enabledCount = enabledPermissions.length;
  const totalCount = module.permissions.length;
  const allEnabled = enabledCount === totalCount;

  const handleToggleModule = () => {
    if (allEnabled) {
      // Disable all permissions
      module.permissions.forEach(p => {
        onPermissionChange(moduleKey, p.key, false);
      });
    } else {
      // Enable all non-dangerous permissions
      module.permissions.forEach(p => {
        if (!p.dangerous) {
          onPermissionChange(moduleKey, p.key, true);
        }
      });
    }
  };

  const handlePermissionToggle = (permission: Permission, enabled: boolean) => {
    if (enabled && permission.dangerous) {
      // Show confirmation modal for dangerous permissions
      setDangerModal({ permission, open: true });
    } else {
      onPermissionChange(moduleKey, permission.key, enabled);
    }
  };

  const handleDangerConfirmation = () => {
    if (dangerModal?.permission) {
      onPermissionChange(moduleKey, dangerModal.permission.key, true);
      onDangerConfirm(moduleKey, dangerModal.permission.key);
      setDangerModal(null);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-xl border overflow-hidden transition-all duration-300",
          enabledCount > 0 ? "border-primary/30 bg-primary/5" : "border-border bg-card"
        )}
      >
        {/* Header with gradient */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
        >
          <div className={cn(
            "flex items-center justify-between p-4 transition-colors",
            "hover:bg-muted/50"
          )}>
            <div className="flex items-center gap-4">
              {/* Icon with gradient */}
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br shadow-md",
                module.gradient
              )}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              {/* Title and description */}
              <div className="text-left">
                <h3 className="font-semibold text-foreground">{module.name}</h3>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </div>
            </div>
            
            {/* Right side: count and toggle */}
            <div className="flex items-center gap-4">
              {/* Permission count */}
              <div className={cn(
                "text-sm px-3 py-1 rounded-full",
                enabledCount > 0 
                  ? "bg-primary/20 text-primary font-medium" 
                  : "bg-muted text-muted-foreground"
              )}>
                {enabledCount}/{totalCount}
              </div>
              
              {/* Quick toggle all */}
              <Switch
                checked={allEnabled}
                onCheckedChange={handleToggleModule}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-primary"
              />
              
              {/* Expand chevron */}
              <ChevronDown className={cn(
                "w-5 h-5 text-muted-foreground transition-transform duration-300",
                isExpanded && "rotate-180"
              )} />
            </div>
          </div>
        </button>
        
        {/* Expanded permissions list */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border/50 p-4 space-y-3 bg-background/50">
                {module.permissions.map((permission) => {
                  const isEnabled = enabledPermissions.includes(permission.key);
                  
                  return (
                    <div
                      key={permission.key}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-colors",
                        isEnabled ? "bg-primary/10" : "bg-muted/30",
                        permission.dangerous && "border border-amber-500/30"
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {permission.label}
                          </span>
                          {permission.dangerous && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600">
                              <AlertTriangle className="w-3 h-3" />
                              Requiere confirmación
                            </span>
                          )}
                          {isEnabled && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {permission.description}
                        </p>
                      </div>
                      
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handlePermissionToggle(permission, checked)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dangerous permission confirmation modal */}
      {dangerModal && (
        <DangerousPermissionModal
          open={dangerModal.open}
          onOpenChange={(open) => !open && setDangerModal(null)}
          permissionLabel={dangerModal.permission.label}
          warning={dangerModal.permission.warning || "Este permiso puede afectar datos sensibles."}
          onConfirm={handleDangerConfirmation}
        />
      )}
    </>
  );
};

export default ModulePermissionCard;
