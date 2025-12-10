import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Loader2, Sparkles, Store, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FormData {
  name: string;
  phone: string;
  main_business_type: string;
  other_business_type: string;
}

const initialFormData: FormData = {
  name: "",
  phone: "",
  main_business_type: "",
  other_business_type: "",
};

const businessTypeOptions = [
  { label: "🍽️ Restaurante", value: "Restaurante" },
  { label: "☕ Café / Repostería", value: "Café / Repostería" },
  { label: "🛒 Minimarket / Tienda", value: "Minimarket / Tienda" },
  { label: "🍸 Bar / Gastrobar", value: "Bar / Gastrobar" },
  { label: "✨ Otro", value: "Otro" },
];

const stepMotivation = [
  {
    emoji: "📝",
    title: "Regístrate al prelanzamiento",
    subtitle: "Te enviaremos información exclusiva sobre Conektao",
    encouragement: "Paso 1 de 3 • Solo te tomará 30 segundos",
  },
  {
    emoji: "✨",
    title: "Excelente elección, emprendedor",
    subtitle: "Tu tipo de negocio nos ayuda a personalizar la información",
    encouragement: "Paso 2 de 3 • Ya casi llegamos",
  },
  {
    emoji: "🚀",
    title: "¡Un paso del futuro de tu negocio!",
    subtitle: "Te contactaremos con novedades del prelanzamiento",
    encouragement: "Paso 3 de 3 • ¡Último dato!",
  },
];

export default function PreRegistro() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!formData.name.trim()) {
        newErrors.name = "Por favor escribe tu nombre";
      } else if (formData.name.trim().length < 2) {
        newErrors.name = "El nombre debe tener al menos 2 caracteres";
      }
    } else if (currentStep === 1) {
      if (!formData.main_business_type) {
        newErrors.main_business_type = "Selecciona el tipo de tu negocio";
      }
      if (formData.main_business_type === "Otro" && !formData.other_business_type.trim()) {
        newErrors.other_business_type = "Cuéntanos qué tipo de negocio tienes";
      }
    } else if (currentStep === 2) {
      if (!formData.phone.trim()) {
        newErrors.phone = "Necesitamos tu número para contactarte";
      } else if (formData.phone.replace(/\D/g, "").length < 8) {
        newErrors.phone = "El número debe tener al menos 8 dígitos";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < 2) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
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
        business_name: businessType,
        city: "Por definir",
        branches: "1",
        main_business_type: businessType,
        pos_uses: false,
        pos_name: null,
        improvements_wanted: ["Todo lo anterior"],
        free_trial_interest: "Claro que sí",
        email: `${formData.phone.replace(/\D/g, "")}@pendiente.com`,
        phone: formData.phone.trim(),
      };

      const { error: dbError } = await supabase
        .from("prelaunch_registrations")
        .insert(registrationData);

      if (dbError) {
        console.error("Database error:", dbError);
        toast.error("Tuvimos un problema. Intenta de nuevo.");
        setIsSubmitting(false);
        return;
      }

      try {
        await supabase.functions.invoke("send-prelaunch-notification", {
          body: { ...registrationData, created_at: new Date().toISOString() },
        });
      } catch (emailError) {
        console.error("Email notification error:", emailError);
      }

      setIsCompleted(true);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Tuvimos un problema. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    const motivation = stepMotivation[currentStep];
    
    return (
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Motivation Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="text-5xl mb-3"
          >
            {motivation.emoji}
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">{motivation.title}</h2>
          <p className="text-gray-400 mb-2">{motivation.subtitle}</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-orange-400/80 font-medium"
          >
            {motivation.encouragement}
          </motion.p>
        </div>

        {/* Step Content */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-400" />
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="¿Cuál es tu nombre?"
                className="pl-12 bg-[#1a1a1a]/80 border-[#333] text-white placeholder:text-gray-500 h-14 text-lg rounded-2xl focus:border-orange-500 focus:ring-orange-500/20"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
              />
            </div>
            {errors.name && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm"
              >
                {errors.name}
              </motion.p>
            )}
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-3">
            {businessTypeOptions.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                onClick={() => setFormData({ ...formData, main_business_type: option.value })}
                className={`w-full p-4 rounded-2xl text-left transition-all duration-300 border-2 ${
                  formData.main_business_type === option.value
                    ? "bg-gradient-to-r from-orange-500/20 to-teal-500/20 border-orange-500 shadow-lg shadow-orange-500/10"
                    : "bg-[#1a1a1a]/60 border-[#333] hover:border-[#444] hover:bg-[#1a1a1a]"
                }`}
              >
                <span className="text-lg text-white">{option.label}</span>
              </motion.button>
            ))}
            
            <AnimatePresence>
              {formData.main_business_type === "Otro" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Input
                    value={formData.other_business_type}
                    onChange={(e) => setFormData({ ...formData, other_business_type: e.target.value })}
                    placeholder="¿Qué tipo de negocio tienes?"
                    className="mt-3 bg-[#1a1a1a]/80 border-[#333] text-white placeholder:text-gray-500 h-12 rounded-xl"
                    autoFocus
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {(errors.main_business_type || errors.other_business_type) && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm"
              >
                {errors.main_business_type || errors.other_business_type}
              </motion.p>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-400" />
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Tu WhatsApp o celular"
                className="pl-12 bg-[#1a1a1a]/80 border-[#333] text-white placeholder:text-gray-500 h-14 text-lg rounded-2xl focus:border-teal-500 focus:ring-teal-500/20"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
              />
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 text-gray-500 text-sm justify-center"
            >
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Prometemos no enviarte spam, solo cosas buenas</span>
            </motion.div>
            
            {errors.phone && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm"
              >
                {errors.phone}
              </motion.p>
            )}
          </div>
        )}
      </motion.div>
    );
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
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-500 to-teal-500 flex items-center justify-center"
            >
              <Check className="w-12 h-12 text-white" />
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-3"
            >
              🚀 ¡Listo, {formData.name.split(" ")[0]}!
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 mb-6"
            >
              Estás en nuestra lista de prioridad. Te contactaremos pronto con información exclusiva sobre el prelanzamiento de Conektao.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-3"
            >
              <Button
                onClick={() => window.open("https://www.instagram.com/conektao/", "_blank")}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white font-semibold rounded-xl"
              >
                Síguenos en Instagram
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.close()}
                className="w-full h-12 text-gray-400 hover:text-white"
              >
                Cerrar
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] relative overflow-hidden flex items-center justify-center p-4">
      <AnimatedBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo & Intro */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-orange-300 to-teal-400 bg-clip-text text-transparent mb-3">
            Conektao
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed"
          >
            <span className="text-orange-400">Solo 3 preguntas rápidas</span> para registrarte y recibir información exclusiva de nuestro prelanzamiento
          </motion.p>
        </div>

        {/* Main Card */}
        <div className="bg-[#0d0d0d]/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-[#222] shadow-2xl">
          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mb-8">
            {[0, 1, 2].map((step) => (
              <motion.div
                key={step}
                initial={false}
                animate={{
                  scale: currentStep === step ? 1.2 : 1,
                  backgroundColor: currentStep >= step 
                    ? step === 0 ? "#f97316" 
                    : step === 1 ? "#14b8a6" 
                    : "#f97316"
                    : "#333",
                }}
                className="w-3 h-3 rounded-full transition-colors"
              />
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  setCurrentStep(currentStep - 1);
                  setErrors({});
                }}
                className="flex-1 h-12 text-gray-400 hover:text-white border border-[#333] rounded-xl"
              >
                Atrás
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className={`${currentStep === 0 ? "w-full" : "flex-1"} h-14 px-4 bg-gradient-to-r ${
                currentStep === 2 
                  ? "from-teal-500 via-orange-500 to-teal-500 hover:from-teal-400 hover:via-orange-400 hover:to-teal-400 animate-pulse shadow-[0_0_30px_rgba(249,115,22,0.6),0_0_60px_rgba(20,184,166,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.8),0_0_80px_rgba(20,184,166,0.6)]" 
                  : "from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 shadow-lg shadow-orange-500/20"
              } text-white font-bold rounded-xl transition-all duration-300 text-sm sm:text-base`}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : currentStep === 2 ? (
                <span className="flex items-center justify-center gap-2 text-center leading-tight">
                  <Sparkles className="w-5 h-5 flex-shrink-0 animate-pulse" />
                  <span className="text-xs sm:text-sm">¡Enviar antes de que se acaben los cupos!</span>
                </span>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Tus datos están seguros con nosotros 🔒
        </p>
      </motion.div>
    </div>
  );
}

