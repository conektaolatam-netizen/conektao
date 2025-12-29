import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DollarSign, Gift, Sparkles, Pencil, Check, X } from "lucide-react";
import { WizardData, BonusConfig } from "./EmployeeCreationWizard";
import { SALARY_FREQUENCIES, BONUS_TYPES, BONUS_FREQUENCIES } from "@/lib/permissions";
import BonusConfigurationChat from "./BonusConfigurationChat";

interface StepCompensationProps {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
}

const StepCompensation = ({ data, onUpdate }: StepCompensationProps) => {
  const [showBonusChat, setShowBonusChat] = useState(false);
  const [isEditingBonus, setIsEditingBonus] = useState(false);

  const handleSalaryChange = (value: string) => {
    const numValue = value ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : null;
    onUpdate({ base_salary: numValue });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "";
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleBonusConfigured = (config: BonusConfig) => {
    onUpdate({ bonus_config: config, has_bonus: true });
    setShowBonusChat(false);
  };

  const getBonusTypeLabel = (type: string) => 
    BONUS_TYPES.find(t => t.value === type)?.label || type;

  const getBonusFrequencyLabel = (freq: string) => 
    BONUS_FREQUENCIES.find(f => f.value === freq)?.label || freq;

  return (
    <div className="space-y-8">
      {/* Salary Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Salario fijo</h3>
            <p className="text-sm text-muted-foreground">Compensación base del empleado</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="base_salary">Salario base</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="base_salary"
                type="text"
                value={data.base_salary ? data.base_salary.toLocaleString('es-CO') : ""}
                onChange={(e) => handleSalaryChange(e.target.value)}
                placeholder="1,500,000"
                className="h-11 pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Opcional. Puedes configurarlo después.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="salary_frequency">Periodicidad</Label>
            <Select
              value={data.salary_frequency}
              onValueChange={(value: 'monthly' | 'biweekly' | 'weekly') => 
                onUpdate({ salary_frequency: value })
              }
            >
              <SelectTrigger id="salary_frequency" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SALARY_FREQUENCIES.map(freq => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bonus Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
            <Gift className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Bonificación</h3>
            <p className="text-sm text-muted-foreground">Compensación variable según rendimiento</p>
          </div>
        </div>

        {/* Toggle bonus */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <div>
              <p className="font-medium">¿Tiene bonificación?</p>
              <p className="text-sm text-muted-foreground">
                Configura reglas de bonificación con ayuda de IA
              </p>
            </div>
          </div>
          <Switch
            checked={data.has_bonus}
            onCheckedChange={(checked) => {
              onUpdate({ has_bonus: checked });
              if (!checked) {
                onUpdate({ bonus_config: null });
              }
            }}
          />
        </div>

        {/* Bonus configuration */}
        {data.has_bonus && (
          <div className="space-y-4">
            {data.bonus_config ? (
              /* Show configured bonus */
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    Bonificación configurada
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingBonus(true)}
                      className="gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdate({ bonus_config: null })}
                      className="gap-1 text-destructive hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                      Quitar
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-medium">{getBonusTypeLabel(data.bonus_config.bonus_type)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background">
                    <p className="text-muted-foreground">Frecuencia</p>
                    <p className="font-medium">{getBonusFrequencyLabel(data.bonus_config.frequency)}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-background text-sm">
                  <p className="text-muted-foreground">Regla</p>
                  <p className="font-medium">{data.bonus_config.rule_description}</p>
                </div>

                {data.bonus_config.max_cap && (
                  <div className="p-3 rounded-lg bg-background text-sm">
                    <p className="text-muted-foreground">Tope máximo</p>
                    <p className="font-medium">{formatCurrency(data.bonus_config.max_cap)}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Button to configure bonus */
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowBonusChat(true)}
                className="w-full h-auto py-4 border-dashed border-2 hover:border-purple-500 hover:bg-purple-500/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Definir bonificación con IA</p>
                    <p className="text-sm text-muted-foreground">
                      Te guiaré paso a paso para configurar la regla
                    </p>
                  </div>
                </div>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Bonus Chat Modal */}
      <BonusConfigurationChat
        isOpen={showBonusChat || isEditingBonus}
        onClose={() => {
          setShowBonusChat(false);
          setIsEditingBonus(false);
        }}
        initialConfig={isEditingBonus ? data.bonus_config : null}
        onConfigured={handleBonusConfigured}
      />
    </div>
  );
};

export default StepCompensation;
