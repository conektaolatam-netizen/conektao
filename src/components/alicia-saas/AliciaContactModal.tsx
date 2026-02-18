import React, { useState } from "react";
import { X, User, Phone, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AliciaContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: "alicia" | "enterprise";
}

const AliciaContactModal = ({ isOpen, onClose, plan }: AliciaContactModalProps) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const planLabel = plan === "enterprise" ? "Enterprise" : "Plan ALICIA";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/\D/g, "");

    if (!cleanName || cleanName.length < 2) {
      setError("Por favor ingresa tu nombre completo");
      return;
    }
    if (!cleanPhone || cleanPhone.length < 7) {
      setError("Por favor ingresa un número de teléfono válido");
      return;
    }

    setLoading(true);
    try {
      const { error: fnError } = await supabase.functions.invoke("alicia-contact-lead", {
        body: { name: cleanName, phone: cleanPhone, plan },
      });

      if (fnError) throw fnError;
      setSent(true);
    } catch (err) {
      console.error(err);
      setError("Hubo un problema al enviar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setPhone("");
    setError("");
    setSent(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        style={{ boxShadow: "0 0 60px hsl(25 100% 50% / 0.2), 0 25px 50px rgba(0,0,0,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-secondary to-primary" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-8">
          {!sent ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-xs font-semibold text-primary">{planLabel}</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  ¡Te contactamos nosotros!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Déjanos tus datos y te llamamos en unos minutos.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Carlos Pérez"
                      maxLength={80}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/60 bg-background/60 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">
                    Número de teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 3001234567"
                      maxLength={15}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/60 bg-background/60 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                      autoComplete="tel"
                      inputMode="tel"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-2 border border-destructive/20">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover transition-all duration-300 shadow-lg shadow-primary/25 active:scale-95 touch-feedback disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Quiero que me contacten"
                  )}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  Sin compromisos · Te contactamos en minutos
                </p>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="py-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                ¡Listo, {name.split(" ")[0]}! 🎉
              </h2>
              <p className="text-muted-foreground mb-2">
                Recibimos tu información.
              </p>
              <p className="text-sm text-foreground/70 mb-8">
                Te contactamos al{" "}
                <span className="text-primary font-semibold">{phone}</span>{" "}
                en unos minutos.
              </p>
              <button
                onClick={handleClose}
                className="px-8 py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary active:scale-95 touch-feedback transition-all"
              >
                Perfecto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AliciaContactModal;
