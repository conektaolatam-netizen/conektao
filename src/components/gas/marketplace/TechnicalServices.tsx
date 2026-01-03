import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  PenTool, 
  Hammer, 
  Settings, 
  Shield, 
  Gauge,
  FileCheck,
  MapPin,
  Calendar,
  Phone,
  CheckCircle,
  ChevronRight,
  Building,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CartItem {
  id: string;
  name: string;
  type: 'product' | 'service' | 'quote';
  price: number;
  quantity: number;
  details?: any;
}

interface Props {
  onAddToCart: (item: CartItem) => void;
  onBack: () => void;
}

const TechnicalServices = ({ onAddToCart, onBack }: Props) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    propertyType: '',
    address: '',
    contactPhone: '',
    preferredDate: '',
    notes: ''
  });

  const services = [
    {
      id: 'design',
      icon: PenTool,
      title: 'Diseño de Redes GLP',
      description: 'Diseño técnico y planos para instalaciones de gas propano.',
      includes: ['Planos técnicos', 'Cálculo de demanda', 'Memoria de cálculo', 'Presentación ante ente regulador'],
      duration: '3-5 días hábiles',
      color: 'cyan'
    },
    {
      id: 'construction',
      icon: Hammer,
      title: 'Construcción de Redes',
      description: 'Instalación completa de redes de gas para edificaciones nuevas.',
      includes: ['Materiales certificados', 'Mano de obra calificada', 'Pruebas de hermeticidad', 'Certificación final'],
      duration: 'Según proyecto',
      color: 'orange'
    },
    {
      id: 'modification',
      icon: Settings,
      title: 'Modificación de Redes',
      description: 'Ampliaciones, reconexiones y modificaciones a redes existentes.',
      includes: ['Evaluación previa', 'Nuevos trazados', 'Actualización de planos', 'Recertificación'],
      duration: '1-3 días hábiles',
      color: 'blue'
    },
    {
      id: 'maintenance',
      icon: Gauge,
      title: 'Mantenimiento Preventivo',
      description: 'Revisión periódica para garantizar la seguridad de tu instalación.',
      includes: ['Revisión de fugas', 'Limpieza de quemadores', 'Verificación de reguladores', 'Informe de estado'],
      duration: '2-4 horas',
      color: 'green'
    },
    {
      id: 'certification',
      icon: FileCheck,
      title: 'Certificaciones',
      description: 'Certificación o recertificación de redes de GLP ante entes reguladores.',
      includes: ['Inspección técnica', 'Pruebas normativas', 'Documentación legal', 'Presentación ante SIC'],
      duration: '5-10 días hábiles',
      color: 'purple'
    },
    {
      id: 'highpressure',
      icon: Shield,
      title: 'Redes Media/Alta Presión',
      description: 'Instalaciones especializadas para uso industrial de alta demanda.',
      includes: ['Ingeniería especializada', 'Materiales alta presión', 'Monitoreo de presión', 'Mantenimiento incluido'],
      duration: 'Según proyecto',
      color: 'red'
    }
  ];

  const propertyTypes = [
    { id: 'residential', label: 'Residencial', icon: Home },
    { id: 'commercial', label: 'Comercial', icon: Building },
    { id: 'industrial', label: 'Industrial', icon: Settings }
  ];

  const handleSubmitRequest = (service: typeof services[0]) => {
    if (!formData.propertyType || !formData.address) {
      return;
    }

    onAddToCart({
      id: `service-${service.id}-${Date.now()}`,
      name: service.title,
      type: 'quote',
      price: 0,
      quantity: 1,
      details: {
        serviceId: service.id,
        ...formData
      }
    });

    setSelectedService(null);
    setFormData({
      propertyType: '',
      address: '',
      contactPhone: '',
      preferredDate: '',
      notes: ''
    });
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      cyan: { bg: 'from-cyan-500/20 to-cyan-600/20', text: 'text-cyan-400', border: 'border-cyan-500/20' },
      orange: { bg: 'from-orange-500/20 to-orange-600/20', text: 'text-orange-400', border: 'border-orange-500/20' },
      blue: { bg: 'from-blue-500/20 to-blue-600/20', text: 'text-blue-400', border: 'border-blue-500/20' },
      green: { bg: 'from-green-500/20 to-green-600/20', text: 'text-green-400', border: 'border-green-500/20' },
      purple: { bg: 'from-purple-500/20 to-purple-600/20', text: 'text-purple-400', border: 'border-purple-500/20' },
      red: { bg: 'from-red-500/20 to-red-600/20', text: 'text-red-400', border: 'border-red-500/20' }
    };
    return colors[color] || colors.cyan;
  };

  const renderServiceForm = (service: typeof services[0]) => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="px-5 pb-5 space-y-4"
    >
      <div className="h-px bg-white/10" />
      
      <h4 className="font-medium text-white/80">Agendar visita técnica</h4>
      
      <div className="space-y-3">
        {/* Property Type */}
        <div>
          <label className="text-white/60 text-sm mb-2 block">Tipo de inmueble *</label>
          <div className="grid grid-cols-3 gap-2">
            {propertyTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setFormData(prev => ({ ...prev, propertyType: type.id }))}
                className={`p-3 rounded-xl border text-center transition-all ${
                  formData.propertyType === type.id
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                    : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                <type.icon className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-white/60 text-sm mb-1.5 block">Dirección *</label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Dirección completa del inmueble"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        <div>
          <label className="text-white/60 text-sm mb-1.5 block">Teléfono de contacto</label>
          <Input
            value={formData.contactPhone}
            onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
            placeholder="300 123 4567"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        <div>
          <label className="text-white/60 text-sm mb-1.5 block">Fecha preferida</label>
          <Input
            type="date"
            value={formData.preferredDate}
            onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div>
          <label className="text-white/60 text-sm mb-1.5 block">Observaciones</label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Describe tu necesidad o problema actual..."
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => setSelectedService(null)}
          className="flex-1 border-white/20 text-white/80 hover:bg-white/10"
        >
          Cancelar
        </Button>
        <Button
          onClick={() => handleSubmitRequest(service)}
          disabled={!formData.propertyType || !formData.address}
          className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Agendar visita
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-lg border-b border-white/10">
        <div className="px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Servicio Técnico</h1>
            <p className="text-white/60 text-sm">Instalaciones y certificaciones</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-6 py-4">
        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-orange-400 mt-0.5" />
            <div>
              <p className="text-white/90 font-medium text-sm">Personal certificado</p>
              <p className="text-white/60 text-xs mt-1">
                Todos nuestros técnicos están certificados por la SIC y cuentan con 
                experiencia comprobada en instalaciones de GLP.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="px-6 space-y-4">
        {services.map((service, index) => {
          const colorClasses = getColorClasses(service.color);
          
          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
            >
              {/* Service Header */}
              <button
                onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
                className="w-full p-5 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses.bg} 
                                  flex items-center justify-center ${colorClasses.border} border`}>
                    <service.icon className={`w-6 h-6 ${colorClasses.text}`} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{service.title}</h3>
                    <p className="text-white/60 text-sm mt-1">{service.description}</p>
                    
                    {/* Includes */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {service.includes.slice(0, 2).map(item => (
                        <Badge 
                          key={item}
                          variant="outline" 
                          className="border-white/10 text-white/50 text-xs bg-white/5"
                        >
                          <CheckCircle className="w-2.5 h-2.5 mr-1" />
                          {item}
                        </Badge>
                      ))}
                      {service.includes.length > 2 && (
                        <Badge 
                          variant="outline" 
                          className="border-white/10 text-white/40 text-xs bg-white/5"
                        >
                          +{service.includes.length - 2} más
                        </Badge>
                      )}
                    </div>

                    {/* Duration */}
                    <p className="text-white/40 text-xs mt-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Tiempo estimado: {service.duration}
                    </p>
                  </div>

                  <ChevronRight 
                    className={`w-5 h-5 text-white/40 transition-transform ${
                      selectedService === service.id ? 'rotate-90' : ''
                    }`} 
                  />
                </div>
              </button>

              {/* Service Form */}
              {selectedService === service.id && renderServiceForm(service)}
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Info */}
      <div className="px-6 mt-6 space-y-4">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="font-medium text-white/80 mb-2 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-green-400" />
            Garantía de servicio
          </h4>
          <p className="text-white/50 text-sm">
            Todas nuestras instalaciones incluyen garantía de 1 año en mano de obra 
            y materiales. Certificación válida ante entes reguladores.
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="font-medium text-white/80 mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-orange-400" />
            Emergencias 24/7
          </h4>
          <p className="text-white/50 text-sm mb-3">
            ¿Tienes una emergencia con tu instalación de gas? Contáctanos inmediatamente.
          </p>
          <Button
            variant="outline"
            className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Phone className="w-4 h-4 mr-2" />
            Línea de emergencias
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TechnicalServices;
