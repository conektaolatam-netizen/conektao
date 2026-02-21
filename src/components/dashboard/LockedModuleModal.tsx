import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface LockedModuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleName: string;
  moduleKey: string;
}

const LockedModuleModal = ({ open, onOpenChange, moduleName, moduleKey }: LockedModuleModalProps) => {
  const { user, restaurant } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestAccess = async () => {
    if (!user || !restaurant) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("module_interest_requests").upsert(
        {
          restaurant_id: restaurant.id,
          user_id: user.id,
          module_key: moduleKey,
        },
        { onConflict: "restaurant_id,user_id,module_key" }
      );

      if (error) throw error;
      setSubmitted(true);
      toast.success("¡Solicitud registrada!");
    } catch (err) {
      console.error("Error requesting access:", err);
      toast.error("Error al enviar solicitud");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 max-w-md">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-lg pointer-events-none" />
        <DialogHeader className="relative z-10">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-border/30">
            {submitted ? (
              <CheckCircle className="h-8 w-8 text-green-400" />
            ) : (
              <Lock className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <DialogTitle className="text-center text-xl">
            {submitted ? "¡Listo!" : moduleName}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            {submitted
              ? "Te avisaremos cuando este módulo esté disponible para ti."
              : "Próximamente disponible. Déjanos tus datos para activarlo primero."}
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 mt-4">
          {!submitted ? (
            <Button
              className="w-full bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-semibold py-3 rounded-xl"
              onClick={handleRequestAccess}
              disabled={loading}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {loading ? "Enviando..." : "Quiero acceso prioritario"}
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => {
                setSubmitted(false);
                onOpenChange(false);
              }}
            >
              Cerrar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LockedModuleModal;
