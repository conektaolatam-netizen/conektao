
import React, { useState, useEffect } from "react";
import aliciaAvatarImg from "@/assets/alicia-avatar.png";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sparkles, 
  Zap, 
  Brain, 
  Bot, 
  Rocket, 
  Shield, 
  Users, 
  MapPin, 
  Calculator, 
  FileText, 
  Wallet, 
  Package, 
  Receipt, 
  Smartphone, 
  TrendingUp, 
  Star,
  ArrowRight,
  Play,
  CheckCircle,
  Globe,
  CreditCard,
  Building,
  ShoppingCart,
  Loader2,
  MessageCircle,
  UtensilsCrossed,
  Coffee,
  Store
} from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({ name: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [marketplaceStep, setMarketplaceStep] = useState(0);
  const [aiAnalysisStep, setAiAnalysisStep] = useState(0);

  // Logo animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setLogoAnimated(true), 500);
    const timer2 = setTimeout(() => setShowContent(true), 2000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 7);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Marketplace animation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketplaceStep((prev) => (prev + 1) % 6);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // AI Analysis animation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setAiAnalysisStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleContact = async () => {
    if (!contactForm.name || !contactForm.phone) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa tu nombre y teléfono",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('prelaunch_registrations')
        .insert({
          name: contactForm.name,
          phone: contactForm.phone,
          business_name: 'Contacto Welcome',
          city: 'No especificada',
          email: `${contactForm.phone}@contacto.welcome`,
          main_business_type: 'contacto_welcome',
          branches: '1',
          free_trial_interest: 'si',
          improvements_wanted: ['contacto_general'],
          pos_uses: false
        });

      if (error) throw error;

      toast({
        title: "¡Gracias por tu interés!",
        description: "Nos pondremos en contacto contigo muy pronto",
      });
      
      setContactForm({ name: "", phone: "" });
    } catch (error) {
      console.error('Error al guardar contacto:', error);
      toast({
        title: "Error",
        description: "No pudimos guardar tu información. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: Smartphone,
      title: "POS inteligente para restaurantes",
      description: "Sistema de punto de venta con facturación electrónica, gestión de mesas, control de caja y reportes de ventas en tiempo real. El sistema POS restaurante Colombia que tu negocio necesita.",
      gradient: "from-orange-400 via-orange-500 to-orange-600",
      animation: "hover:animate-bounce"
    },
    {
      icon: Package,
      title: "Control de inventario y food cost automático",
      description: "Software inventario restaurante con control de ingredientes, costeo automático de recetas y cálculo de food cost en tiempo real. Cada venta descuenta ingredientes automáticamente.",
      gradient: "from-orange-500 via-orange-600 to-orange-700",
      animation: "hover:animate-spin"
    },
    {
      icon: Receipt,
      title: "Facturas IA — escaneo OCR inteligente",
      description: "Escanea facturas de proveedores con inteligencia artificial. El OCR reconoce productos, cantidades y precios para actualizar tu inventario automáticamente. Software de facturación para restaurantes.",
      gradient: "from-teal-400 via-teal-500 to-teal-600",
      animation: "hover:animate-pulse"
    },
    {
      icon: Users,
      title: "Gestión de personal restaurante",
      description: "Nómina automática, geolocalización de empleados, control de turnos y bonificaciones inteligentes. Administra tu equipo sin complicaciones.",
      gradient: "from-teal-500 via-teal-600 to-cyan-600",
      animation: "hover:animate-pulse"
    },
    {
      icon: Brain,
      title: "Análisis del negocio con IA",
      description: "Inteligencia artificial para restaurantes que analiza margen por plato, tendencias de ventas y te da recomendaciones accionables para aumentar rentabilidad.",
      gradient: "from-orange-400 via-orange-500 to-red-500",
      animation: "hover:animate-bounce"
    },
    {
      icon: Wallet,
      title: "Control de caja inteligente",
      description: "Cierre de caja asistido por IA con conciliación automática. El sistema detecta diferencias y te guía con preguntas simples. Sin cálculos manuales.",
      gradient: "from-cyan-400 via-teal-500 to-teal-600",
      animation: "hover:animate-pulse"
    },
    {
      icon: FileText,
      title: "Documentos digitales",
      description: "Almacenamiento inteligente de documentos del negocio. Sube una vez, clasificación automática, nunca más te piden el mismo documento.",
      gradient: "from-purple-400 via-purple-500 to-purple-600",
      animation: "hover:animate-bounce"
    }
  ];

  const aiFeatures = [
    {
      icon: Brain,
      title: "ConektAI",
      description: "IA avanzada que analiza ventas de tu restaurante, predice tendencias y optimiza automáticamente tu negocio. Inteligencia artificial para restaurantes que reduce decisiones diarias y aumenta rentabilidad.",
      gradient: "from-orange-500 via-orange-600 to-red-600",
      glowColor: "orange"
    },
    {
      icon: Bot,
      title: "ContAI", 
      description: "Asistente inteligente de contabilidad que gestiona facturas, analiza food cost restaurante y genera reportes financieros automáticos. IA para restaurantes que elimina el trabajo manual.",
      gradient: "from-teal-500 via-cyan-500 to-blue-600",
      glowColor: "teal"
    }
  ];

  const handleAliciaClick = () => {
    navigate('/alicia');
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-orange-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-teal-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <Card className="w-full max-w-md bg-black/80 backdrop-blur-xl border border-orange-500/30 shadow-2xl shadow-orange-500/20 relative z-10">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <Button
                variant="ghost"
                onClick={() => setShowAuth(false)}
                className="mb-4 text-gray-300 hover:text-white transition-colors"
              >
                ← Volver
              </Button>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text text-transparent mb-2">Accede a Conektao</h2>
              <p className="text-gray-300">Inicia sesión o crea tu cuenta</p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/auth?mode=login')}
                className="w-full bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white font-semibold shadow-lg hover:shadow-orange-500/20 transition-all duration-300"
              >
                Iniciar Sesión
              </Button>
              <Button 
                onClick={() => navigate('/auth?mode=register')}
                variant="outline"
                className="w-full border-2 border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-black font-semibold transition-all duration-300 shadow-lg hover:shadow-teal-400/30"
              >
                Crear Cuenta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Enhanced flowing waves - smoother and more visible */}
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              background: `
                radial-gradient(ellipse 1200px 800px at 20% 80%, rgba(255, 165, 0, 0.3) 0%, rgba(255, 165, 0, 0.15) 40%, transparent 80%),
                radial-gradient(ellipse 800px 1000px at 80% 20%, rgba(255, 106, 0, 0.25) 0%, rgba(255, 106, 0, 0.1) 50%, transparent 85%)
              `,
              animation: 'wave1 3s ease-in-out infinite',
              filter: 'blur(60px)'
            }}
          ></div>
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              background: `
                radial-gradient(ellipse 1400px 600px at 60% 70%, rgba(20, 184, 166, 0.3) 0%, rgba(20, 184, 166, 0.15) 45%, transparent 85%),
                radial-gradient(ellipse 700px 1200px at 30% 30%, rgba(6, 182, 212, 0.25) 0%, rgba(6, 182, 212, 0.1) 50%, transparent 90%)
              `,
              animation: 'wave2 4s ease-in-out infinite reverse',
              filter: 'blur(80px)'
            }}
          ></div>
          <div 
            className="absolute inset-0 opacity-12"
            style={{
              background: `
                radial-gradient(ellipse 1600px 400px at 70% 50%, rgba(255, 165, 0, 0.3) 0%, rgba(255, 165, 0, 0.12) 55%, transparent 90%),
                radial-gradient(ellipse 600px 1400px at 25% 85%, rgba(255, 106, 0, 0.25) 0%, rgba(255, 106, 0, 0.1) 60%, transparent 95%)
              `,
              animation: 'wave3 5s ease-in-out infinite',
              filter: 'blur(100px)'
            }}
          ></div>
          <div 
            className="absolute inset-0 opacity-12"
            style={{
              background: `
                radial-gradient(ellipse 1000px 700px at 40% 25%, rgba(20, 184, 166, 0.3) 0%, rgba(20, 184, 166, 0.12) 50%, transparent 85%),
                radial-gradient(ellipse 1300px 500px at 75% 85%, rgba(6, 182, 212, 0.25) 0%, rgba(6, 182, 212, 0.1) 55%, transparent 90%)
              `,
              animation: 'wave4 3.5s ease-in-out infinite',
              filter: 'blur(90px)'
            }}
          ></div>
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              background: `
                radial-gradient(ellipse 900px 1100px at 15% 60%, rgba(255, 165, 0, 0.3) 0%, rgba(255, 165, 0, 0.1) 60%, transparent 95%),
                radial-gradient(ellipse 1500px 600px at 85% 40%, rgba(255, 106, 0, 0.25) 0%, rgba(255, 106, 0, 0.1) 65%, transparent 95%)
              `,
              animation: 'wave5 2.5s ease-in-out infinite reverse',
              filter: 'blur(110px)'
            }}
          ></div>
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              background: `
                radial-gradient(ellipse 800px 1300px at 55% 15%, rgba(20, 184, 166, 0.3) 0%, rgba(20, 184, 166, 0.1) 65%, transparent 95%),
                radial-gradient(ellipse 1700px 500px at 30% 75%, rgba(6, 182, 212, 0.25) 0%, rgba(6, 182, 212, 0.1) 70%, transparent 98%)
              `,
              animation: 'wave6 6s ease-in-out infinite',
              filter: 'blur(120px)'
            }}
          ></div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Clean Logo */}
          <div className={`mb-8 transition-all duration-1000 ${logoAnimated ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-black/80 backdrop-blur-xl rounded-full border border-orange-500/30 shadow-2xl shadow-orange-500/20">
              <span className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-teal-400 to-orange-500 bg-clip-text text-transparent">
                CONEKTAO
              </span>
            </div>
          </div>

          {/* Main Headline — SEO H1 */}
          <div className={`transition-all duration-1000 delay-500 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 px-2">
              <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent drop-shadow-2xl">
                Sistema operativo con
              </span>
              <br />
              <span 
                className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent"
                style={{
                  filter: 'brightness(1.4) saturate(1.8) drop-shadow(0 0 20px rgba(255, 106, 0, 0.6)) drop-shadow(0 0 40px rgba(255, 106, 0, 0.4)) drop-shadow(0 0 80px rgba(255, 106, 0, 0.2))'
                }}
              >
                inteligencia artificial
              </span>
              <br />
              <span className="bg-gradient-to-r from-teal-400 via-teal-500 to-cyan-400 bg-clip-text text-transparent">
                para restaurantes
              </span>
            </h1>
          </div>

          {/* Subtitle — keywords naturales */}
          <div className={`transition-all duration-1000 delay-700 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed font-semibold px-4">
              El <strong className="text-white">software para restaurantes</strong> que controla inventario, cuadra tu caja y automatiza pedidos con IA.
              <br />
              <span className="bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text text-transparent font-bold">
                Para restaurantes, cafeterías, bares y panaderías en Colombia.
              </span>
            </p>
          </div>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 transition-all duration-1000 delay-1000 px-4 ${showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <Button
              onClick={() => setShowAuth(true)}
              size="lg"
              className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105 border border-orange-500/30"
            >
              <Rocket className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
              <span className="text-sm sm:text-base lg:text-lg">Acceder a Conektao</span>
            </Button>
            <Button
              size="lg"
              className="px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transition-all duration-300 hover:scale-105 border border-teal-500/30"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
              <span className="text-sm sm:text-base lg:text-lg">Descubrir más</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section — H2 SEO */}
      <section id="features" className="relative z-10 py-12 sm:py-16 lg:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <Badge className="mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-black/60 backdrop-blur-xl text-orange-400 border border-orange-500/30 font-semibold text-xs sm:text-sm">
              Software Gastronómico Todo en Uno
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent px-2">
              El software todo en uno para administrar restaurantes
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto font-semibold px-4">
              Sistema para administrar restaurante con POS, inventario, food cost, personal y análisis con inteligencia artificial
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-12 lg:gap-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative text-center cursor-pointer transform transition-all duration-700 hover:scale-110"
              >
                {/* Floating Icon with Animation */}
                <div className="relative mb-6">
                  <div 
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br ${feature.gradient} rounded-full flex items-center justify-center shadow-2xl ${feature.animation} group-hover:shadow-[0_0_40px_rgba(255,165,0,0.6)] transition-all duration-500`}
                    style={{
                      animation: index === 0 ? "bounce 2s infinite, pulse 3s infinite" : 
                                index === 1 ? "spin 4s linear infinite" :
                                "pulse 2.5s infinite"
                    }}
                  >
                    <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 text-white relative z-10" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 bg-white rounded-full animate-ping"
                          style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${i * 0.2}s`,
                            animationDuration: `${1 + i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {index < features.length - 1 && (
                    <div className="hidden lg:block absolute top-10 -right-16 w-16 h-0.5 bg-gradient-to-r from-white/40 to-transparent">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:to-teal-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-500">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 transition-colors duration-300 max-w-xs mx-auto leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Special badges */}
                {feature.title === "Gestión de personal restaurante" && (
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:translate-y-0 translate-y-4">
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge variant="secondary" className="bg-teal-500/20 text-teal-300 border-teal-400/30 text-xs px-2 py-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        GPS
                      </Badge>
                      <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-400/30 text-xs px-2 py-1">
                        <Calculator className="w-3 h-3 mr-1" />
                        Nómina Auto
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section — H2 SEO */}
      <section className="relative z-10 py-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 bg-black/60 backdrop-blur-xl text-purple-400 border border-purple-500/30 font-semibold">
              💫 IA para Restaurantes
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              Inteligencia artificial para administrar tu restaurante
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto font-semibold">
              Dos motores de IA para restaurantes que analizan, predicen y automatizan las decisiones de tu negocio
            </p>
          </div>

          {/* AI Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {aiFeatures.map((ai, index) => (
              <div
                key={index}
                className="group relative perspective-1000"
              >
                <div 
                  className="absolute -inset-4 rounded-full opacity-20 blur-3xl animate-pulse"
                  style={{
                    background: ai.glowColor === 'orange' 
                      ? 'radial-gradient(circle, rgba(255,165,0,0.8) 0%, rgba(255,106,0,0.4) 50%, transparent 100%)'
                      : 'radial-gradient(circle, rgba(20,184,166,0.8) 0%, rgba(6,182,212,0.4) 50%, transparent 100%)',
                    animation: `aiHalo${index + 1} 4s ease-in-out infinite`
                  }}
                ></div>

                <div className="relative transform-gpu transition-all duration-1000 group-hover:scale-105 group-hover:rotate-y-12">
                  <div className="absolute inset-0 opacity-10">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className={`absolute w-1 h-1 ${ai.glowColor === 'orange' ? 'bg-orange-400' : 'bg-teal-400'} rounded-full`}
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animation: `neuralPulse ${2 + Math.random() * 3}s ease-in-out infinite`,
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </div>

                  <div 
                    className="absolute inset-0 opacity-30 rounded-3xl"
                    style={{
                      background: ai.glowColor === 'orange' 
                        ? `
                          linear-gradient(45deg, transparent 40%, rgba(255,165,0,0.3) 50%, transparent 60%),
                          linear-gradient(-45deg, transparent 40%, rgba(255,106,0,0.2) 50%, transparent 60%),
                          radial-gradient(circle at 20% 30%, rgba(255,165,0,0.4) 0%, transparent 50%),
                          radial-gradient(circle at 80% 70%, rgba(255,106,0,0.3) 0%, transparent 50%)
                        `
                        : `
                          linear-gradient(45deg, transparent 40%, rgba(20,184,166,0.3) 50%, transparent 60%),
                          linear-gradient(-45deg, transparent 40%, rgba(6,182,212,0.2) 50%, transparent 60%),
                          radial-gradient(circle at 20% 30%, rgba(20,184,166,0.4) 0%, transparent 50%),
                          radial-gradient(circle at 80% 70%, rgba(6,182,212,0.3) 0%, transparent 50%)
                        `,
                      animation: `energyFlow${index + 1} 6s linear infinite`,
                      filter: 'blur(10px)'
                    }}
                  />

                  <div className="relative p-8 text-center">
                    <div className="relative mb-8">
                      <div 
                        className={`relative w-32 h-32 mx-auto bg-gradient-to-br ${ai.gradient} rounded-full flex items-center justify-center transform-gpu transition-all duration-1000 group-hover:rotate-y-180 group-hover:scale-110`}
                        style={{
                          background: ai.glowColor === 'orange'
                            ? `
                              radial-gradient(circle at 30% 30%, rgba(255,165,0,1) 0%, rgba(255,106,0,0.8) 40%, rgba(255,69,0,0.6) 70%, rgba(255,0,0,0.4) 100%),
                              conic-gradient(from 0deg, rgba(255,165,0,0.8), rgba(255,106,0,0.6), rgba(255,69,0,0.8), rgba(255,165,0,0.8))
                            `
                            : `
                              radial-gradient(circle at 30% 30%, rgba(20,184,166,1) 0%, rgba(6,182,212,0.8) 40%, rgba(8,145,178,0.6) 70%, rgba(14,116,144,0.4) 100%),
                              conic-gradient(from 0deg, rgba(20,184,166,0.8), rgba(6,182,212,0.6), rgba(8,145,178,0.8), rgba(20,184,166,0.8))
                            `,
                          boxShadow: ai.glowColor === 'orange'
                            ? '0 0 60px rgba(255,165,0,0.8), 0 0 120px rgba(255,106,0,0.4), inset 0 0 40px rgba(255,255,255,0.2)'
                            : '0 0 60px rgba(20,184,166,0.8), 0 0 120px rgba(6,182,212,0.4), inset 0 0 40px rgba(255,255,255,0.2)',
                          animation: `brainPulse 3s ease-in-out infinite`
                        }}
                      >
                        <ai.icon 
                          className="h-16 w-16 text-white relative z-10 transform-gpu transition-all duration-1000 group-hover:scale-125" 
                          style={{
                            filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.8))',
                            animation: `iconGlow 2s ease-in-out infinite alternate`
                          }}
                        />
                        
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className={`absolute w-3 h-3 ${ai.glowColor === 'orange' ? 'bg-orange-300' : 'bg-teal-300'} rounded-full opacity-80`}
                            style={{
                              animation: `orbit${index + 1} ${4 + i * 0.5}s linear infinite`,
                              transformOrigin: '80px 80px',
                              left: '50%',
                              top: '50%',
                              transform: `rotate(${i * 60}deg) translate(80px) rotate(-${i * 60}deg)`,
                              filter: 'blur(1px)'
                            }}
                          />
                        ))}
                      </div>

                      <div 
                        className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-48 h-2 ${ai.glowColor === 'orange' ? 'bg-orange-400' : 'bg-teal-400'} rounded-full opacity-30 blur-md`}
                        style={{ animation: `baseGlow 3s ease-in-out infinite alternate` }}
                      />
                    </div>

                    <h3 
                      className="text-4xl font-bold mb-6"
                      style={{
                        background: ai.glowColor === 'orange'
                          ? 'linear-gradient(45deg, #FFA500, #FF6A00, #FFA500, #FF6A00)'
                          : 'linear-gradient(45deg, #14B8A6, #06B6D4, #14B8A6, #06B6D4)',
                        backgroundSize: '400% 400%',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        textShadow: ai.glowColor === 'orange' 
                          ? '0 0 30px rgba(255,165,0,0.8), 0 0 60px rgba(255,106,0,0.4)'
                          : '0 0 30px rgba(20,184,166,0.8), 0 0 60px rgba(6,182,212,0.4)',
                        animation: `holographicText 4s ease-in-out infinite`
                      }}
                    >
                      {ai.title}
                    </h3>

                    <p className="text-gray-300 text-lg leading-relaxed mb-8 font-medium">
                      {ai.description}
                    </p>

                    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 ${ai.glowColor === 'orange' ? 'border-orange-400 bg-orange-400/10' : 'border-teal-400 bg-teal-400/10'} backdrop-blur-xl transition-all duration-500 group-hover:scale-110`}>
                      <div 
                        className={`w-6 h-6 ${ai.glowColor === 'orange' ? 'bg-orange-400' : 'bg-teal-400'} rounded-full flex items-center justify-center animate-pulse`}
                        style={{
                          boxShadow: ai.glowColor === 'orange' 
                            ? '0 0 20px rgba(255,165,0,0.8)' 
                            : '0 0 20px rgba(20,184,166,0.8)'
                        }}
                      >
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                      <span 
                        className={`font-bold text-lg ${ai.glowColor === 'orange' ? 'text-orange-400' : 'text-teal-400'}`}
                        style={{
                          textShadow: ai.glowColor === 'orange' 
                            ? '0 0 10px rgba(255,165,0,0.8)' 
                            : '0 0 10px rgba(20,184,166,0.8)'
                        }}
                      >
                        IA para restaurantes
                      </span>
                    </div>

                    <div className="mt-8 flex justify-center space-x-8">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div 
                            className={`w-2 h-16 ${ai.glowColor === 'orange' ? 'bg-orange-400' : 'bg-teal-400'} rounded-full opacity-60`}
                            style={{
                              animation: `dataStream ${1.5 + i * 0.3}s ease-in-out infinite alternate`,
                              transformOrigin: 'bottom'
                            }}
                          />
                          <div className={`mt-2 w-1 h-1 ${ai.glowColor === 'orange' ? 'bg-orange-400' : 'bg-teal-400'} rounded-full animate-pulse`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ALICIA Banner — brief */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div
              onClick={handleAliciaClick}
              className="group relative cursor-pointer rounded-2xl border-2 border-orange-500/30 bg-black/60 backdrop-blur-xl p-8 transition-all duration-500 hover:scale-[1.02] hover:border-orange-500/60 overflow-hidden"
              style={{ boxShadow: '0 0 60px rgba(255,165,0,0.15)' }}
            >
              <div
                className="absolute opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                style={{
                  width: '300%',
                  height: '300%',
                  top: '-100%',
                  left: '-100%',
                  background: 'radial-gradient(ellipse 60% 50% at 40% 50%, rgba(255,140,0,0.3) 0%, rgba(20,184,166,0.2) 45%, transparent 75%)',
                  animation: 'wave1 4s ease-in-out infinite',
                  borderRadius: '50%',
                }}
              />
              <div className="relative flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div
                  className="w-20 h-20 shrink-0"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(20,184,166,0.5)) drop-shadow(0 0 40px rgba(255,106,0,0.3))',
                    animation: 'brainPulse 3s ease-in-out infinite'
                  }}
                >
                  <img src={aliciaAvatarImg} alt="ALICIA - Chatbot WhatsApp para restaurantes" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-1">
                    <span className="bg-gradient-to-r from-orange-400 via-teal-400 to-orange-500 bg-clip-text text-transparent">
                      Conoce a ALICIA
                    </span>
                  </h3>
                  <p className="text-gray-300 font-semibold">
                    Tu vendedora IA por WhatsApp. Atiende, vende y fideliza clientes 24/7.
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-teal-500 shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 transition-all duration-300 group-hover:scale-105">
                    Descubrir
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ALICIA Expanded Section — H2 SEO */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-2 bg-black/60 backdrop-blur-xl text-green-400 border border-green-500/30 font-semibold">
              <MessageCircle className="w-3.5 h-3.5 mr-1.5 inline" />
              Chatbot WhatsApp Restaurante
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              Alicia: la asistente de inteligencia artificial para restaurantes
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto font-semibold">
              El chatbot para restaurantes que automatiza pedidos por WhatsApp con inteligencia artificial. Tu asistente virtual restaurante que trabaja 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { icon: MessageCircle, title: "Responde clientes por WhatsApp", desc: "Chatbot WhatsApp restaurante que atiende preguntas sobre menú, horarios y precios automáticamente." },
              { icon: ShoppingCart, title: "Toma pedidos automáticamente", desc: "Automatiza pedidos WhatsApp restaurante: recibe, confirma y procesa pedidos sin intervención humana." },
              { icon: TrendingUp, title: "Recomienda productos con IA", desc: "Upselling inteligente que sugiere complementos y aumenta el ticket promedio de cada pedido." },
              { icon: Smartphone, title: "Envía pedidos directo al POS", desc: "Cada pedido de WhatsApp llega automáticamente al sistema POS restaurante para preparación inmediata." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-6 rounded-2xl border border-gray-800/50 bg-black/40 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300">
                <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-orange-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button
              onClick={handleAliciaClick}
              size="lg"
              className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105"
            >
              Conocer a ALICIA
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Marketplace Section — H2 SEO */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 bg-black/60 backdrop-blur-xl text-emerald-400 border border-emerald-500/30 font-semibold">
              Proveedores Gastronómicos
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              Marketplace de proveedores para restaurantes
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto font-semibold">
              Compra insumos restaurante, compara precios de proveedores gastronómicos y gestiona pedidos desde una sola plataforma
            </p>
          </div>

          {/* Two Column Layout: Marketplace + AI Analysis */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {/* Left: Marketplace Simulation */}
            <div className="relative">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Marketplace Conektao</h3>
                <p className="text-gray-400">IA que proyecta y solicita aprobación de compras</p>
              </div>
              
              <div className="relative mx-auto max-w-sm bg-black/90 backdrop-blur-xl rounded-[2.5rem] border-4 border-gray-800 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl"></div>
                
                <div className="px-6 py-8 pt-12 h-[600px] overflow-hidden relative">
                  <div className={`absolute inset-6 transition-all duration-700 ${marketplaceStep === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-white text-lg font-bold">Casa Italia</h3>
                        <p className="text-gray-400 text-sm">Proveedor Italiano Auténtico</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">4.9</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-xl border border-gray-700/30">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-2xl">🍝</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">Pasta Fresca</h4>
                          <p className="text-gray-400 text-xs">Tagliatelle casera - 500g</p>
                          <p className="text-emerald-400 font-bold">$24.900</p>
                        </div>
                        <div className="w-8 h-8 bg-emerald-500 rounded-full text-white text-lg flex items-center justify-center">+</div>
                      </div>
                    </div>
                  </div>

                  <div className={`absolute inset-6 transition-all duration-700 ${marketplaceStep === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
                    <div className="text-center mb-6">
                      <h3 className="text-white text-lg font-bold">Seleccionando productos...</h3>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div className="bg-emerald-500 h-2 rounded-full w-1/3 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-3 bg-emerald-900/30 rounded-xl border border-emerald-500/50 shadow-lg">
                        <span className="text-2xl">🍝</span>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">Pasta Fresca</h4>
                          <p className="text-emerald-400">Seleccionado ✓</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`absolute inset-6 transition-all duration-700 ${marketplaceStep === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}`}>
                    <h3 className="text-white text-lg font-bold mb-6">Resumen del pedido</h3>
                    <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 rounded-xl p-4 border border-gray-600/30 mb-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-300">2 productos</span>
                          <span className="text-white">$69.900</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white font-bold">Total</span>
                          <span className="text-emerald-400 font-bold text-lg">$69.900</span>
                        </div>
                      </div>
                    </div>
                    <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-3 rounded-xl">
                      Proceder al pago
                    </button>
                  </div>

                  <div className={`absolute inset-6 transition-all duration-700 ${marketplaceStep === 3 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
                    <h3 className="text-white text-lg font-bold mb-6">Microcrédito</h3>
                    <div className="p-4 bg-orange-500/20 rounded-xl border-2 border-orange-400 shadow-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-orange-400" />
                        <div className="flex-1">
                          <p className="text-white font-semibold">ConektaoPay</p>
                          <p className="text-emerald-400 text-sm font-bold">✓ Aprobado</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`absolute inset-6 transition-all duration-700 ${marketplaceStep === 4 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'}`}>
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <h3 className="text-white text-lg font-bold mb-2">Procesando...</h3>
                    </div>
                  </div>

                  <div className={`absolute inset-6 transition-all duration-700 ${marketplaceStep === 5 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-white text-lg font-bold mb-2">¡Pedido confirmado!</h3>
                      <p className="text-emerald-400 mb-4">En camino 🚚</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: AI Analysis Simulation */}
            <div className="relative">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Análisis IA de ventas</h3>
                <p className="text-gray-400">Recomendaciones inteligentes para tu restaurante</p>
              </div>
              
              <div className="relative mx-auto max-w-sm bg-black/90 backdrop-blur-xl rounded-[2.5rem] border-4 border-gray-800 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl"></div>
                
                <div className="px-6 py-8 pt-12 h-[600px] overflow-hidden relative">
                  <div className={`absolute inset-6 transition-all duration-700 ${aiAnalysisStep === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold">ConektAI</h3>
                        <p className="text-gray-400 text-xs">Analizando ventas...</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 rounded-xl p-4 border border-gray-600/30">
                        <h4 className="text-white font-semibold mb-2">📊 Ventas esta semana</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300 text-sm">Pasta Carbonara</span>
                            <span className="text-emerald-400 text-sm">+35%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300 text-sm">Risotto</span>
                            <span className="text-orange-400 text-sm">+28%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`absolute inset-6 transition-all duration-700 ${aiAnalysisStep === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-4 border-2 border-orange-400 shadow-lg mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <Zap className="w-6 h-6 text-orange-400 animate-pulse" />
                        <span className="text-white font-bold">Recomendación IA</span>
                      </div>
                      <p className="text-white text-sm mb-3">
                        Según tus ventas de pasta, te recomiendo:
                      </p>
                      <div className="bg-black/30 rounded-lg p-3">
                        <p className="text-orange-300 text-sm font-semibold">
                          🍝 Comprar más pasta fresca
                        </p>
                        <p className="text-gray-300 text-xs">
                          Stock bajo • Alta demanda
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`absolute inset-6 transition-all duration-700 ${aiAnalysisStep === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
                    <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 rounded-xl p-4 border-2 border-teal-400 shadow-lg mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <TrendingUp className="w-6 h-6 text-teal-400" />
                        <span className="text-white font-bold">Proveedor sugerido</span>
                      </div>
                      <div className="flex items-center gap-3 bg-black/30 rounded-lg p-3">
                        <span className="text-2xl">🇮🇹</span>
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm">Casa Italia</p>
                          <p className="text-teal-300 text-xs">Mejor precio • 4.9★</p>
                        </div>
                      </div>
                      <button className="w-full mt-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-2 rounded-lg text-sm">
                        Ir al marketplace
                      </button>
                    </div>
                  </div>

                  <div className={`absolute inset-6 transition-all duration-700 ${aiAnalysisStep === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-white font-bold mb-2">Pedido realizado</h3>
                      <p className="text-emerald-400 text-sm mb-4">Gracias a la recomendación IA</p>
                      
                      <div className="bg-gradient-to-r from-emerald-900/50 to-green-900/50 rounded-xl p-4 border border-emerald-500/30">
                        <p className="text-white text-sm mb-2">Stock optimizado ✓</p>
                        <p className="text-gray-300 text-xs">Ventas proyectadas: +40%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Section — H2 SEO */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
            Plataforma completa para restaurantes, cafeterías y panaderías
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-10">
            Conektao es el <strong className="text-white">sistema para cafeterías</strong>, <strong className="text-white">sistema para panaderías</strong> y <strong className="text-white">sistema para bares</strong> que unifica todas las operaciones en una sola plataforma. 
            Desde el <strong className="text-white">sistema de punto de venta para restaurantes</strong> hasta el control de inventario y food cost, 
            nuestra plataforma de <strong className="text-white">software gastronómico</strong> está diseñada para negocios de alimentos en Colombia y Latinoamérica.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { icon: UtensilsCrossed, label: "Restaurantes" },
              { icon: Coffee, label: "Cafeterías" },
              { icon: Store, label: "Panaderías" },
              { icon: Building, label: "Bares" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-5 py-3 rounded-full border border-gray-700/50 bg-black/40 backdrop-blur-sm">
                <item.icon className="w-5 h-5 text-orange-400" />
                <span className="text-white font-semibold text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section — H2 SEO */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
              Preguntas frecuentes sobre software para restaurantes
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            <AccordionItem value="q1" className="border border-gray-800/50 rounded-xl px-6 bg-black/40 backdrop-blur-sm">
              <AccordionTrigger className="text-white hover:no-underline text-left text-base font-semibold">
                ¿Qué software es mejor para restaurantes?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed">
                El mejor software para restaurantes es aquel que integra POS, inventario, food cost, gestión de personal y análisis con inteligencia artificial en una sola plataforma. Conektao ofrece todo esto además de ALICIA, un chatbot con IA que automatiza pedidos por WhatsApp, convirtiéndolo en el sistema operativo completo para restaurantes en Colombia.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q2" className="border border-gray-800/50 rounded-xl px-6 bg-black/40 backdrop-blur-sm">
              <AccordionTrigger className="text-white hover:no-underline text-left text-base font-semibold">
                ¿Qué POS usan los restaurantes en Colombia?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed">
                Los restaurantes en Colombia buscan un sistema POS restaurante que incluya facturación electrónica, gestión de mesas, control de caja y reportes de ventas. Conektao es un sistema POS para restaurantes en Colombia que además integra inteligencia artificial para optimizar operaciones, control de inventario y marketplace de proveedores.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q3" className="border border-gray-800/50 rounded-xl px-6 bg-black/40 backdrop-blur-sm">
              <AccordionTrigger className="text-white hover:no-underline text-left text-base font-semibold">
                ¿Cómo controlar inventario en un restaurante?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed">
                El control de inventario restaurante efectivo conecta ventas con recetas e ingredientes. Con Conektao, cada venta descuenta ingredientes automáticamente según las recetas configuradas. El sistema calcula el food cost en tiempo real y te alerta cuando un ingrediente está bajo. Además, puedes escanear facturas de proveedores con IA para actualizar inventario automáticamente.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q4" className="border border-gray-800/50 rounded-xl px-6 bg-black/40 backdrop-blur-sm">
              <AccordionTrigger className="text-white hover:no-underline text-left text-base font-semibold">
                ¿Cómo calcular el food cost de un restaurante?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed">
                El food cost restaurante se calcula dividiendo el costo de los ingredientes entre el precio de venta del plato. Conektao automatiza el costeo de recetas restaurante: registras los ingredientes y cantidades una vez, y el sistema calcula el food cost y margen por plato automáticamente. Cuando cambian los precios de los proveedores, el food cost se actualiza en tiempo real.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q5" className="border border-gray-800/50 rounded-xl px-6 bg-black/40 backdrop-blur-sm">
              <AccordionTrigger className="text-white hover:no-underline text-left text-base font-semibold">
                ¿Cómo automatizar pedidos por WhatsApp en un restaurante?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed">
                Con ALICIA de Conektao puedes automatizar pedidos WhatsApp restaurante. ALICIA es un chatbot con inteligencia artificial que responde clientes, toma pedidos, recomienda productos y envía los pedidos directamente al POS, todo por WhatsApp y sin intervención humana. Es el asistente virtual restaurante que trabaja 24/7 por ti.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q6" className="border border-gray-800/50 rounded-xl px-6 bg-black/40 backdrop-blur-sm">
              <AccordionTrigger className="text-white hover:no-underline text-left text-base font-semibold">
                ¿Qué es un sistema operativo para restaurantes?
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed">
                Un sistema operativo para restaurantes es una plataforma que centraliza todas las operaciones del negocio: ventas, inventario, personal, proveedores y análisis. Conektao es el sistema operativo con inteligencia artificial para restaurantes, cafeterías, bares y panaderías en Colombia y Latinoamérica. Una sola herramienta que reemplaza múltiples software desconectados.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-black/80 backdrop-blur-xl border border-orange-500/30 rounded-3xl p-8 shadow-2xl shadow-orange-500/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-teal-400 to-orange-500 bg-clip-text text-transparent">
                ¿Listo para transformar tu restaurante?
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 font-semibold">
                Déjanos tus datos y te contactaremos para una demo personalizada del software para restaurantes más completo de Colombia
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white mb-4">Solicita tu demo</h3>
                <Input
                  placeholder="Tu nombre"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="bg-black/50 border-orange-500/30 text-white placeholder:text-gray-400 focus:border-orange-400"
                />
                <Input
                  placeholder="Tu número de celular"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  className="bg-black/50 border-orange-500/30 text-white placeholder:text-gray-400 focus:border-orange-400"
                />
                <Button
                  onClick={handleContact}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white shadow-lg hover:shadow-orange-500/20 transition-all duration-300 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Contactarme
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <div className="flex flex-col justify-center">
                <h3 className="text-xl font-semibold text-white mb-4">¿Ya tienes cuenta?</h3>
                <Button
                  onClick={() => setShowAuth(true)}
                  variant="outline"
                  className="border-2 border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-black font-semibold transition-all duration-300 shadow-lg hover:shadow-teal-400/30"
                >
                  Acceder a mi cuenta
                  <Shield className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-orange-500/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-orange-400 animate-pulse" />
            <span className="text-xl font-bold bg-gradient-to-r from-orange-400 via-teal-400 to-orange-500 bg-clip-text text-transparent">
              CONEKTAO
            </span>
            <Sparkles className="h-5 w-5 text-teal-400 animate-pulse" />
          </div>
          <p className="text-gray-400">© 2025 Conektao. Software para restaurantes en Colombia y Latinoamérica.</p>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes wave1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, -20px) scale(1.05); } }
        @keyframes wave2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-25px, 15px) scale(1.03); } }
        @keyframes wave3 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(20px, 25px) scale(1.04); } }
        @keyframes wave4 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-15px, -20px) scale(1.02); } }
        @keyframes wave5 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(25px, 10px) scale(1.03); } }
        @keyframes wave6 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-20px, 20px) scale(1.04); } }
        @keyframes brainPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes neuralPulse { 0%, 100% { opacity: 0.1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(2); } }
        @keyframes holographicText { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes iconGlow { 0% { filter: drop-shadow(0 0 10px rgba(255,255,255,0.5)); } 100% { filter: drop-shadow(0 0 30px rgba(255,255,255,1)); } }
        @keyframes baseGlow { 0% { opacity: 0.2; width: 60%; } 100% { opacity: 0.5; width: 80%; } }
        @keyframes dataStream { 0% { transform: scaleY(0.3); opacity: 0.3; } 100% { transform: scaleY(1); opacity: 0.8; } }
        @keyframes orbit1 { from { transform: rotate(0deg) translateX(80px) rotate(0deg); } to { transform: rotate(360deg) translateX(80px) rotate(-360deg); } }
        @keyframes orbit2 { from { transform: rotate(0deg) translateX(80px) rotate(0deg); } to { transform: rotate(-360deg) translateX(80px) rotate(360deg); } }
        @keyframes aiHalo1 { 0%, 100% { transform: scale(1); opacity: 0.15; } 50% { transform: scale(1.1); opacity: 0.25; } }
        @keyframes aiHalo2 { 0%, 100% { transform: scale(1); opacity: 0.15; } 50% { transform: scale(1.15); opacity: 0.3; } }
        @keyframes energyFlow1 { 0% { background-position: 0% 0%; } 100% { background-position: 200% 200%; } }
        @keyframes energyFlow2 { 0% { background-position: 200% 200%; } 100% { background-position: 0% 0%; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      `}</style>
    </div>
  );
};

export default Welcome;
