import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Module access mapping per plan
const PLAN_MODULES: Record<string, string[]> = {
  alicia_only: ["alicia", "alicia-dashboard", "alicia-config"],
  basic: [
    "billing", "pos", "pos-billing", "inventory", "kitchen", "team",
    "documents", "cash", "invoices", "reports", "suppliers", "users",
    "marketplace", "alicia", "alicia-dashboard", "alicia-config",
  ],
  pos_pro: [
    "billing", "pos", "pos-billing", "inventory", "kitchen", "team",
    "documents", "cash", "invoices", "reports", "suppliers", "users",
    "marketplace", "alicia", "alicia-dashboard", "alicia-config",
  ],
  premium: [
    "billing", "pos", "pos-billing", "inventory", "kitchen", "team",
    "documents", "cash", "invoices", "reports", "suppliers", "users",
    "marketplace", "ai", "contai", "alicia", "alicia-dashboard", "alicia-config",
  ],
  full_suite: [
    "billing", "pos", "pos-billing", "inventory", "kitchen", "team",
    "documents", "cash", "invoices", "reports", "suppliers", "users",
    "marketplace", "ai", "contai", "alicia", "alicia-dashboard", "alicia-config",
  ],
};

// Dashboard module keys used in the Dashboard.tsx grid
const DASHBOARD_LOCKABLE_MODULES = [
  "billing", "inventory", "kitchen", "team", "documents",
  "ai", "contai", "marketplace",
];

export const useModuleAccess = () => {
  const { restaurant } = useAuth();

  const { data: planType, isLoading } = useQuery({
    queryKey: ["subscription-plan", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return "alicia_only";
      const { data, error } = await supabase
        .from("subscription_settings")
        .select("plan_type")
        .eq("restaurant_id", restaurant.id)
        .maybeSingle();

      if (error || !data) return "alicia_only";
      return data.plan_type;
    },
    enabled: !!restaurant?.id,
    staleTime: 5 * 60 * 1000,
  });

  const effectivePlan = planType || "alicia_only";

  const canAccess = (moduleKey: string): boolean => {
    const allowedModules = PLAN_MODULES[effectivePlan] || PLAN_MODULES.alicia_only;
    return allowedModules.includes(moduleKey);
  };

  const isLocked = (moduleKey: string): boolean => {
    return !canAccess(moduleKey);
  };

  const isAliciaOnly = effectivePlan === "alicia_only";

  return {
    planType: effectivePlan,
    canAccess,
    isLocked,
    isAliciaOnly,
    loading: isLoading,
    lockableModules: DASHBOARD_LOCKABLE_MODULES,
  };
};
