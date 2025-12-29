import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_PRESETS, MODULE_PERMISSIONS } from "@/lib/permissions";

interface RolePresetSelectorProps {
  selectedPreset: string;
  onPresetSelect: (preset: string) => void;
}

const RolePresetSelector = ({ selectedPreset, onPresetSelect }: RolePresetSelectorProps) => {
  const presetEntries = Object.entries(ROLE_PRESETS);

  const getPresetGradient = (color: string) => {
    const gradients: Record<string, string> = {
      green: "from-green-500 to-emerald-600",
      blue: "from-blue-500 to-cyan-600",
      orange: "from-amber-500 to-orange-500",
      purple: "from-purple-500 to-violet-600",
      gray: "from-slate-400 to-slate-600"
    };
    return gradients[color] || gradients.gray;
  };

  const getPresetPermissionPreview = (permissions: Record<string, string[]>) => {
    const moduleNames = Object.keys(permissions).map(key => 
      MODULE_PERMISSIONS[key]?.name || key
    );
    if (moduleNames.length === 0) return "Sin permisos predefinidos";
    if (moduleNames.length <= 3) return moduleNames.join(", ");
    return `${moduleNames.slice(0, 3).join(", ")} +${moduleNames.length - 3} más`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {presetEntries.map(([key, preset], index) => {
        const isSelected = selectedPreset === key;
        const Icon = preset.icon;
        const gradient = getPresetGradient(preset.color);
        
        return (
          <motion.button
            key={key}
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onPresetSelect(key)}
            className={cn(
              "relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300",
              "hover:shadow-xl hover:scale-[1.02] cursor-pointer text-left",
              isSelected 
                ? "border-primary bg-primary/5 shadow-lg" 
                : "border-border/50 bg-card hover:border-primary/50"
            )}
          >
            {/* Selection indicator */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="w-4 h-4 text-primary-foreground" />
              </motion.div>
            )}
            
            {/* Icon with gradient */}
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mb-4",
              "bg-gradient-to-br shadow-lg",
              gradient
            )}>
              <Icon className="w-8 h-8 text-white" />
            </div>
            
            {/* Title */}
            <h3 className="text-lg font-bold text-foreground mb-1">
              {preset.name}
            </h3>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground text-center mb-3 leading-relaxed">
              {preset.description}
            </p>
            
            {/* Permission preview */}
            <div className={cn(
              "text-xs px-3 py-1.5 rounded-full",
              isSelected 
                ? "bg-primary/20 text-primary" 
                : "bg-muted text-muted-foreground"
            )}>
              {getPresetPermissionPreview(preset.permissions)}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default RolePresetSelector;
