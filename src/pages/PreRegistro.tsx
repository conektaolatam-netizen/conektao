import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Form data interface
interface FormData {
  name: string;
  business_name: string;
  city: string;
  branches: string;
  main_business_type: string;
  other_business_type: string;
  pos_uses: string;
  pos_name: string;
  improvements_wanted: string[];
  free_trial_interest: string;
  email: string;
  phone: string;
}

const initialFormData: FormData = {
  name: "",
  business_name: "",
  city: "",
  branches: "",
  main_business_type: "",
  other_business_type: "",
  pos_uses: "",
  pos_name: "",
  improvements_wanted: [],
  free_trial_interest: "",
  email: "",
  phone: "",
};

// Step configurations
const TOTAL_STEPS = 11;

const branchOptions = ["1", "2-3", "4 o más"];
const businessTypeOptions = [
  "Restaurante / Comidas rápidas",
  "Café / Repostería",
  "Minimarket / Tienda",
  "Bar / Gastrobar",
  "Otro",
];
const posOptions = ["Sí", "No"];
const improvementOptions = [
  "Inventario y control de insumos",
  "Control de personal y horarios",
  "Reportes financieros y costos",
  "Inteligencia artificial para decisiones",
  "Integración con proveedores y compras",
  "Todo lo anterior",
];
const trialInterestOptions = [
  "Claro que sí",
  "Quiero saber más antes de decidir",
  "Solo quiero recibir información",
];

