import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Building2, 
  Factory, 
  Truck, 
  Timer, 
  FileText,
  MapPin,
  Phone,
  CheckCircle,
  ChevronRight
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

const StorageSolutions = ({ onAddToCart, onBack }: Props) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    businessType: '',
    estimatedConsumption: '',
    location: '',
    contactPhone: '',
    notes: ''
  });

  const services = [
    {
      id: 'cisterna',
      icon: Truck,
      title: 'Suministro por Cisterna',
      description: 'Entrega de GLP a granel directamente a tu tanque estacionario.',
      features: ['Mínimo 500 galones', 'Precio por galón', 'Programable'],
      forBusiness: ['Industrias', 'Hoteles', 'Hospitales']
    },
    {
      id: 'tuberia',
      icon: Factory,
      title: 'Suministro por Tubería',
      description: 'Conexión directa a red de distribución de GLP.',
      features: ['Sin cambio de cilindros', 'Medidor digital', 'Facturación mensual'],
      forBusiness: ['Conjuntos residenciales', 'Edificios', 'Zonas industriales']
    },
    {
      id: 'tanque-120',
      icon: Building2,
      title: 'Tanque Estacionario 120 gal',
      description: 'Tanque de almacenamiento para negocios pequeños.',
      features: ['Capacidad 120 galones', 'Instalación incluida', 'Certificación'],
      forBusiness: ['Restaurantes', 'Panaderías', 'Talleres']
    },
    {
      id: 'tanque-500',
      icon: Building2,
      title: 'Tanque Estacionario 500 gal',
      description: 'Solución para consumo industrial medio.',
      features: ['Capacidad 500 galones', 'Llenado programado', 'Monitoreo'],
      forBusiness: ['Fábricas', 'Bodegas', 'Plantas']
    },
    {
      id: 'tanque-1000',
      icon: Building2,
      title: 'Tanque Estacionario 1000 gal',
      description: 'Máxima capacidad para grandes operaciones.',
      features: ['Capacidad 1000 galones', 'Sistema de telemetría', 'Contrato preferencial'],
      forBusiness: ['Industria pesada', 'Complejos industriales']
    }
  ];

  const businessTypes = [
    'Restaurante / Cocina industrial',
    'Hotel / Hospedaje',
    'Hospital / Clínica',
    'Fábrica / Manufactura',
    'Conjunto residencial',
    'Centro comercial',
    'Otro'
  ];

  const consumptionLevels = [
    'Menos de 100 galones/mes',
    '100 - 500 galones/mes',
    '500 - 1000 galones/mes',
    'Más de 1000 galones/mes',
    'No estoy seguro'
  ];

  const handleSubmitQuote = (service: typeof services[0]) => {
    if (!formData.businessType || !formData.location) {
      return;
    }

    onAddToCart({
      id: `quote-${service.id}-${Date.now()}`,
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
      businessType: '',
      estimatedConsumption: '',
      location: '',
      contactPhone: '',
      notes: ''
    });
  };

  const renderQuoteForm = (service: typeof services[0]) => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="px-5 pb-5 space-y-4"
    >
      <div className="h-px bg-white/10" />
      
      <h4 className="font-medium text-white/80">Datos para cotización</h4>
      
      <div className="space-y-3">
        <div>
          <label className="text-white/60 text-sm mb-1.5 block">Tipo de negocio *</label>
          <Select 
            value={formData.businessType} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}
          >
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecciona tu tipo de negocio" />
            </SelectTrigger>
            <SelectContent>
              {businessTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-white/60 text-sm mb-1.5 block">Consumo estimado</label>
          <Select 
            value={formData.estimatedConsumption} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, estimatedConsumption: value }))}
          >
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="¿Cuánto consumes mensualmente?" />
            </SelectTrigger>
            <SelectContent>
              {consumptionLevels.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-white/60 text-sm mb-1.5 block">Ubicación *</label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="Ciudad, dirección o zona"
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
          <label className="text-white/60 text-sm mb-1.5 block">Observaciones</label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Detalles adicionales sobre tu necesidad..."
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
          onClick={() => handleSubmitQuote(service)}
          disabled={!formData.businessType || !formData.location}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
        >
          <FileText className="w-4 h-4 mr-2" />
          Solicitar cotización
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
            <h1 className="text-lg font-semibold">Soluciones de Almacenamiento</h1>
            <p className="text-white/60 text-sm">B2B e Industrial</p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-6 py-4">
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Timer className="w-5 h-5 text-cyan-400 mt-0.5" />
            <div>
              <p className="text-white/90 font-medium text-sm">Respuesta en 24 horas</p>
              <p className="text-white/60 text-xs mt-1">
                Un asesor comercial te contactará para brindarte una cotización personalizada.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="px-6 space-y-4">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
          >
            {/* Service Header */}
            <button
              onClick={() => setSelectedService(selectedService === service.id ? null : service.id)}
              className="w-full p-5 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 
                                flex items-center justify-center border border-cyan-500/20">
                  <service.icon className="w-6 h-6 text-cyan-400" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{service.title}</h3>
                  <p className="text-white/60 text-sm mt-1">{service.description}</p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {service.features.map(feature => (
                      <Badge 
                        key={feature}
                        variant="outline" 
                        className="border-white/10 text-white/60 text-xs bg-white/5"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {feature}
                      </Badge>
                    ))}
                  </div>

                  {/* For Business Types */}
                  <p className="text-white/40 text-xs mt-3">
                    Ideal para: {service.forBusiness.join(' • ')}
                  </p>
                </div>

                <ChevronRight 
                  className={`w-5 h-5 text-white/40 transition-transform ${
                    selectedService === service.id ? 'rotate-90' : ''
                  }`} 
                />
              </div>
            </button>

            {/* Quote Form */}
            {selectedService === service.id && renderQuoteForm(service)}
          </motion.div>
        ))}
      </div>

      {/* Bottom Info */}
      <div className="px-6 mt-6">
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h4 className="font-medium text-white/80 mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4 text-cyan-400" />
            ¿Necesitas asesoría inmediata?
          </h4>
          <p className="text-white/50 text-sm mb-3">
            Nuestro equipo comercial puede atenderte directamente para proyectos urgentes 
            o de gran escala.
          </p>
          <Button
            variant="outline"
            className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
          >
            <Phone className="w-4 h-4 mr-2" />
            Llamar a un asesor
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StorageSolutions;
