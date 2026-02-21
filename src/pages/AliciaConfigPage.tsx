import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, UtensilsCrossed, Truck, CreditCard, Package, Smile, Clock, Wifi } from "lucide-react";
import AliciaConfigBusiness from "@/components/alicia-config/AliciaConfigBusiness";
import AliciaConfigMenu from "@/components/alicia-config/AliciaConfigMenu";
import AliciaConfigDelivery from "@/components/alicia-config/AliciaConfigDelivery";
import AliciaConfigPayments from "@/components/alicia-config/AliciaConfigPayments";
import AliciaConfigPackaging from "@/components/alicia-config/AliciaConfigPackaging";
import AliciaConfigPersonality from "@/components/alicia-config/AliciaConfigPersonality";
import AliciaConfigSchedule from "@/components/alicia-config/AliciaConfigSchedule";
import AliciaConfigConnection from "@/components/alicia-config/AliciaConfigConnection";

export default function AliciaConfigPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [configId, setConfigId] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("restaurant_id, role")
        .eq("id", user.id)
        .single();

      if (!profile?.restaurant_id || !["owner", "admin"].includes(profile.role || "")) {
        toast.error("No tienes permisos para configurar Alicia");
        navigate("/alicia-dashboard");
        return;
      }

      const { data: wc } = await supabase
        .from("whatsapp_configs")
        .select("*")
        .eq("restaurant_id", profile.restaurant_id)
        .maybeSingle();

      if (wc) {
        setConfig(wc);
        setConfigId(wc.id);
      } else {
        // Create empty config for this restaurant
        const { data: newConfig, error } = await supabase
          .from("whatsapp_configs")
          .insert({
            restaurant_id: profile.restaurant_id,
            whatsapp_phone_number_id: "",
            is_active: false,
            setup_completed: false,
          } as any)
          .select()
          .single();
        if (newConfig) { setConfig(newConfig); setConfigId(newConfig.id); }
        if (error) toast.error("Error al crear configuración");
      }
    } catch (err) {
      toast.error("Error cargando configuración");
    } finally {
      setLoading(false);
    }
  }

  async function saveField(field: string, value: any) {
    if (!configId) return;
    const { error } = await supabase
      .from("whatsapp_configs")
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq("id", configId);
    if (error) {
      toast.error("Error al guardar");
      console.error(error);
    } else {
      setConfig((prev: any) => ({ ...prev, [field]: value }));
      toast.success("Guardado ✅");
    }
  }

  async function saveMultipleFields(fields: Record<string, any>) {
    if (!configId) return;
    const { error } = await supabase
      .from("whatsapp_configs")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", configId);
    if (error) {
      toast.error("Error al guardar");
      console.error(error);
    } else {
      setConfig((prev: any) => ({ ...prev, ...fields }));
      toast.success("Guardado ✅");
    }
  }

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
        <p className="text-destructive">No se pudo cargar la configuración</p>
      </div>
    );
  }

  const tabs = [
    { id: "business", label: "Negocio", icon: Store },
    { id: "menu", label: "Menú", icon: UtensilsCrossed },
    { id: "delivery", label: "Domicilios", icon: Truck },
    { id: "payments", label: "Pagos", icon: CreditCard },
    { id: "packaging", label: "Empaques", icon: Package },
    { id: "personality", label: "Personalidad", icon: Smile },
    { id: "schedule", label: "Horarios", icon: Clock },
    { id: "connection", label: "WhatsApp", icon: Wifi },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/alicia-dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurar Alicia</h1>
            <p className="text-sm text-muted-foreground">
              {config.restaurant_name || "Tu negocio"} — Personaliza cómo Alicia atiende a tus clientes
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`h-2 w-2 rounded-full ${config.is_active ? "bg-green-500" : "bg-yellow-500"}`} />
          <span className="text-sm text-muted-foreground">
            {config.is_active ? "Alicia activa" : "Alicia inactiva"}
          </span>
          {config.setup_completed && (
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Configurada</span>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="business">
            <AliciaConfigBusiness config={config} onSave={saveMultipleFields} />
          </TabsContent>
          <TabsContent value="menu">
            <AliciaConfigMenu config={config} configId={configId!} onSave={saveField} onReload={loadConfig} />
          </TabsContent>
          <TabsContent value="delivery">
            <AliciaConfigDelivery config={config} onSave={saveField} />
          </TabsContent>
          <TabsContent value="payments">
            <AliciaConfigPayments config={config} onSave={saveField} />
          </TabsContent>
          <TabsContent value="packaging">
            <AliciaConfigPackaging config={config} onSave={saveField} />
          </TabsContent>
          <TabsContent value="personality">
            <AliciaConfigPersonality config={config} onSave={saveMultipleFields} />
          </TabsContent>
          <TabsContent value="schedule">
            <AliciaConfigSchedule config={config} onSave={saveMultipleFields} />
          </TabsContent>
          <TabsContent value="connection">
            <AliciaConfigConnection config={config} onSave={saveMultipleFields} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
