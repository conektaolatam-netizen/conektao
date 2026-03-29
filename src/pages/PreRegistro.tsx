import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Sparkles, Store, Phone, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FormData {
  name: string;
  phone: string;
  main_business_type: string;
}

const initialFormData: FormData = {
  name: "",
  phone: "",
  main_business_type: "",
};

const businessTypeOptions = [
  { label: "🍽️ Restaurante", value: "Restaurante" },
  { label: "☕ Café / Repostería", value: "Café / Repostería" },
  { label: "🛒 Minimarket / Tienda", value: "Minimarket / Tienda" },
  { label: "🍸 Bar / Gastrobar", value: "Bar / Gastrobar" },
  { label: "🍕 Pizzería / Comida rápida", value: "Pizzería / Comida rápida" },
  { label: "🥡 Dark Kitchen", value: "Dark Kitchen" },
  { label: "✨ Otro", value: "Otro" },
];

const needOptions = [
  { emoji: "🛵", label: "Mejorar la atención en domicilios", value: "mejorar_domicilios" },
  { emoji: "💸", label: "Reducir comisiones a plataformas de domicilios", value: "reducir_comisiones" },
  { emoji: "📊", label: "Usar mis datos de ventas para tomar mejores decisiones", value: "usar_datos_ventas" },
];

// Generate unique session ID for tracking
const generateSessionId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

type Step = "form" | "needs" | "completed";

