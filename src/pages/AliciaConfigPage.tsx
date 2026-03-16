import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Store, UtensilsCrossed, Truck, CreditCard, 
  Smile, Clock, Wifi, Star, Lightbulb, ShieldAlert, Info, Check, Sparkles
} from "lucide-react";
import AliciaConfigBusiness from "@/components/alicia-config/AliciaConfigBusiness";
import AliciaConfigMenu from "@/components/alicia-config/AliciaConfigMenu";
import AliciaConfigDelivery from "@/components/alicia-config/AliciaConfigDelivery";
import AliciaConfigPayments from "@/components/alicia-config/AliciaConfigPayments";

import AliciaConfigPersonality from "@/components/alicia-config/AliciaConfigPersonality";
import AliciaConfigSchedule from "@/components/alicia-config/AliciaConfigSchedule";
import AliciaConfigConnection from "@/components/alicia-config/AliciaConfigConnection";
import AliciaConfigStarProducts from "@/components/alicia-config/AliciaConfigStarProducts";
import AliciaConfigUpselling from "@/components/alicia-config/AliciaConfigUpselling";
import AliciaConfigRestrictions from "@/components/alicia-config/AliciaConfigRestrictions";
import AliciaConfigSpecialInfo from "@/components/alicia-config/AliciaConfigSpecialInfo";

const SECTIONS = [
  { id: "business", label: "Tu Negocio", icon: Store, checkFields: ["restaurant_name"] },
  { id: "menu", label: "Menú", icon: UtensilsCrossed, checkFields: [] },
  { id: "payments", label: "Pagos", icon: CreditCard, checkFields: ["payment_config"] },
  { id: "schedule", label: "Horarios", icon: Clock, checkFields: ["operating_hours"] },
  { id: "delivery", label: "Domicilios", icon: Truck, checkFields: ["delivery_config"] },
  
  { id: "star", label: "Estrella", icon: Star, checkFields: ["promoted_products"] },
  { id: "upselling", label: "Sugerencias", icon: Lightbulb, checkFields: ["sales_rules"] },
  { id: "restrictions", label: "Restricciones", icon: ShieldAlert, checkFields: ["custom_rules"] },
  { id: "special", label: "Info Especial", icon: Info, checkFields: [] },
  { id: "personality", label: "Personalidad", icon: Smile, checkFields: ["personality_rules"] },
  { id: "connection", label: "WhatsApp", icon: Wifi, checkFields: ["whatsapp_phone_number_id"] },
];

function isSectionComplete(config: any, checkFields: string[]): boolean {
  if (!checkFields.length) return false;
  return checkFields.every(f => {
    const v = config?.[f];
    if (v === null || v === undefined || v === "") return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return true;
  });
}

