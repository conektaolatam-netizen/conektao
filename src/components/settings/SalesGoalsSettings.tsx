import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target, ChevronLeft, ChevronRight, Loader2, Check, TrendingUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SettingsHeader from "./SettingsHeader";
import SettingsSection from "./SettingsSection";
import useSettingsAudit from "@/hooks/useSettingsAudit";
import { cn } from "@/lib/utils";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface SalesGoalsSettingsProps {
  onBack: () => void;
}

interface MonthlyTarget {
  id?: string;
  year: number;
  month: number;
  target_amount: number;
}

const SalesGoalsSettings = ({ onBack }: SalesGoalsSettingsProps) => {
  const { profile, restaurant } = useAuth();
  const { logSettingsChange } = useSettingsAudit();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [selectedDate, setSelectedDate] = useState(startOfMonth(new Date()));
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [originalAmount, setOriginalAmount] = useState<number>(0);
  const [existingTargetId, setExistingTargetId] = useState<string | null>(null);

  // History of goals
  const [history, setHistory] = useState<MonthlyTarget[]>([]);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  useEffect(() => {
    loadSettings();
    loadHistory();
  }, [restaurant?.id]);

  useEffect(() => {
    loadTargetForMonth();
  }, [selectedDate, restaurant?.id]);

  useEffect(() => {
    setIsDirty(targetAmount !== originalAmount);
  }, [targetAmount, originalAmount]);

  const loadSettings = async () => {
    setFetching(false);
  };

  const loadTargetForMonth = async () => {
    if (!restaurant?.id) return;

    try {
      const { data, error } = await supabase
        .from("monthly_sales_targets")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("year", year)
        .eq("month", month)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setTargetAmount(data.target_amount);
        setOriginalAmount(data.target_amount);
        setExistingTargetId(data.id);
      } else {
        setTargetAmount(0);
        setOriginalAmount(0);
        setExistingTargetId(null);
      }
    } catch (error) {
      console.error("Error loading target:", error);
    }
  };

  const loadHistory = async () => {
    if (!restaurant?.id) return;

    try {
      const { data, error } = await supabase
        .from("monthly_sales_targets")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(12);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error loading history:", error);
    }
  };

  const handleSave = async () => {
    if (profile?.role !== "owner") {
      toast.error("Solo el propietario puede modificar objetivos");
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const targetData = {
        restaurant_id: restaurant?.id,
        user_id: profile?.id,
        year,
        month,
        target_amount: targetAmount,
        updated_at: new Date().toISOString(),
      };

      if (existingTargetId) {
        const { error } = await supabase
          .from("monthly_sales_targets")
          .update(targetData)
          .eq("id", existingTargetId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("monthly_sales_targets")
          .insert(targetData);

        if (error) throw error;
      }

      await logSettingsChange({
        section: 'sales_goals',
        action: existingTargetId ? 'update' : 'create',
        before: { target_amount: originalAmount, year, month },
        after: { target_amount: targetAmount, year, month },
      });

      setOriginalAmount(targetAmount);
      setSuccess(true);
      toast.success("Objetivo guardado ✓");
      loadHistory();

      setTimeout(() => setSuccess(false), 2000);
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'prev' ? subMonths(selectedDate, 1) : addMonths(selectedDate, 1));
  };

  const isOwner = profile?.role === "owner";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (fetching) {
    return (
      <div className="flex flex-col h-full bg-background">
        <SettingsHeader title="Objetivos de Ventas" onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <SettingsHeader title="Objetivos de Ventas" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!isOwner && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-500">
              Solo el propietario puede modificar los objetivos
            </p>
          </div>
        )}

        {/* Month Selector */}
        <SettingsSection title="Mes">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth('prev')}
                className="h-10 w-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-center">
                <p className="font-medium capitalize">
                  {format(selectedDate, "MMMM yyyy", { locale: es })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth('next')}
                className="h-10 w-10"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </SettingsSection>

        {/* Goal Amount */}
        <SettingsSection title="Objetivo de Ventas">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <Label className="text-sm text-muted-foreground">Meta mensual (COP)</Label>
                <Input
                  type="number"
                  min="0"
                  step="100000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
                  className="mt-1 bg-muted/50 border-border/30 text-lg font-medium"
                  disabled={!isOwner}
                  placeholder="0"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Define cuánto esperas vender este mes. Verás el progreso en el Dashboard.
            </p>
          </div>
        </SettingsSection>

        {/* Save Button */}
        {isOwner && (
          <div className="mt-6">
            <Button
              onClick={handleSave}
              disabled={loading || !isDirty}
              className={cn(
                "w-full h-12 text-base font-medium",
                "bg-gradient-to-r from-primary to-primary/80",
                "hover:shadow-lg hover:shadow-primary/30",
                "transition-all duration-300",
                success && "bg-green-500 from-green-500 to-green-600"
              )}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : success ? (
                <span className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Guardado
                </span>
              ) : (
                "Guardar objetivo"
              )}
            </Button>
            {!isDirty && !loading && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                No hay cambios pendientes
              </p>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <SettingsSection title="Historial de Objetivos">
            <div className="divide-y divide-border/10">
              {history.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm capitalize">
                      {format(new Date(item.year, item.month - 1), "MMMM yyyy", { locale: es })}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {formatCurrency(item.target_amount)}
                  </span>
                </div>
              ))}
            </div>
          </SettingsSection>
        )}
      </div>
    </div>
  );
};

export default SalesGoalsSettings;
