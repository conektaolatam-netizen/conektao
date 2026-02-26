import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Rocket } from "lucide-react";

interface Props {
  onComplete: () => void;
}

const CITIES = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Otra"];

const VendedorRegistration = ({ onComplete }: Props) => {
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !whatsapp.trim() || !ciudad) {
      toast.error("Completa todos los campos");
      return;
    }
    if (whatsapp.trim().length < 7 || whatsapp.trim().length > 15) {
      toast.error("Número de WhatsApp inválido");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.from("vendedores" as any).insert({
        nombre: nombre.trim(),
        whatsapp: whatsapp.trim(),
        ciudad,
      } as any).select("id").single();

      if (error) throw error;
      
      // Save vendedor info for certificate and progress tracking
      if (data) {
        localStorage.setItem("vendedor_id", (data as any).id);
      }
      localStorage.setItem("vendedor_name", nombre.trim());
      
      toast.success("¡Bienvenido al equipo!");
      onComplete();
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Error al registrarte. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 mb-4">
            <Rocket className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Método Alicia
          </h1>
          <p className="text-gray-400">
            En 10 minutos aprenderás todo para vender Alicia
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Nombre completo
            </label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              maxLength={100}
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Número de WhatsApp
            </label>
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9+]/g, ""))}
              placeholder="3001234567"
              maxLength={15}
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              type="tel"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Ciudad
            </label>
            <Select value={ciudad} onValueChange={setCiudad}>
              <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Selecciona tu ciudad" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25"
          >
            {loading ? (
              <Sparkles className="w-5 h-5 animate-spin" />
            ) : (
              "Empezar mi entrenamiento →"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default VendedorRegistration;