export default function AliciaConfigPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [configId, setConfigId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("business");
  const [generating, setGenerating] = useState(false);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => { loadConfig(); }, []);

  async function loadProductCount(restaurantId: string) {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("is_active", true);
    setProductCount(count || 0);
  }

  async function loadConfig() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("restaurant_id, role").eq("id", user.id).single();
      if (!profile?.restaurant_id || !["owner", "admin"].includes(profile.role || "")) {
        toast.error("No tienes permisos para configurar Alicia");
        navigate("/alicia-dashboard"); return;
      }
      const { data: wc } = await supabase
        .from("whatsapp_configs").select("*").eq("restaurant_id", profile.restaurant_id).maybeSingle();
      if (wc) { setConfig(wc); setConfigId(wc.id); loadProductCount(profile.restaurant_id); }
      else {
        const { data: newConfig, error } = await supabase
          .from("whatsapp_configs")
          .insert({ restaurant_id: profile.restaurant_id, whatsapp_phone_number_id: "", is_active: false, setup_completed: false } as any)
          .select().single();
        if (newConfig) { setConfig(newConfig); setConfigId(newConfig.id); }
        if (error) toast.error("Error al crear configuración");
      }
    } catch { toast.error("Error cargando configuración"); }
    finally { setLoading(false); }
  }

  async function saveField(field: string, value: any) {
    if (!configId) return;
    const { error } = await supabase.from("whatsapp_configs")
      .update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", configId);
    if (error) { toast.error("Error al guardar"); console.error(error); }
    else { setConfig((prev: any) => ({ ...prev, [field]: value })); toast.success("Guardado ✅"); }
  }

  async function saveMultipleFields(fields: Record<string, any>) {
    if (!configId) return;
    const { error } = await supabase.from("whatsapp_configs")
      .update({ ...fields, updated_at: new Date().toISOString() }).eq("id", configId);
    if (error) { toast.error("Error al guardar"); console.error(error); }
    else { setConfig((prev: any) => ({ ...prev, ...fields })); toast.success("Guardado ✅"); }
  }

  async function handleGenerateAlicia() {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Sesión expirada"); return; }

      const res = await supabase.functions.invoke("generate-alicia", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;
      const result = res.data;

      if (!result?.success) {
        toast.error(result?.error || "Error generando Alicia");
        return;
      }

      setConfig((prev: any) => ({ ...prev, is_active: true, setup_completed: true, generated_system_prompt: "generated", prompt_generated_at: result.stats.generated_at }));
      
      const s = result.stats;
      toast.success(`¡${s.assistant_name} está lista! 🎉 ${s.products_count} productos, ${s.prompt_length.toLocaleString()} caracteres de prompt`);
    } catch (err: any) {
      console.error("Generate Alicia error:", err);
      toast.error("Error al generar Alicia");
    } finally {
      setGenerating(false);
    }
  }

  const completedCount = SECTIONS.filter(s => isSectionComplete(config, s.checkFields)).length;
  const progress = Math.round((completedCount / SECTIONS.length) * 100);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando configuración...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-red-500">No se pudo cargar la configuración</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "business": return <AliciaConfigBusiness config={config} onSave={saveMultipleFields} />;
      case "menu": return <AliciaConfigMenu config={config} configId={configId!} onSave={saveField} onReload={loadConfig} />;
      case "payments": return <AliciaConfigPayments config={config} onSave={saveField} />;
      case "schedule": return <AliciaConfigSchedule config={config} onSave={saveMultipleFields} />;
      case "delivery": return <AliciaConfigDelivery config={config} onSave={saveField} />;
      
      case "star": return <AliciaConfigStarProducts config={config} onSave={saveField} />;
      case "upselling": return <AliciaConfigUpselling config={config} onSave={saveField} />;
      case "restrictions": return <AliciaConfigRestrictions config={config} onSave={saveField} />;
      case "special": return <AliciaConfigSpecialInfo config={config} onSave={saveField} />;
      case "personality": return <AliciaConfigPersonality config={config} onSave={saveMultipleFields} />;
      case "connection": return <AliciaConfigConnection config={config} onSave={saveMultipleFields} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header gradient */}
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/alicia-dashboard")} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Configurar Alicia</h1>
            <p className="text-sm text-white/80">{config.restaurant_name || "Tu negocio"}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
            <div className={`h-2 w-2 rounded-full ${config.is_active ? "bg-green-300" : "bg-yellow-300"}`} />
            <span className="text-xs text-white font-medium">{config.is_active ? "Activa" : "Inactiva"}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-card border-b border-border/20 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground font-medium">Progreso de configuración</span>
            <span className="text-xs font-semibold text-teal-400">{completedCount}/{SECTIONS.length} secciones</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-orange-400 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-0 lg:gap-6 px-4 py-6">
        {/* Sidebar nav — desktop */}
        <nav className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-6 space-y-0.5">
            {SECTIONS.map(s => {
              const done = isSectionComplete(config, s.checkFields);
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all text-left ${
                    active 
                      ? "bg-gradient-to-r from-teal-900/30 to-orange-900/30 text-foreground font-medium shadow-sm border border-teal-500/30" 
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className={`flex items-center justify-center h-6 w-6 rounded-full shrink-0 ${
                    done ? "bg-green-500 text-white" : active ? "bg-teal-900/40 text-teal-400" : "bg-muted text-muted-foreground"
                  }`}>
                    {done ? <Check className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
                  </div>
                  <span>{s.label}</span>
                </button>
              );
            })}

            {/* Generate button */}
            <div className="pt-4">
              <Button 
                onClick={handleGenerateAlicia} 
                disabled={generating}
                className="w-full bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white shadow-md gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generating ? "Generando..." : "Generar mi Alicia"}
              </Button>
            </div>
          </div>
        </nav>

        {/* Mobile nav — horizontal scroll */}
        <div className="lg:hidden overflow-x-auto pb-3 -mx-4 px-4">
          <div className="flex gap-1.5 min-w-max">
            {SECTIONS.map(s => {
              const done = isSectionComplete(config, s.checkFields);
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs whitespace-nowrap transition-all ${
                    active 
                      ? "bg-gradient-to-r from-teal-500 to-orange-400 text-white font-medium shadow-sm" 
                      : done 
                        ? "bg-green-900/30 text-green-400 border border-green-500/30" 
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done && !active ? <Check className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {renderContent()}

          {/* Mobile generate button */}
          <div className="lg:hidden mt-6">
            <Button 
              onClick={handleGenerateAlicia} 
              disabled={generating}
              className="w-full bg-gradient-to-r from-teal-500 to-orange-400 hover:from-teal-600 hover:to-orange-500 text-white shadow-md gap-2 h-12 text-base"
            >
              <Sparkles className="h-5 w-5" />
              {generating ? "Generando..." : "Generar mi Alicia"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