export default function PreRegistro() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("form");
  const [selectedNeed, setSelectedNeed] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  const [showCustomBusinessInput, setShowCustomBusinessInput] = useState(false);
  const sessionIdRef = useRef<string>(generateSessionId());
  const partialSavedRef = useRef<boolean>(false);

  // Save partial data when user starts typing
  useEffect(() => {
    const savePartialData = async () => {
      if (!formData.name.trim() || formData.name.trim().length < 2) return;
      
      try {
        const partialData = {
          session_id: sessionIdRef.current,
          step_reached: formData.phone ? 3 : formData.main_business_type ? 2 : 1,
          name: formData.name.trim() || null,
          business_type: formData.main_business_type || null,
          phone: formData.phone || null,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        };

        if (!partialSavedRef.current) {
          await supabase
            .from("prelaunch_partial_registrations")
            .insert(partialData);
          partialSavedRef.current = true;
        } else {
          await supabase
            .from("prelaunch_partial_registrations")
            .update({
              step_reached: partialData.step_reached,
              name: partialData.name,
              business_type: partialData.business_type,
              phone: partialData.phone,
            })
            .eq("session_id", sessionIdRef.current);
        }
      } catch (error) {
        console.error("Error saving partial data:", error);
      }
    };

    const timeoutId = setTimeout(savePartialData, 1500);
    return () => clearTimeout(timeoutId);
  }, [formData.name, formData.main_business_type, formData.phone]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tu nombre es requerido";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Mínimo 2 caracteres";
    }

    if (!formData.main_business_type) {
      newErrors.main_business_type = "Selecciona tu tipo de negocio";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Tu WhatsApp es requerido";
    } else if (formData.phone.replace(/\D/g, "").length < 8) {
      newErrors.phone = "Mínimo 8 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitStep1 = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 1. Insert into leads_conektao
      const { data, error: dbError } = await supabase
        .from("leads_conektao")
        .insert({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          main_business_type: formData.main_business_type,
          completo_flujo: false,
        })
        .select("id")
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        toast.error("Tuvimos un problema. Intenta de nuevo.");
        setIsSubmitting(false);
        return;
      }

      setLeadId(data.id);

      // 2. Mark partial registration as converted
      await supabase
        .from("prelaunch_partial_registrations")
        .update({ 
          is_converted: true, 
          converted_at: new Date().toISOString() 
        })
        .eq("session_id", sessionIdRef.current);

      // 3. Send notification email immediately
      try {
        await supabase.functions.invoke("send-prelaunch-notification", {
          body: {
            name: formData.name.trim(),
            main_business_type: formData.main_business_type,
            phone: formData.phone.trim(),
            completo_flujo: false,
            created_at: new Date().toISOString(),
          },
        });
      } catch (emailError) {
        console.error("Email notification error:", emailError);
      }

      // 4. Transition to step 2
      setCurrentStep("needs");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Tuvimos un problema. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishStep2 = async () => {
    setIsFinishing(true);
    try {
      const necesidad = selectedNeed || "no_respondió";

      if (leadId) {
        await supabase
          .from("leads_conektao")
          .update({
            necesidad_principal: necesidad,
            completo_flujo: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", leadId);
      }

      setCurrentStep("completed");
    } catch (error) {
      console.error("Error finishing step 2:", error);
      // Even on error, show confirmation — step 1 data is already saved
      setCurrentStep("completed");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] relative overflow-hidden flex items-center justify-center p-3 sm:p-4">
      <AnimatedBackground />
      
      <AnimatePresence mode="wait">
        {currentStep === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Logo & Intro */}
            <div className="text-center mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 via-orange-300 to-teal-400 bg-clip-text text-transparent mb-2">
                Conektao
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 max-w-xs mx-auto">
                Regístrate para el <span className="text-orange-400 font-medium">prelanzamiento exclusivo</span>
              </p>
            </div>

            {/* Main Form Card */}
            <div className="bg-[#0d0d0d]/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#222] shadow-2xl">
              <div className="text-center mb-4 sm:mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-3xl sm:text-4xl mb-2"
                >
                  📝
                </motion.div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Solo 3 datos rápidos</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Te tomará menos de 30 segundos</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* Name Field */}
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                    <Input
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: "" });
                      }}
                      placeholder="Tu nombre"
                      className="pl-10 sm:pl-12 bg-[#1a1a1a]/80 border-[#333] text-white placeholder:text-gray-500 h-12 sm:h-14 text-base rounded-xl focus:border-orange-500 focus:ring-orange-500/20"
                      autoFocus
                      autoComplete="name"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-400 text-xs mt-1 ml-1">{errors.name}</p>
                  )}
                </div>

                {/* Business Type Dropdown */}
                <div>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-teal-400 z-10" />
                    <button
                      type="button"
                      onClick={() => setShowBusinessDropdown(!showBusinessDropdown)}
                      className={`w-full pl-10 sm:pl-12 pr-10 bg-[#1a1a1a]/80 border border-[#333] text-left h-12 sm:h-14 text-base rounded-xl transition-all ${
                        formData.main_business_type ? "text-white" : "text-gray-500"
                      } ${showBusinessDropdown ? "border-teal-500 ring-2 ring-teal-500/20" : ""}`}
                    >
                      {showCustomBusinessInput ? "✨ Otro" : formData.main_business_type || "Tipo de negocio"}
                    </button>
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${showBusinessDropdown ? "rotate-180" : ""}`} />
                  </div>
                  
                  <AnimatePresence>
                    {showBusinessDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mt-2 bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden shadow-xl"
                      >
                        {businessTypeOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              if (option.value === "Otro") {
                                setShowCustomBusinessInput(true);
                                setFormData({ ...formData, main_business_type: "" });
                                setShowBusinessDropdown(false);
                              } else {
                                setShowCustomBusinessInput(false);
                                setFormData({ ...formData, main_business_type: option.value });
                                setShowBusinessDropdown(false);
                              }
                              if (errors.main_business_type) setErrors({ ...errors, main_business_type: "" });
                            }}
                            className={`w-full p-3 sm:p-4 text-left text-sm sm:text-base transition-colors ${
                              formData.main_business_type === option.value
                                ? "bg-gradient-to-r from-orange-500/20 to-teal-500/20 text-white"
                                : "text-gray-300 hover:bg-[#222]"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {showCustomBusinessInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2"
                    >
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-teal-400 z-10" />
                        <Input
                          type="text"
                          placeholder="Escribe tu tipo de negocio"
                          value={formData.main_business_type}
                          onChange={(e) => {
                            setFormData({ ...formData, main_business_type: e.target.value });
                            if (errors.main_business_type) setErrors({ ...errors, main_business_type: "" });
                          }}
                          className="pl-10 sm:pl-12 bg-[#1a1a1a]/80 border-[#333] text-white h-12 sm:h-14 text-base rounded-xl placeholder:text-gray-500 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                          autoFocus
                        />
                      </div>
                    </motion.div>
                  )}

                  {errors.main_business_type && (
                    <p className="text-red-400 text-xs mt-1 ml-1">{errors.main_business_type}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-teal-400" />
                    <Input
                      type="tel"
                      inputMode="numeric"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (errors.phone) setErrors({ ...errors, phone: "" });
                      }}
                      placeholder="Tu WhatsApp (para avisarte primero) 📲"
                      className="pl-10 sm:pl-12 bg-[#1a1a1a]/80 border-[#333] text-white placeholder:text-gray-500 h-12 sm:h-14 text-base rounded-xl focus:border-teal-500 focus:ring-teal-500/20"
                      autoComplete="tel"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-400 text-xs mt-1 ml-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-5 sm:mt-6">
                <Button
                  onClick={handleSubmitStep1}
                  disabled={isSubmitting}
                  className="w-full h-12 sm:h-14 bg-gradient-to-r from-teal-500 via-orange-500 to-teal-500 hover:from-teal-400 hover:via-orange-400 hover:to-teal-400 text-white font-bold rounded-xl transition-all duration-300 text-sm sm:text-base shadow-[0_0_25px_rgba(249,115,22,0.4),0_0_50px_rgba(20,184,166,0.2)] hover:shadow-[0_0_35px_rgba(249,115,22,0.6),0_0_70px_rgba(20,184,166,0.4)] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      ¡Quiero mi acceso exclusivo! 🚀
                    </span>
                  )}
                </Button>
                
                <p className="text-center text-gray-500 text-[10px] sm:text-xs mt-3">
                  <Sparkles className="w-3 h-3 inline mr-1 text-orange-400/60" />
                  Prometemos no enviarte spam, solo cosas buenas
                </p>
              </div>
            </div>

            <p className="text-center text-gray-600 text-[10px] sm:text-xs mt-4">
              Tus datos están seguros con nosotros 🔒
            </p>
          </motion.div>
        )}

        {currentStep === "needs" && (
          <motion.div
            key="needs"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="bg-[#0d0d0d]/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#222] shadow-2xl">
              <div className="text-center mb-5 sm:mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-4xl sm:text-5xl mb-3"
                >
                  🎯
                </motion.div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-1">Una última cosa...</h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  ¿Qué sientes que más necesitas mejorar en tu negocio ahora mismo?
                </p>
              </div>

              <div className="space-y-3">
                {needOptions.map((option) => (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    type="button"
                    onClick={() =>
                      setSelectedNeed(selectedNeed === option.value ? null : option.value)
                    }
                    className={`w-full p-4 rounded-xl border text-left transition-all duration-300 ${
                      selectedNeed === option.value
                        ? "border-transparent bg-gradient-to-r from-orange-500/30 to-teal-500/30 shadow-[0_0_20px_rgba(249,115,22,0.2),0_0_40px_rgba(20,184,166,0.1)]"
                        : "border-[#333] bg-[#1a1a1a]/60 hover:border-[#444] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{option.emoji}</span>
                      <span className={`text-sm sm:text-base font-medium leading-snug ${
                        selectedNeed === option.value ? "text-white" : "text-gray-300"
                      }`}>
                        {option.label}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-5 sm:mt-6">
                <Button
                  onClick={handleFinishStep2}
                  disabled={isFinishing}
                  className="w-full h-12 sm:h-14 bg-gradient-to-r from-teal-500 via-orange-500 to-teal-500 hover:from-teal-400 hover:via-orange-400 hover:to-teal-400 text-white font-bold rounded-xl transition-all duration-300 text-sm sm:text-base shadow-[0_0_25px_rgba(249,115,22,0.4),0_0_50px_rgba(20,184,166,0.2)] hover:shadow-[0_0_35px_rgba(249,115,22,0.6),0_0_70px_rgba(20,184,166,0.4)] active:scale-[0.98]"
                >
                  {isFinishing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Finalizar y obtener mi acceso ✨"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === "completed" && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="bg-[#0d0d0d]/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-[#222] shadow-2xl text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-5xl sm:text-6xl mb-4"
              >
                🎉
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl sm:text-2xl font-bold text-white mb-3"
              >
                ¡Ya estás dentro!
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-400 mb-6 text-sm sm:text-base"
              >
                Te avisamos primero cuando abramos. Pronto te contactamos por WhatsApp 🚀
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                <Button
                  onClick={() => window.open("https://www.instagram.com/conektao/", "_blank")}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white font-semibold rounded-xl text-sm sm:text-base"
                >
                  Síguenos en Instagram
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => window.close()}
                  className="w-full h-12 text-gray-400 hover:text-white text-sm"
                >
                  Cerrar
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Animated Background Component
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(249,115,22,0) 70%)",
          left: "-20%",
          top: "-20%",
        }}
        animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] sm:w-[800px] sm:h-[800px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(20,184,166,0.12) 0%, rgba(20,184,166,0) 70%)",
          right: "-25%",
          bottom: "-15%",
        }}
        animate={{ scale: [1, 1.15, 1], x: [0, -40, 0], y: [0, -30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}
