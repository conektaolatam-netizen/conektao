import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Store, 
  Coffee, 
  Pizza, 
  Utensils, 
  IceCream,
  ChefHat,
  Wine,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  Download,
  Sparkles,
  Users,
  TrendingUp,
  Calculator,
  FileText,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OnboardingProps {
  onComplete: (userData: any) => void;
}

const businessTemplates = [
  {
    id: 'pizzeria',
    name: 'Pizzería',
    icon: Pizza,
    description: 'Especializado en pizzas y comida italiana',
    categories: ['Pizzas Personal', 'Pizzas Mediana', 'Pizzas Familiar', 'Bebidas', 'Adiciones', 'Postres'],
    sampleProducts: [
      { name: 'Pizza Margherita Personal', category: 'Pizzas Personal', price: 25000 },
      { name: 'Pizza Pepperoni Mediana', category: 'Pizzas Mediana', price: 35000 },
      { name: 'Coca Cola 350ml', category: 'Bebidas', price: 4000 },
      { name: 'Queso Extra', category: 'Adiciones', price: 3000 }
    ],
    avgMonthlyRevenue: 80000000
  },
  {
    id: 'restaurant',
    name: 'Restaurante',
    icon: Utensils,
    description: 'Restaurante de comida completa',
    categories: ['Entradas', 'Platos Principales', 'Bebidas', 'Postres', 'Sopas'],
    sampleProducts: [
      { name: 'Sopa del día', category: 'Sopas', price: 12000 },
      { name: 'Pollo a la plancha', category: 'Platos Principales', price: 28000 },
      { name: 'Jugo Natural', category: 'Bebidas', price: 8000 },
      { name: 'Flan', category: 'Postres', price: 7000 }
    ],
    avgMonthlyRevenue: 120000000
  },
  {
    id: 'cafeteria',
    name: 'Cafetería',
    icon: Coffee,
    description: 'Café, bebidas calientes y snacks',
    categories: ['Cafés', 'Bebidas Frías', 'Pasteles', 'Snacks', 'Desayunos'],
    sampleProducts: [
      { name: 'Café Americano', category: 'Cafés', price: 5000 },
      { name: 'Cappuccino', category: 'Cafés', price: 7000 },
      { name: 'Croissant', category: 'Desayunos', price: 6000 },
      { name: 'Cheesecake', category: 'Pasteles', price: 9000 }
    ],
    avgMonthlyRevenue: 45000000
  },
  {
    id: 'heladeria',
    name: 'Heladería',
    icon: IceCream,
    description: 'Helados, postres fríos y malteadas',
    categories: ['Helados', 'Malteadas', 'Sundaes', 'Bebidas', 'Postres'],
    sampleProducts: [
      { name: 'Helado 1 Bola', category: 'Helados', price: 4000 },
      { name: 'Malteada Chocolate', category: 'Malteadas', price: 12000 },
      { name: 'Sundae Especial', category: 'Sundaes', price: 15000 },
      { name: 'Agua Embotellada', category: 'Bebidas', price: 3000 }
    ],
    avgMonthlyRevenue: 30000000
  },
  {
    id: 'panaderia',
    name: 'Panadería',
    icon: ChefHat,
    description: 'Pan, productos horneados y repostería',
    categories: ['Pan', 'Pasteles', 'Galletas', 'Bebidas', 'Desayunos'],
    sampleProducts: [
      { name: 'Pan Integral', category: 'Pan', price: 3500 },
      { name: 'Torta Chocolate', category: 'Pasteles', price: 45000 },
      { name: 'Galletas Avena', category: 'Galletas', price: 8000 },
      { name: 'Café con Leche', category: 'Bebidas', price: 4500 }
    ],
    avgMonthlyRevenue: 25000000
  },
  {
    id: 'bar',
    name: 'Bar/Pub',
    icon: Wine,
    description: 'Bebidas alcohólicas y aperitivos',
    categories: ['Cervezas', 'Cócteles', 'Whisky', 'Aperitivos', 'Licores'],
    sampleProducts: [
      { name: 'Cerveza Nacional', category: 'Cervezas', price: 6000 },
      { name: 'Mojito', category: 'Cócteles', price: 18000 },
      { name: 'Alitas BBQ', category: 'Aperitivos', price: 22000 },
      { name: 'Whisky Doble', category: 'Whisky', price: 25000 }
    ],
    avgMonthlyRevenue: 90000000
  }
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Paso 1: Información de la empresa
    companyName: '',
    nit: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    
    // Paso 2: Tipo de negocio
    businessType: '',
    selectedTemplate: null as any,
    
    // Paso 3: Configuración inicial
    setupMethod: 'template', // 'template', 'import', 'manual'
    importFile: null as File | null,
    
    // Paso 4: Personalización
    customCategories: [] as string[],
    customProducts: [] as any[],
    
    // Paso 5: Configuración fiscal
    taxRegime: '',
    retentionAgent: false,
    
    // Final
    useDemo: false
  });

  const { toast } = useToast();
  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompanyInfoSubmit = () => {
    if (!formData.companyName || !formData.nit || !formData.email) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }
    nextStep();
  };

  const selectBusinessTemplate = (template: any) => {
    setFormData({ ...formData, selectedTemplate: template, businessType: template.id });
    nextStep();
  };

  const handleSetupMethodSelect = (method: string) => {
    setFormData({ ...formData, setupMethod: method });
    nextStep();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData({ ...formData, importFile: file });
      toast({
        title: "Archivo cargado",
        description: `${file.name} se cargó correctamente`
      });
    }
  };

  const downloadTemplate = () => {
    // Crear CSV de ejemplo
    const csvContent = [
      'Código,Nombre,Categoría,Precio,Stock,Descripción',
      '001,Producto Ejemplo 1,Categoría 1,15000,50,Descripción del producto',
      '002,Producto Ejemplo 2,Categoría 2,25000,30,Descripción del producto'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'plantilla_productos.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Plantilla descargada",
      description: "Completa la plantilla con tus productos y vuelve a subirla"
    });
  };

  const completeOnboarding = () => {
    const userData = {
      ...formData,
      setupDate: new Date().toISOString(),
      onboardingCompleted: true
    };
    
    toast({
      title: "¡Configuración completada!",
      description: "Tu restaurante está listo para funcionar"
    });
    
    onComplete(userData);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center px-4 sm:px-6">
              <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <Building2 className="h-8 sm:h-10 w-8 sm:w-10 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">Paso 1: Datos de tu Negocio</CardTitle>
              <CardDescription className="text-sm sm:text-base lg:text-lg">
                📝 Completa los campos marcados con * (son obligatorios)
              </CardDescription>
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs sm:text-sm text-blue-800">
                  💡 <strong>Instrucciones:</strong> Llena cada campo con la información de tu restaurante. Los campos con * son obligatorios para continuar.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="companyName" className="text-sm sm:text-base lg:text-lg font-medium">
                    🏪 Nombre de tu restaurante *
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Escribe aquí el nombre de tu restaurante"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                  <p className="text-xs sm:text-sm text-gray-600">Ejemplo: "Restaurante Don Pedro"</p>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="nit" className="text-sm sm:text-base lg:text-lg font-medium">
                    📄 NIT de tu negocio *
                  </Label>
                  <Input
                    id="nit"
                    placeholder="Escribe el NIT sin puntos ni guiones"
                    value={formData.nit}
                    onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                  <p className="text-xs sm:text-sm text-gray-600">Ejemplo: "9001234561"</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="email" className="text-sm sm:text-base lg:text-lg font-medium">
                    📧 Email del restaurante *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Escribe el email de contacto"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                  <p className="text-xs sm:text-sm text-gray-600">Ejemplo: "contacto@mirestaurante.com"</p>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <Label htmlFor="phone" className="text-sm sm:text-base lg:text-lg font-medium">
                    📞 Teléfono (opcional)
                  </Label>
                  <Input
                    id="phone"
                    placeholder="Escribe el teléfono del restaurante"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-10 sm:h-12 text-sm sm:text-base"
                  />
                  <p className="text-xs sm:text-sm text-gray-600">Ejemplo: "300 123 4567"</p>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="address" className="text-sm sm:text-base lg:text-lg font-medium">
                  📍 Dirección del restaurante (opcional)
                </Label>
                <Input
                  id="address"
                  placeholder="Escribe la dirección completa"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="h-10 sm:h-12 text-sm sm:text-base"
                />
                <p className="text-xs sm:text-sm text-gray-600">Ejemplo: "Calle 123 #45-67, Bogotá"</p>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="city" className="text-sm sm:text-base lg:text-lg font-medium">
                  🏙️ Ciudad donde está ubicado (opcional)
                </Label>
                <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                  <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base">
                    <SelectValue placeholder="Haz clic aquí para seleccionar tu ciudad" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    <SelectItem value="bogota">Bogotá</SelectItem>
                    <SelectItem value="medellin">Medellín</SelectItem>
                    <SelectItem value="cali">Cali</SelectItem>
                    <SelectItem value="barranquilla">Barranquilla</SelectItem>
                    <SelectItem value="cartagena">Cartagena</SelectItem>
                    <SelectItem value="bucaramanga">Bucaramanga</SelectItem>
                    <SelectItem value="manizales">Manizales</SelectItem>
                    <SelectItem value="pereira">Pereira</SelectItem>
                    <SelectItem value="otra">Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs sm:text-sm text-green-800 text-center mb-3 sm:mb-4">
                  ✅ Revisa que todos los campos obligatorios (*) estén completos antes de continuar
                </p>
                <Button onClick={handleCompanyInfoSubmit} className="w-full h-11 sm:h-14 text-sm sm:text-base lg:text-lg" size="lg">
                  ➡️ Continuar al Paso 2 <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-secondary to-secondary/60 rounded-full flex items-center justify-center mb-6">
                <Store className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold mb-4">Paso 2: Tipo de Negocio</CardTitle>
              <CardDescription className="text-lg">
                🍽️ Haz clic en el tipo de negocio que tienes
              </CardDescription>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 <strong>Instrucciones:</strong> Selecciona la opción que mejor describe tu negocio. Cada opción incluye productos y categorías típicas.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {businessTemplates.map((template) => {
                  const IconComponent = template.icon;
                  return (
                    <Card 
                      key={template.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary"
                      onClick={() => selectBusinessTemplate(template)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">
                              ${(template.avgMonthlyRevenue / 1000000).toFixed(0)}M/mes promedio
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {template.categories.slice(0, 3).map((cat, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                            {template.categories.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.categories.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="max-w-3xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-accent to-accent/60 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">¿Cómo quieres configurar tu inventario?</CardTitle>
              <CardDescription>
                Elige la opción que mejor se adapte a tus necesidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary"
                  onClick={() => handleSetupMethodSelect('template')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Sparkles className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Usar Template</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Comenzar con productos predefinidos para {formData.selectedTemplate?.name}
                    </p>
                    <Badge className="bg-green-100 text-green-800">Recomendado</Badge>
                    <div className="mt-4 text-xs text-muted-foreground">
                      ⚡ Configuración en 2 minutos
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary"
                  onClick={() => handleSetupMethodSelect('import')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                      <Upload className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Importar CSV</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Subir tu lista de productos desde Excel/CSV
                    </p>
                    <Badge variant="secondary">Masivo</Badge>
                    <div className="mt-4 text-xs text-muted-foreground">
                      📊 Para inventarios grandes
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary"
                  onClick={() => handleSetupMethodSelect('manual')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Manual</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Crear productos uno por uno desde cero
                    </p>
                    <Badge variant="outline">Personalizado</Badge>
                    <div className="mt-4 text-xs text-muted-foreground">
                      ✏️ Control total
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Configuración de productos</CardTitle>
              <CardDescription>
                {formData.setupMethod === 'template' && 'Personaliza los productos predefinidos'}
                {formData.setupMethod === 'import' && 'Importa tu inventario existente'}
                {formData.setupMethod === 'manual' && 'Crea tus categorías y productos'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formData.setupMethod === 'template' && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">
                      ✅ Template "{formData.selectedTemplate?.name}" aplicado
                    </h4>
                    <p className="text-green-700 text-sm">
                      Se han agregado {formData.selectedTemplate?.categories?.length} categorías y {formData.selectedTemplate?.sampleProducts?.length} productos de ejemplo.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Categorías incluidas:</h4>
                      <div className="space-y-2">
                        {formData.selectedTemplate?.categories?.map((cat: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                            <Check className="h-4 w-4 text-green-600" />
                            <span>{cat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">Productos de ejemplo:</h4>
                      <div className="space-y-2">
                        {formData.selectedTemplate?.sampleProducts?.map((product: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                            <span className="text-sm">{product.name}</span>
                            <Badge variant="outline">${product.price.toLocaleString()}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-700 text-sm">
                      💡 <strong>Tip:</strong> Después de completar la configuración, podrás agregar, editar o eliminar productos desde el módulo de Inventario.
                    </p>
                  </div>
                </div>
              )}

              {formData.setupMethod === 'import' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <Button onClick={downloadTemplate} variant="outline" className="mb-4">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar plantilla CSV
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-semibold mb-2">Subir archivo CSV</h4>
                    <p className="text-muted-foreground mb-4">
                      Arrastra y suelta tu archivo o haz clic para seleccionar
                    </p>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload">
                      <Button variant="outline" className="cursor-pointer">
                        Seleccionar archivo
                      </Button>
                    </Label>
                    {formData.importFile && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                        <p className="text-green-700 font-medium">
                          ✅ {formData.importFile.name} cargado correctamente
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 className="font-semibold text-yellow-800 mb-2">Formato requerido:</h5>
                    <ul className="text-yellow-700 text-sm space-y-1">
                      <li>• Columnas: Código, Nombre, Categoría, Precio, Stock, Descripción</li>
                      <li>• Precios sin puntos ni comas (ej: 25000)</li>
                      <li>• Categorías existentes o se crearán automáticamente</li>
                    </ul>
                  </div>
                </div>
              )}

              {formData.setupMethod === 'manual' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Configuración manual</h4>
                    <p className="text-blue-700 text-sm">
                      Comenzarás con un inventario vacío. Podrás agregar categorías y productos desde el módulo de Inventario después de completar la configuración.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">📦 Inventario</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Gestiona productos, categorías, stock y precios
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">💰 Facturación</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Sistema de ventas y gestión de mesas
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4">
                <Button onClick={prevStep} variant="outline" className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button onClick={nextStep} className="flex-1">
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Configuración fiscal</CardTitle>
              <CardDescription>
                Configura los aspectos contables y tributarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="taxRegime">Régimen tributario</Label>
                <Select value={formData.taxRegime} onValueChange={(value) => setFormData({ ...formData, taxRegime: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu régimen" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    <SelectItem value="responsable-iva">Responsable de IVA</SelectItem>
                    <SelectItem value="no-responsable-iva">No responsable de IVA</SelectItem>
                    <SelectItem value="gran-contribuyente">Gran contribuyente</SelectItem>
                    <SelectItem value="regimen-simple">Régimen simple de tributación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="retentionAgent"
                  checked={formData.retentionAgent}
                  onChange={(e) => setFormData({ ...formData, retentionAgent: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="retentionAgent">Agente retenedor</Label>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-semibold text-green-800 mb-2">🤖 ContAI - Tu asistente contable</h5>
                <p className="text-green-700 text-sm">
                  Con las ventas promedio de {formData.selectedTemplate?.name} (${(formData.selectedTemplate?.avgMonthlyRevenue / 1000000)?.toFixed(0)}M/mes), 
                  ContAI calculará automáticamente:
                </p>
                <ul className="mt-2 text-green-700 text-sm space-y-1">
                  <li>• IMPOCONSUMO (8%): ~${((formData.selectedTemplate?.avgMonthlyRevenue * 0.08) / 1000000)?.toFixed(1)}M/mes</li>
                  <li>• Retenciones en la fuente</li>
                  <li>• Proyecciones fiscales quincenales</li>
                  <li>• Alertas de vencimientos tributarios</li>
                </ul>
              </div>
              
              <div className="flex gap-4">
                <Button onClick={prevStep} variant="outline" className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button onClick={nextStep} className="flex-1">
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card className="max-w-3xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">¡Todo listo!</CardTitle>
              <CardDescription>
                Tu sistema de gestión está configurado y listo para usar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="font-semibold text-green-800">Empresa</span>
                    </div>
                    <p className="text-sm text-green-700">{formData.companyName}</p>
                    <p className="text-xs text-green-600">NIT: {formData.nit}</p>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Store className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-blue-800">Negocio</span>
                    </div>
                    <p className="text-sm text-blue-700">{formData.selectedTemplate?.name}</p>
                    <p className="text-xs text-blue-600">{formData.selectedTemplate?.categories?.length} categorías</p>
                  </CardContent>
                </Card>
                
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="font-semibold text-purple-800">Inventario</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      {formData.setupMethod === 'template' && 'Template aplicado'}
                      {formData.setupMethod === 'import' && 'Archivo importado'}
                      {formData.setupMethod === 'manual' && 'Configuración manual'}
                    </p>
                    <p className="text-xs text-purple-600">
                      {formData.setupMethod === 'template' && `${formData.selectedTemplate?.sampleProducts?.length} productos`}
                      {formData.setupMethod === 'import' && formData.importFile?.name}
                      {formData.setupMethod === 'manual' && 'Vacío - listo para agregar'}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Calculator className="h-4 w-4 text-orange-600" />
                      </div>
                      <span className="font-semibold text-orange-800">Fiscal</span>
                    </div>
                    <p className="text-sm text-orange-700">{formData.taxRegime}</p>
                    <p className="text-xs text-orange-600">
                      {formData.retentionAgent ? 'Agente retenedor' : 'No agente retenedor'}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-800 mb-3">🚀 Próximos pasos:</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Explora el <strong>Dashboard</strong> para ver el resumen general</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Visita <strong>Inventario</strong> para agregar/editar productos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Usa <strong>Facturación</strong> para comenzar a vender</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Consulta <strong>ContAI</strong> para asesoría contable automática</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button onClick={prevStep} variant="outline" className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button onClick={completeOnboarding} className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                  <Sparkles className="mr-2 h-4 w-4" />
                  ¡Comenzar a usar el sistema!
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header con progreso */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Configuración inicial
            </h1>
            <p className="text-muted-foreground mt-2">
              Paso {currentStep} de {totalSteps} - Configuremos tu sistema en minutos
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Contenido del paso */}
        <div className="animate-fade-in">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;