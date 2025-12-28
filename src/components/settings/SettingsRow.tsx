import React from "react";
import { ChevronRight, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsRowProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  value?: string | React.ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  loading?: boolean;
  success?: boolean;
  rightElement?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const SettingsRow = ({
  icon,
  label,
  description,
  value,
  onClick,
  showChevron = true,
  destructive = false,
  loading = false,
  success = false,
  rightElement,
  className,
  disabled = false,
}: SettingsRowProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "w-full flex items-center justify-between p-4 min-h-[56px]",
        "bg-card/50 backdrop-blur-sm",
        "border-b border-border/30 last:border-b-0",
        "transition-all duration-200 ease-out",
        "hover:bg-accent/50 active:bg-accent/70 active:scale-[0.99]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-inset",
        "touch-manipulation",
        destructive && "text-destructive",
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div className={cn(
            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
            "bg-gradient-to-br from-primary/20 to-secondary/10",
            destructive && "from-destructive/20 to-destructive/10"
          )}>
            <span className={cn(
              "text-primary",
              destructive && "text-destructive"
            )}>
              {icon}
            </span>
          </div>
        )}
        <div className="flex flex-col items-start min-w-0 flex-1">
          <span className={cn(
            "text-sm font-medium text-foreground truncate w-full text-left",
            destructive && "text-destructive"
          )}>
            {label}
          </span>
          {description && (
            <span className="text-xs text-muted-foreground truncate w-full text-left mt-0.5">
              {description}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        {rightElement}
        
        {value && !rightElement && (
          <span className="text-sm text-muted-foreground truncate max-w-[120px]">
            {value}
          </span>
        )}

        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}

        {success && !loading && (
          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="h-3 w-3 text-green-500" />
          </div>
        )}

        {showChevron && !loading && !success && !rightElement && (
          <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
        )}
      </div>
    </button>
  );
};

export default SettingsRow;
