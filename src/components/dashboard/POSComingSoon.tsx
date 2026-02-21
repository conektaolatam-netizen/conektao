import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Rocket, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface POSComingSoonProps {
  onBack: () => void;
}

const POSComingSoon = ({ onBack }: POSComingSoonProps) => {
  const { user, profile, restaurant } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    email: profile?.email || "",
    phone: "",
    restaurant_name: restaurant?.name || "",
    message: "",
  });

  // Check if already registered
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const { data } = await supabase
        .from("pos_waitlist")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setAlreadyRegistered(true);
    };
    check();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("pos_waitlist").insert({
        user_id: user.id,
        restaurant_id: restaurant?.id || null,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        restaurant_name: form.restaurant_name || null,
        message: form.message || null,
      });
      if (error) {
        if (error.code === "23505") {
          setAlreadyRegistered(true);
          toast.info("Ya estás en la lista de espera 🎉");
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        toast.success("¡Te registraste exitosamente!");
      }
    } catch (err: any) {
      toast.error("Error al registrarte: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-950 to-black" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-white/70 hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-cyan-500 mb-4 shadow-2xl shadow-orange-500/30">
            <Rocket className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent">
              POS Impulsado por IA
            </span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-md mx-auto">
            Estamos creando el sistema POS más inteligente para restaurantes.
            Facturación, inventario, cocina, personal y más — todo potenciado por inteligencia artificial.
          </p>
        </div>

        {/* Features preview */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { icon: "🧾", label: "Facturación inteligente" },
            { icon: "📦", label: "Inventario automático" },
            { icon: "👨‍🍳", label: "Cocina digital" },
            { icon: "👥", label: "Gestión de personal" },
            { icon: "📊", label: "Reportes con IA" },
            { icon: "🤖", label: "Contabilidad IA" },
          ].map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10"
            >
              <span className="text-lg">{f.icon}</span>
              <span className="text-white/80 text-xs sm:text-sm">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Form or success */}
        {submitted || alreadyRegistered ? (
          <Card className="p-6 bg-white/5 border border-green-500/30 backdrop-blur-xl text-center">
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">
              ¡Ya estás en la lista! 🎉
            </h3>
            <p className="text-white/60 text-sm">
              Serás de los primeros en probarlo. Te avisaremos cuando esté listo.
            </p>
          </Card>
        ) : (
          <Card className="p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-orange-400" />
              <h3 className="text-base font-bold text-white">
                Sé de los primeros en probarlo
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Tu nombre"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              <Input
                type="email"
                placeholder="Correo electrónico"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              <Input
                placeholder="Teléfono (opcional)"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              <Input
                placeholder="Nombre de tu restaurante"
                value={form.restaurant_name}
                onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              <Textarea
                placeholder="¿Qué te gustaría que tuviera el POS? (opcional)"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[80px]"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-cyan-500 hover:from-orange-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl"
              >
                {loading ? "Registrando..." : "🚀 Quiero ser de los primeros"}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

export default POSComingSoon;