// Animated Background Component with more visible waves
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Wave 1 - Orange large - MORE VISIBLE */}
      <motion.div
        className="absolute w-[900px] h-[900px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(25, 95%, 53%) 0%, transparent 60%)",
          filter: "blur(60px)",
          left: "-25%",
          top: "-35%",
          opacity: 0.15,
        }}
        animate={{
          x: [0, 200, 50, 0],
          y: [0, 150, -50, 0],
          scale: [1, 1.3, 0.9, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Wave 2 - Teal - MORE VISIBLE */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(174, 72%, 45%) 0%, transparent 60%)",
          filter: "blur(70px)",
          right: "-15%",
          bottom: "-25%",
          opacity: 0.12,
        }}
        animate={{
          x: [0, -150, 50, 0],
          y: [0, -120, 80, 0],
          scale: [1.1, 0.8, 1.2, 1.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Wave 3 - Mixed gradient accent - MOVING */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: "linear-gradient(135deg, hsl(25, 95%, 53%) 0%, hsl(174, 72%, 40%) 100%)",
          filter: "blur(50px)",
          left: "30%",
          top: "20%",
          opacity: 0.1,
        }}
        animate={{
          x: [0, 120, -80, 0],
          y: [0, -100, 60, 0],
          rotate: [0, 90, 180, 270, 360],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Wave 4 - Orange small floating */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(30, 100%, 55%) 0%, transparent 70%)",
          filter: "blur(40px)",
          right: "10%",
          top: "10%",
          opacity: 0.18,
        }}
        animate={{
          x: [0, -80, 60, 0],
          y: [0, 100, -40, 0],
          scale: [0.8, 1.3, 0.9, 0.8],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Wave 5 - Teal accent bottom left */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(180, 60%, 45%) 0%, transparent 65%)",
          filter: "blur(50px)",
          left: "5%",
          bottom: "10%",
          opacity: 0.14,
        }}
        animate={{
          x: [0, 100, -60, 0],
          y: [0, -80, 50, 0],
          scale: [1, 0.7, 1.2, 1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
