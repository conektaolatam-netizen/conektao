import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  BookOpen, 
  TrendingUp, 
  Package, 
  FileText, 
  Calculator, 
  Users, 
  Bot,
  CreditCard,
  PiggyBank,
  ShoppingCart,
  DollarSign,
  HelpCircle
} from 'lucide-react';

interface TutorialGuideProps {
  onClose: () => void;
  onGoToModule: (module: string) => void;
}

const tutorialSteps = [
  {
    id: 1,
    title: "🎉 ¡Bienvenido a tu Sistema de Gestión!",
    description: "Te voy a mostrar paso a paso cómo usar tu nuevo sistema",
    icon: BookOpen,
    color: "bg-blue-500",
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">¡Hola! Soy tu guía personal</h3>
          <p className="text-gray-600">
            Te ayudaré a conocer todas las funciones de tu sistema de gestión para restaurantes
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">💡 Este tutorial te mostrará:</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Cómo ver el resumen de tu negocio</li>
            <li>• Dónde agregar productos</li>
            <li>• Cómo hacer ventas</li>
            <li>• Cómo revisar tus ganancias</li>
          </ul>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            ⏱️ Solo toma 3 minutos - Te ayudará mucho
          </p>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "📊 Panel Principal - Tu Resumen Diario",
    description: "Aquí ves las ventas del día y acciones rápidas",
    icon: TrendingUp,
    color: "bg-green-500",
    module: "dashboard",
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <span className="font-semibold text-green-800">Ventas de Hoy</span>
            </div>
            <p className="text-sm text-green-700">
              Ve cuánto has vendido hoy y este mes
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-semibold text-blue-800">Acciones Rápidas</span>
            </div>
            <p className="text-sm text-blue-700">
              Botones para hacer tareas comunes rápidamente
            </p>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">🔍 ¿Qué puedes hacer aquí?</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Ver cuánto dinero has ganado hoy</li>
            <li>• Revisar las mesas ocupadas</li>
            <li>• Acceder rápidamente a ventas</li>
            <li>• Ver los productos más vendidos</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "📦 Inventario - Tus Productos",
    description: "Agrega, edita y organiza todos tus productos",
    icon: Package,
    color: "bg-purple-500",
    module: "inventory",
    content: (
      <div className="space-y-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800 mb-2">🍽️ Gestión de Productos</h4>
          <p className="text-purple-700 text-sm">
            Aquí agregas nuevos platos, cambias precios y controlas el stock
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h5 className="font-semibold">✅ Puedes hacer:</h5>
            <ul className="text-sm space-y-1">
              <li>• Agregar nuevos productos</li>
              <li>• Cambiar precios</li>
              <li>• Organizar por categorías</li>
              <li>• Controlar stock disponible</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h5 className="font-semibold">💡 Ejemplo:</h5>
            <div className="bg-gray-50 border rounded p-3">
              <p className="text-sm">
                <strong>Hamburguesa Clásica</strong><br/>
                Categoría: Comidas<br/>
                Precio: $18.000<br/>
                Stock: 25 disponibles
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: "🧾 Facturación - Hacer Ventas",
    description: "Sistema para atender mesas y generar facturas",
    icon: FileText,
    color: "bg-orange-500",
    module: "invoices",
    content: (
      <div className="space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-semibold text-orange-800 mb-2">💳 Sistema de Ventas</h4>
          <p className="text-orange-700 text-sm">
            Procesa pedidos, genera facturas y controla las mesas
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">1️⃣</span>
            </div>
            <h5 className="font-semibold text-sm">Seleccionar Mesa</h5>
            <p className="text-xs text-gray-600">Escoge la mesa del cliente</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">2️⃣</span>
            </div>
            <h5 className="font-semibold text-sm">Agregar Productos</h5>
            <p className="text-xs text-gray-600">Selecciona los platos</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-lg">3️⃣</span>
            </div>
            <h5 className="font-semibold text-sm">Generar Factura</h5>
            <p className="text-xs text-gray-600">Imprimir y cobrar</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 5,
    title: "💰 Gestión de Caja",
    description: "Controla el dinero que entra y sale",
    icon: PiggyBank,
    color: "bg-green-600",
    module: "cash",
    content: (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">🏦 Control de Dinero</h4>
          <p className="text-green-700 text-sm">
            Registra ingresos, gastos y cierre de caja diario
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h5 className="font-semibold text-blue-800 mb-1">💵 Ingresos</h5>
            <p className="text-sm text-blue-700">
              Todas las ventas del día se registran automáticamente
            </p>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h5 className="font-semibold text-red-800 mb-1">💸 Gastos</h5>
            <p className="text-sm text-red-700">
              Registra compras, servicios y otros gastos
            </p>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">📝 Tip importante:</h4>
          <p className="text-yellow-700 text-sm">
            Siempre cierra la caja al final del día para llevar un control preciso
          </p>
        </div>
      </div>
    )
  },
  {
    id: 6,
    title: "🎯 ¡Listo para empezar!",
    description: "Ya conoces lo básico, ahora puedes usar el sistema",
    icon: Check,
    color: "bg-green-500",
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">¡Perfecto! Ya estás listo</h3>
          <p className="text-gray-600">
            Ahora puedes usar tu sistema con confianza
          </p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">🚀 Próximos pasos recomendados:</h4>
          <ul className="text-green-700 text-sm space-y-1">
            <li>• Revisa tus productos en <strong>Inventario</strong></li>
            <li>• Haz una venta de prueba en <strong>Facturación</strong></li>
            <li>• Registra gastos en <strong>Gestión de Caja</strong></li>
            <li>• Revisa el resumen en <strong>Panel Principal</strong></li>
          </ul>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">❓ ¿Necesitas ayuda?</h4>
          <p className="text-blue-700 text-sm">
            Siempre puedes hacer clic en el botón "?" que está en la esquina superior derecha para volver a ver esta guía
          </p>
        </div>
      </div>
    )
  }
];

const TutorialGuide: React.FC<TutorialGuideProps> = ({ onClose, onGoToModule }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  const currentStepData = tutorialSteps.find(step => step.id === currentStep);
  const progress = (currentStep / tutorialSteps.length) * 100;
  
  const nextStep = () => {
    if (currentStep < tutorialSteps.length) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const goToModule = () => {
    if (currentStepData?.module) {
      onGoToModule(currentStepData.module);
    }
  };
  
  const finishTutorial = () => {
    localStorage.setItem('tutorialCompleted', 'true');
    onClose();
  };
  
  if (!currentStepData) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="text-center">
            <div className={`mx-auto w-16 h-16 ${currentStepData.color} rounded-full flex items-center justify-center mb-4`}>
              <currentStepData.icon className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl mb-2">{currentStepData.title}</CardTitle>
            <p className="text-gray-600">{currentStepData.description}</p>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progreso del tutorial</span>
              <span>Paso {currentStep} de {tutorialSteps.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            {currentStepData.content}
          </div>
          
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button 
                variant="outline" 
                onClick={prevStep}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
            )}
            
            {currentStepData.module && (
              <Button 
                variant="outline" 
                onClick={goToModule}
                className="flex-1"
              >
                🔍 Ver esta sección
              </Button>
            )}
            
            {currentStep < tutorialSteps.length ? (
              <Button 
                onClick={nextStep}
                className="flex-1"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={finishTutorial}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-2 h-4 w-4" />
                ¡Empezar a usar!
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorialGuide;