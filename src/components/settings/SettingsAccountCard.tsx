import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SettingsAccountCardProps {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  onClick?: () => void;
  className?: string;
}

const SettingsAccountCard = ({
  name,
  email,
  role,
  avatarUrl,
  onClick,
  className,
}: SettingsAccountCardProps) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = {
    owner: "Propietario",
    admin: "Administrador",
    employee: "Empleado",
  }[role] || role;

  const roleVariant = role === "owner" ? "default" : role === "admin" ? "secondary" : "outline";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4",
        "bg-card/30 backdrop-blur-md",
        "border border-border/20 rounded-xl",
        "transition-all duration-200 ease-out",
        "hover:bg-accent/30 active:scale-[0.99]",
        "focus:outline-none focus:ring-2 focus:ring-primary/30",
        "touch-manipulation",
        "shadow-lg shadow-black/5",
        className
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-16 h-16 rounded-full",
        "bg-gradient-to-br from-primary/40 to-secondary/40",
        "flex items-center justify-center",
        "border-2 border-primary/20",
        "shadow-lg shadow-primary/20"
      )}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-xl font-bold text-primary-foreground">
            {initials}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col items-start min-w-0 flex-1">
        <span className="text-base font-semibold text-foreground truncate w-full text-left">
          {name}
        </span>
        <span className="text-sm text-muted-foreground truncate w-full text-left">
          {email}
        </span>
        <Badge variant={roleVariant} className="mt-1.5 text-xs">
          {roleLabel}
        </Badge>
      </div>

      {/* Chevron */}
      <svg
        className="h-5 w-5 text-muted-foreground/60 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </button>
  );
};

export default SettingsAccountCard;