export default function PreRegistro() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Calculate actual step (skip pos_name if pos_uses is "No")
  const getActualSteps = () => {
    const steps = [
      "name",
      "business_name",
      "city",
      "branches",
      "main_business_type",
      "pos_uses",
    ];
    if (formData.pos_uses === "Sí") {
      steps.push("pos_name");
    }
    steps.push("improvements_wanted", "free_trial_interest", "email", "phone");
    return steps;
  };

  const actualSteps = getActualSteps();
  const totalActualSteps = actualSteps.length;
  const currentField = actualSteps[currentStep];

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentField) {
      case "name":
        if (!formData.name.trim()) {
          newErrors.name = "Por favor escribe tu nombre.";
        } else if (formData.name.trim().length < 2) {
          newErrors.name = "El nombre debe tener al menos 2 caracteres.";
        }
        break;
      case "business_name":
        if (!formData.business_name.trim()) {
          newErrors.business_name = "Por favor escribe el nombre de tu negocio.";
        }
        break;
      case "city":
        if (!formData.city.trim()) {
          newErrors.city = "Por favor escribe tu ciudad.";
        }
        break;
      case "branches":
        if (!formData.branches) {
          newErrors.branches = "Por favor selecciona una opción.";
        }
        break;
      case "main_business_type":
        if (!formData.main_business_type) {
          newErrors.main_business_type = "Por favor selecciona una opción.";
        }
        if (formData.main_business_type === "Otro" && !formData.other_business_type.trim()) {
          newErrors.other_business_type = "Por favor especifica el tipo de negocio.";
        }
        break;
      case "pos_uses":
        if (!formData.pos_uses) {
          newErrors.pos_uses = "Por favor selecciona una opción.";
        }
        break;
      case "pos_name":
        if (!formData.pos_name.trim()) {
          newErrors.pos_name = "Por favor escribe el nombre del software que usas.";
        }
        break;
      case "improvements_wanted":
        if (formData.improvements_wanted.length === 0) {
          newErrors.improvements_wanted = "Por favor selecciona al menos una opción.";
        }
        break;
      case "free_trial_interest":
        if (!formData.free_trial_interest) {
          newErrors.free_trial_interest = "Por favor selecciona una opción.";
        }
        break;
      case "email":
        if (!formData.email.trim()) {
          newErrors.email = "Por favor escribe tu correo electrónico.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "El correo no parece válido.";
        }
        break;
      case "phone":
        if (!formData.phone.trim()) {
          newErrors.phone = "Por favor escribe tu teléfono o WhatsApp.";
        } else if (formData.phone.replace(/\D/g, "").length < 8) {
          newErrors.phone = "El teléfono debe tener al menos 8 dígitos.";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < totalActualSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const businessType = formData.main_business_type === "Otro" 
        ? formData.other_business_type 
        : formData.main_business_type;

      const registrationData = {
        name: formData.name.trim(),
        business_name: formData.business_name.trim(),
        city: formData.city.trim(),
        branches: formData.branches,
        main_business_type: businessType,
        pos_uses: formData.pos_uses === "Sí",
        pos_name: formData.pos_uses === "Sí" ? formData.pos_name.trim() : null,
        improvements_wanted: formData.improvements_wanted,
        free_trial_interest: formData.free_trial_interest,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
      };

      // Insert into Supabase
      const { error: dbError } = await supabase
        .from("prelaunch_registrations")
        .insert(registrationData);

      if (dbError) {
        console.error("Database error:", dbError);
        toast.error("Tuvimos un problema guardando tus datos. Intenta de nuevo en unos segundos.");
        setIsSubmitting(false);
        return;
      }

      // Send email notification (don't block on failure)
      try {
        await supabase.functions.invoke("send-prelaunch-notification", {
          body: { ...registrationData, created_at: new Date().toISOString() },
        });
      } catch (emailError) {
        console.error("Email notification error:", emailError);
        // Don't show error to user - DB insert succeeded
      }

      setIsCompleted(true);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Tuvimos un problema guardando tus datos. Intenta de nuevo en unos segundos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleImprovement = (option: string) => {
    setFormData((prev) => {
      let newImprovements = [...prev.improvements_wanted];
      
      if (option === "Todo lo anterior") {
        // If selecting "All", add all options
        if (newImprovements.includes(option)) {
          newImprovements = [];
        } else {
          newImprovements = [...improvementOptions];
        }
      } else {
        // Toggle individual option
        if (newImprovements.includes(option)) {
          newImprovements = newImprovements.filter((o) => o !== option && o !== "Todo lo anterior");
        } else {
          newImprovements.push(option);
          // If all individual options are selected, also select "All"
          const individualOptions = improvementOptions.filter((o) => o !== "Todo lo anterior");
          if (individualOptions.every((o) => newImprovements.includes(o))) {
            if (!newImprovements.includes("Todo lo anterior")) {
              newImprovements.push("Todo lo anterior");
            }
          }
        }
      }
      
      return { ...prev, improvements_wanted: newImprovements };
    });
  };

  const renderStep = () => {
    switch (currentField) {
      case "name":
        return (
          <StepContainer title="¿Cómo te llamas?">
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Tu nombre completo"
              className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500 h-14 text-lg rounded-xl"
              autoFocus
            />
            {errors.name && <ErrorMessage message={errors.name} />}
          </StepContainer>
        );

      case "business_name":
        return (
          <StepContainer title="Nombre de tu negocio">
            <Input
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              placeholder="Ej: Restaurante El Sabor"
              className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500 h-14 text-lg rounded-xl"
              autoFocus
            />
            {errors.business_name && <ErrorMessage message={errors.business_name} />}
          </StepContainer>
        );

      case "city":
        return (
          <StepContainer title="Ciudad donde operas">
            <Input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Ej: Bogotá, Medellín, Cali..."
              className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500 h-14 text-lg rounded-xl"
              autoFocus
            />
            {errors.city && <ErrorMessage message={errors.city} />}
          </StepContainer>
        );

      case "branches":
        return (
          <StepContainer title="¿Cuántas sucursales tienes actualmente?">
            <div className="space-y-3">
              {branchOptions.map((option) => (
                <OptionButton
                  key={option}
                  label={option}
                  selected={formData.branches === option}
                  onClick={() => setFormData({ ...formData, branches: option })}
                />
              ))}
            </div>
            {errors.branches && <ErrorMessage message={errors.branches} />}
          </StepContainer>
        );

      case "main_business_type":
        return (
          <StepContainer title="¿Qué vendes principalmente?">
            <div className="space-y-3">
              {businessTypeOptions.map((option) => (
                <OptionButton
                  key={option}
                  label={option}
                  selected={formData.main_business_type === option}
                  onClick={() => setFormData({ ...formData, main_business_type: option })}
                />
              ))}
            </div>
            {formData.main_business_type === "Otro" && (
              <Input
                value={formData.other_business_type}
                onChange={(e) => setFormData({ ...formData, other_business_type: e.target.value })}
                placeholder="Especifica tu tipo de negocio"
                className="mt-4 bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500 h-12 rounded-xl"
                autoFocus
              />
            )}
            {errors.main_business_type && <ErrorMessage message={errors.main_business_type} />}
            {errors.other_business_type && <ErrorMessage message={errors.other_business_type} />}
          </StepContainer>
        );

      case "pos_uses":
        return (
          <StepContainer title="¿Usas algún software de facturación o POS actualmente?">
            <div className="space-y-3">
              {posOptions.map((option) => (
                <OptionButton
                  key={option}
                  label={option}
                  selected={formData.pos_uses === option}
                  onClick={() => setFormData({ ...formData, pos_uses: option })}
                />
              ))}
            </div>
            {errors.pos_uses && <ErrorMessage message={errors.pos_uses} />}
          </StepContainer>
        );

      case "pos_name":
        return (
          <StepContainer title="¿Cuál usas actualmente?">
            <Input
              value={formData.pos_name}
              onChange={(e) => setFormData({ ...formData, pos_name: e.target.value })}
              placeholder="Ej: Siigo, Botón de Pago, Alegra..."
              className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500 h-14 text-lg rounded-xl"
              autoFocus
            />
            {errors.pos_name && <ErrorMessage message={errors.pos_name} />}
          </StepContainer>
        );

      case "improvements_wanted":
        return (
          <StepContainer title="¿Qué te gustaría que mejorara tu sistema actual?">
            <p className="text-gray-400 text-sm mb-4">Puedes seleccionar varias opciones</p>
            <div className="space-y-3">
              {improvementOptions.map((option) => (
                <OptionButton
                  key={option}
                  label={option}
                  selected={formData.improvements_wanted.includes(option)}
                  onClick={() => toggleImprovement(option)}
                  isCheckbox
                />
              ))}
            </div>
            {errors.improvements_wanted && <ErrorMessage message={errors.improvements_wanted} />}
          </StepContainer>
        );

      case "free_trial_interest":
        return (
          <StepContainer title="¿Te interesa probar Conektao gratis durante 2 meses?">
            <div className="space-y-3">
              {trialInterestOptions.map((option) => (
                <OptionButton
                  key={option}
                  label={option}
                  selected={formData.free_trial_interest === option}
                  onClick={() => setFormData({ ...formData, free_trial_interest: option })}
                />
              ))}
            </div>
            {errors.free_trial_interest && <ErrorMessage message={errors.free_trial_interest} />}
          </StepContainer>
        );

      case "email":
        return (
          <StepContainer title="Correo electrónico de contacto">
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="tucorreo@ejemplo.com"
              className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500 h-14 text-lg rounded-xl"
              autoFocus
            />
            {errors.email && <ErrorMessage message={errors.email} />}
          </StepContainer>
        );

      case "phone":
        return (
          <StepContainer title="Teléfono o WhatsApp">
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+57 300 123 4567"
              className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-gray-500 h-14 text-lg rounded-xl"
              autoFocus
            />
            {errors.phone && <ErrorMessage message={errors.phone} />}
          </StepContainer>
        );

      default:
        return null;
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#050608] relative overflow-hidden flex items-center justify-center p-4">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-[#0d0d0d]/90 backdrop-blur-xl rounded-3xl p-8 border border-[#222] shadow-2xl text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-500 to-teal-500 flex items-center justify-center"
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              🚀 Estás oficialmente en lista de prioridad para usar Conektao
            </h2>
            
            <p className="text-gray-400 mb-8">
              ¡Gracias por confiar en nosotros! Muy pronto nos pondremos en contacto para activar tu prueba gratuita.
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => window.open("https://www.instagram.com/conektao/", "_blank")}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/20"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visitar Instagram de Conektao
              </Button>
              
              <Button
                onClick={() => window.location.href = "/"}
                variant="ghost"
                className="w-full h-12 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-xl"
              >
                <X className="w-4 h-4 mr-2" />
                Cerrar
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] relative overflow-hidden flex flex-col">
      <AnimatedBackground />
      
      {/* Header with logo */}
      <header className="relative z-10 p-4 pt-6">
        <h1 className="text-2xl font-bold text-center text-white tracking-wide">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-teal-400">
            Conektao
          </span>
        </h1>
      </header>

      {/* Main content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          {/* Welcome message (only on first step) */}
          {currentStep === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h1 className="text-xl font-medium text-white leading-relaxed">
                Estás a punto de{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500 font-bold drop-shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                  transformar tu negocio
                </span>{" "}
                con inteligencia artificial.
              </h1>
            </motion.div>
          )}

          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500 text-sm">
                Paso {currentStep + 1} de {totalActualSteps}
              </span>
              <span className="text-gray-500 text-sm">
                {Math.round(((currentStep + 1) / totalActualSteps) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-teal-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / totalActualSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Form card */}
          <motion.div
            className="bg-[#0d0d0d]/90 backdrop-blur-xl rounded-3xl p-6 border border-[#222] shadow-2xl"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-8">
              {currentStep > 0 && (
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  className="flex-1 h-12 text-gray-400 hover:text-white hover:bg-[#1a1a1a] rounded-xl"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className={`${currentStep === 0 ? "w-full" : "flex-1"} h-12 bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-orange-500/20`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : currentStep === totalActualSteps - 1 ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Finalizar registro
                  </>
                ) : (
                  <>
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

// Sub-components

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Wave 1 - Orange - flowing movement */}
      <motion.div
        className="absolute w-[600px] h-[400px] top-[10%] left-[5%]"
        animate={{
          x: [0, 100, 0, -50, 0],
          y: [0, 50, 100, 50, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: "radial-gradient(ellipse at center, rgba(249, 115, 22, 0.4) 0%, rgba(249, 115, 22, 0.15) 40%, transparent 70%)",
          filter: "blur(80px)",
          borderRadius: "50%",
        }}
      />
      
      {/* Wave 2 - Teal - opposite flowing */}
      <motion.div
        className="absolute w-[500px] h-[350px] bottom-[10%] right-[5%]"
        animate={{
          x: [0, -80, 0, 60, 0],
          y: [0, -60, -100, -40, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: "radial-gradient(ellipse at center, rgba(20, 184, 166, 0.4) 0%, rgba(20, 184, 166, 0.15) 40%, transparent 70%)",
          filter: "blur(80px)",
          borderRadius: "50%",
        }}
      />

      {/* Wave 3 - Center pulsing gradient */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[600px] h-[400px]"
        style={{
          transform: "translate(-50%, -50%)",
        }}
        animate={{
          scale: [1, 1.2, 1, 0.9, 1],
          opacity: [0.2, 0.35, 0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div 
          className="w-full h-full rounded-full"
          style={{
            background: "linear-gradient(135deg, rgba(249, 115, 22, 0.3) 0%, rgba(20, 184, 166, 0.3) 100%)",
            filter: "blur(100px)",
          }}
        />
      </motion.div>

      {/* Wave 4 - Small orange accent moving */}
      <motion.div
        className="absolute w-[250px] h-[250px] top-[5%] right-[10%]"
        animate={{
          x: [0, -60, 0, 40, 0],
          y: [0, 40, 80, 40, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: "radial-gradient(ellipse at center, rgba(249, 115, 22, 0.35) 0%, transparent 60%)",
          filter: "blur(50px)",
          borderRadius: "50%",
        }}
      />

      {/* Wave 5 - Small teal accent moving */}
      <motion.div
        className="absolute w-[300px] h-[300px] bottom-[5%] left-[10%]"
        animate={{
          x: [0, 50, 0, -40, 0],
          y: [0, -50, -80, -30, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: "radial-gradient(ellipse at center, rgba(20, 184, 166, 0.35) 0%, transparent 60%)",
          filter: "blur(50px)",
          borderRadius: "50%",
        }}
      />
    </div>
  );
}

function StepContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">{title}</h2>
      {children}
    </div>
  );
}

function OptionButton({ 
  label, 
  selected, 
  onClick, 
  isCheckbox = false 
}: { 
  label: string; 
  selected: boolean; 
  onClick: () => void;
  isCheckbox?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`w-full p-4 rounded-xl text-left transition-all duration-200 flex items-center gap-3 ${
        selected
          ? "bg-gradient-to-r from-orange-500/20 to-teal-500/20 border-2 border-orange-500/50"
          : "bg-[#1a1a1a] border-2 border-[#333] hover:border-[#444]"
      }`}
    >
      <div className={`w-5 h-5 rounded-${isCheckbox ? 'md' : 'full'} border-2 flex items-center justify-center transition-all ${
        selected 
          ? "bg-gradient-to-r from-orange-500 to-teal-500 border-transparent" 
          : "border-[#444]"
      }`}>
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className={`${selected ? "text-white font-semibold" : "text-gray-300"}`}>
        {label}
      </span>
    </motion.button>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-red-400 text-sm mt-2"
    >
      {message}
    </motion.p>
  );
}
