import React from "react";
import { cn } from "@/lib/utils";

interface SettingsSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const SettingsSection = ({
  title,
  description,
  children,
  className,
}: SettingsSectionProps) => {
  return (
    <div className={cn("mb-6", className)}>
      {(title || description) && (
        <div className="px-4 pb-2">
          {title && (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
      <div className={cn(
        "rounded-xl overflow-hidden",
        "bg-card/30 backdrop-blur-md",
        "border border-border/20",
        "shadow-lg shadow-black/5"
      )}>
        {children}
      </div>
    </div>
  );
};

export default SettingsSection;
