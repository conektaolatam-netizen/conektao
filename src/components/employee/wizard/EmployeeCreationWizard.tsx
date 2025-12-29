import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  User, 
  DollarSign, 
  Shield, 
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ROLE_PRESETS, getPresetPermissions } from "@/lib/permissions";
import StepBasicData from "./StepBasicData";
import StepCompensation from "./StepCompensation";
import StepPermissions from "./StepPermissions";

interface EmployeeCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface WizardData {
  // Step 1: Basic Data
  full_name: string;
  phone: string;
  email: string;
  password: string;
  selectedPreset: string;
  
  // Step 2: Compensation
  base_salary: number | null;
  salary_frequency: 'monthly' | 'biweekly' | 'weekly';
  has_bonus: boolean;
  bonus_config: BonusConfig | null;
  
  // Step 3: Permissions
  permissions: Record<string, string[]>;
  dangerConfirmed: Record<string, string[]>; // Track confirmed dangerous permissions
}

export interface BonusConfig {
  bonus_type: string;
  frequency: string;
  rule_description: string;
  formula: any;
  conditions: any;
  max_cap: number | null;
}

const STEPS = [
  { id: 1, title: "Datos básicos", icon: User },
  { id: 2, title: "Compensación", icon: DollarSign },
  { id: 3, title: "Permisos", icon: Shield }
];

const EmployeeCreationWizard = ({ isOpen, onClose, onSuccess }: EmployeeCreationWizardProps) => {
  const { profile, restaurant } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [wizardData, setWizardData] = useState<WizardData>({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    selectedPreset: "cashier",
    base_salary: null,
    salary_frequency: "monthly",
    has_bonus: false,
    bonus_config: null,
    permissions: getPresetPermissions("cashier"),
    dangerConfirmed: {}
  });

  const updateWizardData = useCallback((updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  }, []);

  const handlePresetChange = useCallback((preset: string) => {
    const presetPermissions = getPresetPermissions(preset);
    updateWizardData({ 
      selectedPreset: preset, 
      permissions: presetPermissions,
      dangerConfirmed: {} // Reset confirmed dangerous permissions
    });
  }, [updateWizardData]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          wizardData.full_name.trim() && 
          wizardData.email.trim() && 
          wizardData.password.trim() && 
          wizardData.password.length >= 6
        );
      case 2:
        return true; // Salary is optional
      case 3:
        return true; // Permissions are pre-filled from preset
      default:
        return false;
    }
  };

  const canProceed = validateStep(currentStep);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!restaurant?.id || !profile?.id) {
      toast({
        title: "Error",
        description: "No se pudo obtener la información del restaurante",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create user via edge function
      const { data: result, error: createError } = await supabase.functions.invoke('create-employee', {
        body: {
          email: wizardData.email,
          password: wizardData.password,
          full_name: wizardData.full_name,
          phone: wizardData.phone || null,
          role: wizardData.selectedPreset === 'admin' ? 'admin' : 'employee',
          permissions: {}, // We'll use the new system
          restaurant_id: restaurant.id,
          created_by: profile.id,
          restaurant_name: restaurant.name || 'Mi Establecimiento',
          owner_name: profile.full_name || 'Administrador'
        }
      });

      if (createError || result?.error) {
        throw new Error(result?.error || createError?.message || 'Error creando empleado');
      }

      const employeeId = result.user_id;

      // 2. Update profile with salary info
      if (wizardData.base_salary) {
        await supabase
          .from('profiles')
          .update({
            base_salary: wizardData.base_salary,
            salary_frequency: wizardData.salary_frequency
          })
          .eq('id', employeeId);
      }

      // 3. Insert permissions using the new table
      const permissionInserts: any[] = [];
      Object.entries(wizardData.permissions).forEach(([moduleKey, permissionKeys]) => {
        permissionKeys.forEach((permissionKey: string) => {
          const isDangerConfirmed = wizardData.dangerConfirmed[moduleKey]?.includes(permissionKey);
          permissionInserts.push({
            restaurant_id: restaurant.id,
            employee_id: employeeId,
            module_key: moduleKey,
            permission_key: permissionKey,
            allowed: true,
            danger_confirmed_at: isDangerConfirmed ? new Date().toISOString() : null,
            danger_confirmed_by: isDangerConfirmed ? profile.id : null
          });
        });
      });

      if (permissionInserts.length > 0) {
        const { error: permError } = await supabase
          .from('employee_permissions')
          .insert(permissionInserts);
        
        if (permError) {
          console.error('Error inserting permissions:', permError);
        }
      }

      // 4. Insert bonus configuration if exists
      if (wizardData.has_bonus && wizardData.bonus_config) {
        const { error: bonusError } = await supabase
          .from('employee_bonuses')
          .insert({
            restaurant_id: restaurant.id,
            employee_id: employeeId,
            bonus_type: wizardData.bonus_config.bonus_type,
            frequency: wizardData.bonus_config.frequency,
            rule_description: wizardData.bonus_config.rule_description,
            formula: wizardData.bonus_config.formula,
            conditions: wizardData.bonus_config.conditions,
            max_cap: wizardData.bonus_config.max_cap,
            is_active: true,
            configured_via_ai: false
          });
        
        if (bonusError) {
          console.error('Error inserting bonus:', bonusError);
        }
      }

      toast({
        title: "¡Empleado creado!",
        description: `${wizardData.full_name} ya puede acceder al sistema con sus credenciales`
      });

      onSuccess();
      onClose();
      
      // Reset wizard
      setCurrentStep(1);
      setWizardData({
        full_name: "",
        phone: "",
        email: "",
        password: "",
        selectedPreset: "cashier",
        base_salary: null,
        salary_frequency: "monthly",
        has_bonus: false,
        bonus_config: null,
        permissions: getPresetPermissions("cashier"),
        dangerConfirmed: {}
      });

    } catch (error: any) {
      console.error("Error creating employee:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el empleado",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl max-h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col m-4"
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Nuevo Empleado</h2>
              <p className="text-muted-foreground mt-1">
                Paso {currentStep} de {STEPS.length}: {STEPS[currentStep - 1].title}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="px-6 pb-4">
            <Progress value={progress} className="h-2" />
            
            {/* Step indicators */}
            <div className="flex justify-between mt-4">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div
                    key={step.id}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isActive
                          ? "bg-primary/20 text-primary border-2 border-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-sm hidden sm:block ${
                      isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepBasicData
                  data={wizardData}
                  onUpdate={updateWizardData}
                  onPresetChange={handlePresetChange}
                />
              </motion.div>
            )}
            
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepCompensation
                  data={wizardData}
                  onUpdate={updateWizardData}
                />
              </motion.div>
            )}
            
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StepPermissions
                  data={wizardData}
                  onUpdate={updateWizardData}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </Button>
            
            {currentStep < STEPS.length ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed || isSubmitting}
                className="gap-2 bg-gradient-to-r from-primary to-primary/80"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed || isSubmitting}
                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Crear Empleado
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmployeeCreationWizard;
