import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calculator, 
  TrendingUp, 
  Calendar, 
  FileCheck, 
  AlertTriangle,
  DollarSign,
  Receipt,
  Target,
  Clock,
  CheckCircle,
  Send,
  Sparkles,
  Bot,
  PieChart,
  BarChart,
  FileText,
  Users,
  Brain,
  Database,
  Zap,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface TaxCalculation {
  period: string;
  impoconsumo: number;
  reteiva: number;
  retefuente: number;
  total: number;
  dueDate: string;
  status: 'pending' | 'calculated' | 'ready';
  baseSales: number;
  projection?: boolean;
}

interface SalesData {
  period: string;
  totalSales: number;
  salesCount: number;
  avgTicket: number;
}

interface TaxHistory {
  id: string;
  period: string;
  calculations: TaxCalculation;
  createdAt: Date;
}

interface ConversationMessage {
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

const ContAI = () => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [realSalesData, setRealSalesData] = useState<SalesData[]>([]);
  const [currentTaxes, setCurrentTaxes] = useState<TaxCalculation[]>([]);
  const [taxHistory, setTaxHistory] = useState<TaxHistory[]>([]);
  const [showTaxForm, setShowTaxForm] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { toast } = useToast();

  // Load real sales data and calculate taxes
  useEffect(() => {
    if (user) {
      loadRealSalesData();
    }
  }, [user]);

