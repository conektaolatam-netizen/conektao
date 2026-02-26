import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

interface Props {
  onComplete: () => void;
}

const CITIES = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Otra"];

const VendedorRegistration = ({ onComplete }: Props) => {
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ nombre?: string; whatsapp?: string; ciudad?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const trimmedNombre = nombre.trim();
    const trimmedWa = whatsapp.trim().replace(/[^0-9]/g, "");

    if (!trimmedNombre) {
      newErrors.nombre = "El nombre es obligatorio";
    } else if (trimmedNombre.length < 3) {
      newErrors.nombre = "Mínimo 3 caracteres";
    }

    if (!trimmedWa) {
      newErrors.whatsapp = "El WhatsApp es obligatorio";
    } else if (trimmedWa.length < 10) {
      newErrors.whatsapp = "Mínimo 10 dígitos";
    }

    if (!ciudad) {
      newErrors.ciudad = "Selecciona una ciudad";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const cleanWa = whatsapp.trim().replace(/[^0-9]/g, "");

      // 1. Duplicate check — if whatsapp already exists, skip insert
      const { data: existing, error: fetchErr } = await (supabase as any)
        .from("vendedores")
        .select("id, nombre")
        .eq("whatsapp", cleanWa)
        .maybeSingle();

      if (fetchErr) {
        console.error("Fetch error:", fetchErr.message, fetchErr.code, fetchErr.details);
        throw fetchErr;
      }

      if (existing) {
        // Returning user — load their data and continue
        localStorage.setItem("vendedor_id", existing.id);
        localStorage.setItem("vendedor_name", existing.nombre);
        toast.success(`¡Bienvenido de vuelta, ${existing.nombre}!`);
        onComplete();
        return;
      }

      // 2. Insert new vendedor
      const { data, error } = await (supabase as any)
        .from("vendedores")
        .insert({
          nombre: nombre.trim(),
          whatsapp: cleanWa,
          ciudad,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Supabase insert error:", error.message, error.code, error.details);
        throw error;
      }

      // 3. Save to localStorage and advance
      if (data) {
        localStorage.setItem("vendedor_id", data.id);
      }
      localStorage.setItem("vendedor_name", nombre.trim());

      toast.success("¡Bienvenido al equipo!");
      onComplete();
    } catch (err: any) {
      console.error("Registration error:", err);
      const msg = err?.message || "Error desconocido";
      toast.error(`Error al registrarte: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="w-full animate-fade-in">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-white mb-1">Regístrate para empezar</h2>
          <p className="text-sm text-gray-400">Solo necesitamos estos datos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Nombre completo
            </label>
            <Input
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setErrors(p => ({ ...p, nombre: undefined })); }}
              placeholder="Tu nombre"
              maxLength={100}
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
            {errors.nombre && <p className="text-xs text-red-400 mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Número de WhatsApp
            </label>
            <Input
              value={whatsapp}
              onChange={(e) => { setWhatsapp(e.target.value.replace(/[^0-9+]/g, "")); setErrors(p => ({ ...p, whatsapp: undefined })); }}
              placeholder="3001234567"
              maxLength={15}
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              type="tel"
            />
            {errors.whatsapp && <p className="text-xs text-red-400 mt-1">{errors.whatsapp}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1 block">
              Ciudad
            </label>
            <Select value={ciudad} onValueChange={(v) => { setCiudad(v); setErrors(p => ({ ...p, ciudad: undefined })); }}>
              <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Selecciona tu ciudad" />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.ciudad && <p className="text-xs text-red-400 mt-1">{errors.ciudad}</p>}
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
