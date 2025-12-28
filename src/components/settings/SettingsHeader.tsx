import React from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showBackButton?: boolean;
  className?: string;
}

const SettingsHeader = ({
  title,
  subtitle,
  onBack,
  rightAction,
  showBackButton = true,
  className,
}: SettingsHeaderProps) => {
  return (
    <div className={cn(
      "sticky top-0 z-10",
      "bg-background/80 backdrop-blur-xl",
      "border-b border-border/20",
      "px-4 py-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {showBackButton && onBack && (
            <button
              type="button"
              onClick={onBack}
              className={cn(
                "flex items-center gap-1 text-primary",
                "hover:opacity-70 transition-opacity",
                "active:scale-95 touch-manipulation",
                "-ml-1 pr-2"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Atrás</span>
            </button>
          )}
          {!showBackButton && (
            <div className="flex flex-col min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>

        {showBackButton && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-base font-semibold text-foreground">
              {title}
            </h1>
          </div>
        )}

        <div className="flex-shrink-0">
          {rightAction}
        </div>
      </div>
    </div>
  );
};

export default SettingsHeader;
