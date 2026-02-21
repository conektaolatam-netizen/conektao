import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Settings, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

const AliciaHeroCard = () => {
  const navigate = useNavigate();
  const { restaurant } = useAuth();

  // Check if Alicia is already configured
  const { data: isConfigured } = useQuery({
    queryKey: ["alicia-config-status", restaurant?.id],
    queryFn: async () => {
      if (!restaurant?.id) return false;
      const { data } = await supabase
        .from("whatsapp_configs")
        .select("id, setup_completed")
        .eq("restaurant_id", restaurant.id)
        .maybeSingle();
      return !!data?.setup_completed;
    },
    enabled: !!restaurant?.id,
    staleTime: 5 * 60 * 1000,
  });

  const handleClick = () => {
    if (isConfigured) {
      navigate("/alicia-dashboard");
    } else {
      navigate("/alicia/setup");
    }
  };

  return (
    <div className="col-span-2 sm:col-span-3 relative group cursor-pointer" onClick={handleClick}>
      {/* Outer glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-secondary via-primary to-secondary rounded-2xl opacity-40 group-hover:opacity-70 blur-lg transition-opacity duration-500 alicia-breathing" />

      <Card className="relative overflow-hidden bg-card/95 backdrop-blur-xl border border-secondary/30 p-4 sm:p-6 lg:p-8 rounded-2xl">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/10 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary via-primary to-secondary opacity-80" />

        {/* Floating orbs */}
        <div className="absolute top-4 right-8 w-3 h-3 bg-secondary/40 rounded-full animate-pulse" />
        <div className="absolute bottom-6 right-16 w-2 h-2 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 flex items-center gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg alicia-glow">
              <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-primary-foreground" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card animate-pulse" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent uppercase tracking-wider">
                Módulo Principal
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1">
              ALICIA
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Tu asistente inteligente de ventas por WhatsApp
            </p>

            <Button
              className="mt-3 sm:mt-4 bg-gradient-to-r from-secondary to-secondary-hover text-secondary-foreground font-semibold px-6 py-2 rounded-xl hover:shadow-lg hover:shadow-secondary/30 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              {isConfigured ? (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Entrar a Alicia
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Alicia
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AliciaHeroCard;