  useEffect(() => {
    const greetings = [
      "¡Hola! Soy tu asistente contable especializado en Colombia 🇨🇴",
      "¡Buen día! Estoy aquí para ayudarte con tus impuestos basados en tus ventas reales",
      "¡Perfecto! Vamos a calcular tus impuestos con datos reales de facturación",
      "¡Hola chef! Analicemos tus impuestos basados en las ventas registradas"
    ];
    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);

    // Initialize conversation
    setConversation([{
      type: 'ai',
      message: `${greetings[Math.floor(Math.random() * greetings.length)]}\n\n📊 He cargado tus datos reales de facturación para calcular impuestos precisos.\n\n¿En qué puedo ayudarte hoy?`,
      timestamp: new Date()
    }]);
  }, []);

  const loadRealSalesData = async () => {
    try {
      setIsLoadingData(true);
      
      // Get sales data from the last 6 months
      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          created_at,
          payment_method,
          sale_items (
            quantity,
            unit_price,
            subtotal
          )
        `)
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (salesData && salesData.length > 0) {
        // Process sales data by month
        const salesByMonth = processSalesDataByMonth(salesData);
        setRealSalesData(salesByMonth);
        
        // Calculate taxes based on real data
        const taxCalculations = calculateTaxesFromSales(salesByMonth);
        setCurrentTaxes(taxCalculations);
        
        // Generate AI projections
        const projections = generateTaxProjections(salesByMonth);
        setCurrentTaxes(prev => [...prev, ...projections]);
      }
      
    } catch (error) {
      console.error('Error loading sales data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de ventas. Usando datos de ejemplo.",
        variant: "destructive"
      });
      // Fallback to sample data
      loadSampleData();
    } finally {
      setIsLoadingData(false);
    }
  };

  const processSalesDataByMonth = (salesData: any[]): SalesData[] => {
    const monthlyData: { [key: string]: { total: number; count: number } } = {};
    
    salesData.forEach(sale => {
      const month = new Date(sale.created_at).toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { total: 0, count: 0 };
      }
      
      monthlyData[month].total += parseFloat(sale.total_amount || 0);
      monthlyData[month].count += 1;
    });
    
    return Object.entries(monthlyData).map(([period, data]) => ({
      period,
      totalSales: data.total,
      salesCount: data.count,
      avgTicket: data.total / data.count
    }));
  };

  const calculateTaxesFromSales = (salesData: SalesData[]): TaxCalculation[] => {
    return salesData.slice(0, 3).map((monthData, index) => {
      const baseSales = monthData.totalSales;
      
      // Colombian tax calculations for restaurants
      const impoconsumo = baseSales * 0.08; // 8% IMPOCONSUMO
      const reteiva = baseSales * 0.15 * 0.15; // RETEIVA on purchases (estimated)
      const retefuente = baseSales * 0.035; // 3.5% RETEFUENTE
      
      const currentDate = new Date();
      const taxMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - index, 1);
      const dueDate = new Date(taxMonth.getFullYear(), taxMonth.getMonth() + 1, 15);
      
      return {
        period: monthData.period,
        impoconsumo,
        reteiva,
        retefuente,
        total: impoconsumo + reteiva + retefuente,
        dueDate: dueDate.toLocaleDateString('es-CO'),
        status: index === 0 ? 'ready' : 'calculated',
        baseSales
      };
    });
  };

  const generateTaxProjections = (salesData: SalesData[]): TaxCalculation[] => {
    if (salesData.length < 2) return [];
    
    // Calculate growth trend
    const recentSales = salesData.slice(0, 3);
    const avgGrowth = recentSales.reduce((acc, curr, index) => {
      if (index === 0) return 0;
      const prevSales = recentSales[index - 1]?.totalSales || curr.totalSales;
      return acc + ((curr.totalSales - prevSales) / prevSales);
    }, 0) / (recentSales.length - 1);
    
    // Generate next 2 months projections
    const projections: TaxCalculation[] = [];
    for (let i = 1; i <= 2; i++) {
      const lastSales = salesData[0]?.totalSales || 0;
      const projectedSales = lastSales * (1 + avgGrowth) ** i;
      
      const currentDate = new Date();
      const projectionMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const dueDate = new Date(projectionMonth.getFullYear(), projectionMonth.getMonth() + 1, 15);
      
      projections.push({
        period: `${projectionMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })} (Proyección IA)`,
        impoconsumo: projectedSales * 0.08,
        reteiva: projectedSales * 0.15 * 0.15,
        retefuente: projectedSales * 0.035,
        total: (projectedSales * 0.08) + (projectedSales * 0.15 * 0.15) + (projectedSales * 0.035),
        dueDate: dueDate.toLocaleDateString('es-CO'),
        status: 'pending',
        baseSales: projectedSales,
        projection: true
      });
    }
    
    return projections;
  };

  const loadSampleData = () => {
    const sampleSales = [
      { period: "Enero 2024", totalSales: 14720000, salesCount: 420, avgTicket: 35048 },
      { period: "Diciembre 2023", totalSales: 13200000, salesCount: 380, avgTicket: 34737 },
      { period: "Noviembre 2023", totalSales: 12800000, salesCount: 360, avgTicket: 35556 }
    ];
    setRealSalesData(sampleSales);
    setCurrentTaxes(calculateTaxesFromSales(sampleSales));
  };

  const quickQuestions = [
    {
      icon: Receipt,
      text: "¿Cuánto debo pagar de IMPOCONSUMO este mes?",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: Calendar,
      text: "¿Cuáles son las fechas importantes de impuestos?",
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      icon: Calculator,
      text: "Ayúdame a calcular retenciones",
      gradient: "from-purple-500 to-violet-600"
    },
    {
      icon: FileCheck,
      text: "¿Qué documentos necesito para mi contador?",
      gradient: "from-orange-500 to-red-600"
    },
    {
      icon: TrendingUp,
      text: "Optimiza mis deducciones fiscales",
      gradient: "from-teal-500 to-cyan-600"
    },
    {
      icon: Target,
      text: "Proyección fiscal para el próximo trimestre",
      gradient: "from-pink-500 to-rose-600"
    }
  ];

  // Enhanced AI response with real data integration
  const generateAIResponse = async (question: string): Promise<string> => {
    const lowerQuestion = question.toLowerCase();
    
    // Prepare real data context
    const currentMonthSales = realSalesData[0]?.totalSales || 0;
    const currentMonthTax = currentTaxes.find(tax => !tax.projection);
    
    try {
      // Call the ConektaoAI API for intelligent responses
      const { data, error } = await supabase.functions.invoke('conektao-ai', {
        body: {
          message: question,
          context: {
            type: 'tax_consultation',
            salesData: realSalesData,
            taxCalculations: currentTaxes,
            userType: 'restaurant_owner'
          }
        }
      });
      
      if (data?.response) {
        return data.response;
      }
    } catch (error) {
      console.error('Error calling ConektaoAI:', error);
    }
    
    // Fallback to local responses with real data
    return generateLocalResponse(question, currentMonthSales, currentMonthTax);
  };

  const generateLocalResponse = (question: string, currentMonthSales: number, currentMonthTax?: TaxCalculation): string => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('impoconsumo') || lowerQuestion.includes('impuesto al consumo')) {
      const impoconsumoAmount = currentMonthTax?.impoconsumo || (currentMonthSales * 0.08);
      return `📊 IMPOCONSUMO - Basado en tus ventas reales\n\n✅ Tarifa: 8% sobre consumo en restaurante\n💰 Ventas registradas: ${formatCurrency(currentMonthSales)}\n💰 Tu IMPOCONSUMO: ${formatCurrency(impoconsumoAmount)}\n📅 Vencimiento: ${currentMonthTax?.dueDate || '15 del mes siguiente'}\n⚠️ Recordatorio: Se paga mensualmente basado en tus ventas reales\n\n¿Necesitas que prepare el formulario con estos datos?`;
    }
    
    if (lowerQuestion.includes('retenciones') || lowerQuestion.includes('reteiva') || lowerQuestion.includes('retefuente')) {
      const reteiva = currentMonthTax?.reteiva || (currentMonthSales * 0.15 * 0.15);
      const retefuente = currentMonthTax?.retefuente || (currentMonthSales * 0.035);
      return `🏦 Retenciones basadas en tus ventas reales\n\nRETEIVA (15%):\n• Sobre compras > $178,000 COP\n• Tu retención estimada: ${formatCurrency(reteiva)}\n\nRETEFUENTE (3.5%):\n• Servicios de restaurante para empresas\n• Tu retención estimada: ${formatCurrency(retefuente)}\n\n📊 Basado en ventas: ${formatCurrency(currentMonthSales)}\n💡 Tip: Estos cálculos usan tus datos reales de facturación.`;
    }
    
    if (lowerQuestion.includes('proyeccion') || lowerQuestion.includes('futuro') || lowerQuestion.includes('proximo')) {
      const projections = currentTaxes.filter(tax => tax.projection);
      if (projections.length > 0) {
        const nextProjection = projections[0];
        return `🔮 Proyección fiscal basada en IA\n\n📈 Ventas proyectadas: ${formatCurrency(nextProjection.baseSales)}\n💰 IMPOCONSUMO proyectado: ${formatCurrency(nextProjection.impoconsumo)}\n💸 Total impuestos: ${formatCurrency(nextProjection.total)}\n📅 Período: ${nextProjection.period}\n\n🤖 Esta proyección se basa en el análisis de tus ventas históricas usando IA.`;
      }
    }
    
    if (lowerQuestion.includes('historico') || lowerQuestion.includes('anterior') || lowerQuestion.includes('meses pasados')) {
      const historicalData = realSalesData.slice(1, 4);
      let response = `📊 Historial de impuestos (últimos meses):\n\n`;
      historicalData.forEach((data, index) => {
        const tax = currentTaxes.find(t => t.period === data.period);
        if (tax) {
          response += `${data.period}:\n• Ventas: ${formatCurrency(data.totalSales)}\n• IMPOCONSUMO: ${formatCurrency(tax.impoconsumo)}\n• Total impuestos: ${formatCurrency(tax.total)}\n\n`;
        }
      });
      return response + "💡 Todos estos cálculos están basados en tus ventas reales registradas.";
    }
    
    return `🤖 Entiendo tu consulta sobre "${question}". \n\nUsando tus datos reales de facturación, puedo ayudarte con:\n\n• Cálculos precisos de IMPOCONSUMO basados en ventas: ${formatCurrency(currentMonthSales)}\n• Retenciones calculadas con datos reales\n• Proyecciones inteligentes usando IA\n• Análisis histórico de tus impuestos\n\n¿Qué información específica necesitas sobre tus impuestos?`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const aiSuggestions = [
    {
      title: "Optimización Fiscal Restaurante",
      description: "Aprovecha las deducciones por compra de equipos de cocina y mobiliario",
      priority: "high",
      impact: "Alto ahorro",
      icon: Calculator,
      gradient: "from-green-500 to-emerald-600"
    },
    {
      title: "Alerta IMPOCONSUMO",
      description: `Basado en ventas: ${formatCurrency(realSalesData[0]?.totalSales || 0)}`,
      priority: "urgent",
      impact: "Evita multas",
      icon: AlertTriangle,
      gradient: "from-red-500 to-orange-600"
    },
    {
      title: "Proyección IA",
      description: `Impuestos estimados próximo mes: ${formatCurrency(currentTaxes.find(t => t.projection)?.total || 0)}`,
      priority: "medium",
      impact: "Planificación",
      icon: FileText,
      gradient: "from-blue-500 to-indigo-600"
    },
    {
      title: "Análisis Histórico",
      description: `Datos de ${realSalesData.length} meses disponibles para análisis`,
      priority: "medium",
      impact: "Insights",
      icon: Users,
      gradient: "from-purple-500 to-violet-600"
    }
  ];

  const handleSendMessage = async () => {
    if (!currentQuestion.trim()) return;

    const userMessage: ConversationMessage = {
      type: 'user',
      message: currentQuestion,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    const questionToProcess = currentQuestion;
    setCurrentQuestion('');
    setIsTyping(true);

    try {
      const response = await generateAIResponse(questionToProcess);
      const aiResponse: ConversationMessage = {
        type: 'ai',
        message: response,
        timestamp: new Date()
      };
      setConversation(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorResponse: ConversationMessage = {
        type: 'ai',
        message: 'Lo siento, hubo un error al procesar tu consulta. Por favor intenta de nuevo.',
        timestamp: new Date()
      };
      setConversation(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setCurrentQuestion(question);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--ai-surface))] text-[hsl(var(--ai-foreground))]">
      {/* Hero Section - Diseño Negro */}
      <div className="relative overflow-hidden bg-[hsl(var(--ai-surface))] border-b border-[hsl(var(--ai-border))]">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-blue-900/20 to-purple-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              🧮 ContAI - Contabilidad Inteligente
            </h1>
            <p className="text-xl md:text-2xl text-[hsl(var(--muted-foreground))] mb-8 max-w-3xl mx-auto">
              Inteligencia Artificial especializada en tributación colombiana para restaurantes
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-lg px-4 py-2">
                <Calculator className="w-5 h-5 mr-2" />
                Cálculo automático de impuestos
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-lg px-4 py-2">
                <TrendingUp className="w-5 h-5 mr-2" />
                Proyecciones fiscales precisas
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-lg px-4 py-2">
                <Brain className="w-5 h-5 mr-2" />
                IA especializada en DIAN
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Fondo Negro */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content Section */}
          <div className="xl:col-span-3 space-y-6">

            {/* Chat Interface - Negro Total */}
            <Card className="bg-[hsl(var(--ai-surface))] border-[hsl(var(--ai-border))] shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[hsl(var(--ai-foreground))]">
                  <MessageCircle className="h-5 w-5 text-blue-400" />
                  Chat con ContAI
                  <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">
                    <Zap className="w-3 h-3 mr-1" />
                    En línea
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-[hsl(var(--ai-surface))] rounded-xl border border-[hsl(var(--ai-border))]">
                  {conversation.map((msg, index) => (
                    <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.type === 'user' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                          : 'bg-[hsl(var(--ai-surface))] border border-[hsl(var(--ai-border))] text-[hsl(var(--ai-foreground))] shadow-md'
                      } transition-all duration-200`}>
                        {msg.type === 'ai' && (
                          <div className="flex items-center mb-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full flex items-center justify-center mr-2">
                              <Brain className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-emerald-400">ContAI</span>
                            <Badge className="ml-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Especialista DIAN
                            </Badge>
                          </div>
                        )}
                        <div className={`text-sm leading-relaxed ${
                          msg.type === 'user' ? 'text-white' : 'text-[hsl(var(--ai-foreground))]'
                        }`}>
                          {msg.message}
                        </div>
                        <div className={`text-xs mt-2 ${
                          msg.type === 'user' ? 'text-blue-100' : 'text-[hsl(var(--muted-foreground))]'
                        }`}>
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start animate-fade-in">
                      <div className="bg-[hsl(var(--ai-surface))] border border-[hsl(var(--ai-border))] p-4 rounded-2xl max-w-[80%] shadow-md">
                        <div className="flex items-center mb-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full flex items-center justify-center mr-2">
                            <Brain className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-emerald-400">ContAI está calculando...</span>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Textarea
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    placeholder="Pregunta sobre impuestos, cálculos tributarios, DIAN..."
                    className="flex-1 resize-none bg-[hsl(var(--ai-surface))] border-[hsl(var(--ai-border))] text-[hsl(var(--ai-foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
                    rows={3}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!currentQuestion.trim() || isTyping}
                    className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Questions - Negro */}
            <Card className="bg-[hsl(var(--ai-surface))] border-[hsl(var(--ai-border))] shadow-xl h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[hsl(var(--ai-foreground))]">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  Preguntas Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickQuestion(question.text)}
                    className="w-full text-left justify-start h-auto p-3 bg-[hsl(var(--ai-surface))] border-[hsl(var(--ai-border))] text-[hsl(var(--ai-foreground))] hover:bg-[hsl(var(--ai-surface))]/80 hover:border-cyan-400/40 transition-all duration-200"
                  >
                    <div className={`w-8 h-8 bg-gradient-to-br ${question.gradient} rounded-lg flex items-center justify-center mr-3 flex-shrink-0`}>
                      <question.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium break-words leading-relaxed flex-1 overflow-hidden">{question.text}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Analytics Section - Negro */}
            <Card className="bg-[hsl(var(--ai-surface))] border-[hsl(var(--ai-border))] shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[hsl(var(--ai-foreground))]">
                  <BarChart className="h-5 w-5 text-blue-400" />
                  Análisis Tributario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                    <DollarSign className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xs text-emerald-300 font-medium">Impuestos Mes</p>
                    <p className="text-lg font-bold text-emerald-200">
                      {formatCurrency(currentTaxes.find(tax => !tax.projection)?.total || 0)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                    <p className="text-xs text-blue-300 font-medium">Próximo Pago</p>
                    <p className="text-sm font-bold text-blue-200">Feb 15</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Sources - Negro */}
            <Card className="bg-[hsl(var(--ai-surface))] border-[hsl(var(--ai-border))] shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[hsl(var(--ai-foreground))]">
                  <Database className="h-5 w-5 text-green-400" />
                  Fuentes de Datos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Sistema POS", status: realSalesData.length > 0 ? "connected" : "pending", color: realSalesData.length > 0 ? "green" : "yellow" },
                    { name: "Facturación Real", status: currentTaxes.length > 0 ? "connected" : "pending", color: currentTaxes.length > 0 ? "green" : "yellow" },
                    { name: "ConektaoAI API", status: "connected", color: "green" },
                    { name: "Proyecciones IA", status: currentTaxes.some(t => t.projection) ? "connected" : "pending", color: currentTaxes.some(t => t.projection) ? "green" : "yellow" }
                  ].map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-[hsl(var(--ai-surface))]/50 rounded-lg border border-[hsl(var(--ai-border))]">
                      <span className="text-sm font-medium text-[hsl(var(--ai-foreground))]">{source.name}</span>
                      <div className={`w-3 h-3 rounded-full ${
                        source.status === 'connected' ? 'bg-green-400 shadow-green-400/50' : 'bg-yellow-400 shadow-yellow-400/50'
                      } shadow-lg animate-pulse`}></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContAI;