import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { 
  Wallet,
  TrendingUp,
  TrendingDown,
  Upload,
  Camera,
  AlertTriangle,
  CheckCircle,
  Eye,
  Receipt,
  Package,
  Calculator,
  Bot,
  Sparkles,
  DollarSign,
  PieChart,
  FileText,
  Download,
  CreditCard,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  Zap,
  Lock,
  Minus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getLocalDayRange } from '@/lib/date';
import ReceiptProcessor from '@/components/ReceiptProcessor';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'verified';
  receiptUrl?: string;
  aiAnalysis?: {
    confidence: number;
    extractedData: any;
    inventoryImpact: any[];
    alerts: string[];
  };
}

interface CashRegister {
  id?: string;
  opening: number;
  sales: number;
  expenses: number;
  cash: number;
  cards: number;
  expected: number;
  difference: number;
  is_closed: boolean;
  can_edit_opening: boolean;
  final_cash?: number;
}

interface CashPayment {
  id: string;
  amount: number;
  description: string;
  category: string;
  payment_method: string;
  created_at: string;
}

const openingBalanceSchema = z.object({
  opening_balance: z.number().min(0, "El monto debe ser mayor a 0")
});

const cashPaymentSchema = z.object({
  amount: z.number().min(1, "El monto debe ser mayor a 0"),
  description: z.string().min(1, "La descripción es requerida"),
  category: z.string().min(1, "La categoría es requerida"),
  payment_method: z.string().min(1, "El método de pago es requerido"),
  custom_method: z.string().optional()
});

const cashIncomeSchema = z.object({
  amount: z.number().min(1, "El monto debe ser mayor a 0"),
  description: z.string().min(1, "La descripción es requerida"),
  category: z.string().min(1, "La categoría es requerida")
});

const finalCashSchema = z.object({
  final_cash: z.number().min(0, "El monto debe ser mayor o igual a 0")
});

const CashManagement = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'transactions' | 'receipts' | 'analysis'>('overview');
  const [processedReceipts, setProcessedReceipts] = useState<any[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [cashPayments, setCashPayments] = useState<CashPayment[]>([]);
  const [cashIncomes, setCashIncomes] = useState<CashPayment[]>([]);
  const [dailySales, setDailySales] = useState(0);
  const [dailyExpenses, setDailyExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();
  const { profile, restaurant } = useAuth();

  const openingForm = useForm({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: { opening_balance: 0 }
  });

  const paymentForm = useForm({
    resolver: zodResolver(cashPaymentSchema),
    defaultValues: { 
      amount: 0, 
      description: '', 
      category: 'otros',
      payment_method: 'efectivo',
      custom_method: ''
    }
  });

  const incomeForm = useForm({
    resolver: zodResolver(cashIncomeSchema),
    defaultValues: { amount: 0, description: '', category: 'efectivo' }
  });

  const finalCashForm = useForm({
    resolver: zodResolver(finalCashSchema),
    defaultValues: { final_cash: 0 }
  });

  const isOwnerOrAdmin = profile?.role === 'owner' || profile?.role === 'admin';
  const canViewAmounts = isOwnerOrAdmin;

  const loadCashRegister = async () => {
    if (!restaurant?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get or create today's cash register
      const { data: existingRegister } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('date', today)
        .maybeSingle();

      if (existingRegister) {
        const canEditOpening = existingRegister.opening_balance === 0 && !existingRegister.is_closed;
        const cashPaymentsTotal = cashPayments.reduce((sum, p) => sum + p.amount, 0);
        const expectedCash = existingRegister.opening_balance + dailySales - dailyExpenses - cashPaymentsTotal;
        const difference = existingRegister.final_cash 
          ? existingRegister.final_cash - expectedCash
          : 0;
        
        setCashRegister({
          ...existingRegister,
          opening: existingRegister.opening_balance,
          sales: dailySales,
          expenses: dailyExpenses,
          cash: expectedCash,
          cards: 0, // TODO: Get from actual card sales
          expected: expectedCash,
          difference,
          can_edit_opening: canEditOpening || isOwnerOrAdmin,
          is_closed: existingRegister.is_closed
        });
      } else {
        // Create new register for today
        const { data: newRegister, error } = await supabase
          .from('cash_registers')
          .insert({
            user_id: profile?.id,
            restaurant_id: restaurant.id,
            date: today,
            opening_balance: 0
          })
          .select()
          .single();

        if (error) throw error;

        setCashRegister({
          id: newRegister.id,
          opening: 0,
          sales: dailySales,
          expenses: dailyExpenses,
          cash: 0,
          cards: 0,
          expected: 0,
          difference: 0,
          can_edit_opening: true,
          is_closed: false
        });
      }
    } catch (error) {
      console.error('Error loading cash register:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el registro de caja",
        variant: "destructive"
      });
    }
  };

  const loadDailySales = async () => {
    if (!restaurant?.id) return;

    try {
      const { startISO, endISO } = getLocalDayRange();
      
      const { data, error } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', startISO)
        .lt('created_at', endISO)
        .eq('status', 'completed');

      if (error) throw error;

      const total = data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      setDailySales(total);
    } catch (error) {
      console.error('Error loading daily sales:', error);
    }
  };

  const loadDailyExpenses = async () => {
    if (!restaurant?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('expenses')
        .select('total_amount')
        .gte('expense_date', `${today}T00:00:00`)
        .lt('expense_date', `${today}T23:59:59`);

      if (error) throw error;

      const total = data?.reduce((sum, expense) => sum + Number(expense.total_amount), 0) || 0;
      setDailyExpenses(total);
    } catch (error) {
      console.error('Error loading daily expenses:', error);
    }
  };

  const loadCashPayments = async () => {
    if (!cashRegister?.id) return;

    try {
      const { data, error } = await supabase
        .from('cash_payments')
        .select('*')
        .eq('cash_register_id', cashRegister.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Separar pagos e ingresos
      const payments = data?.filter(item => item.category !== 'ingreso_efectivo') || [];
      const incomes = data?.filter(item => item.category === 'ingreso_efectivo') || [];
      
      setCashPayments(payments);
      setCashIncomes(incomes);
    } catch (error) {
      console.error('Error loading cash payments:', error);
    }
  };

  const categories = {
    expense: ['Proveedores', 'Servicios', 'Nómina', 'Mantenimiento', 'Marketing', 'Otros'],
    income: ['Ventas', 'Servicios adicionales', 'Otros ingresos']
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const loadProcessedReceipts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_items (
            id,
            description,
            quantity,
            unit_price,
            subtotal,
            unit
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading processed receipts:', error);
        return;
      }

      setProcessedReceipts(data || []);
    } catch (error) {
      console.error('Error loading processed receipts:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadDailySales(),
        loadDailyExpenses(),
        loadProcessedReceipts()
      ]);
      await loadCashRegister();
      setLoading(false);
    };

    if (restaurant?.id && profile?.id) {
      loadData();
    }
  }, [restaurant?.id, profile?.id]);

  useEffect(() => {
    if (cashRegister?.id) {
      loadCashPayments();
    }
  }, [cashRegister?.id]);

  const handleReceiptProcessed = useCallback((data: any) => {
    console.log('Receipt processed:', data);
    loadProcessedReceipts();
    loadDailyExpenses();
    toast({
      title: "¡Factura procesada exitosamente!",
      description: "Los productos se han agregado al inventario automáticamente",
    });
  }, [toast]);

  const handleSetOpeningBalance = async (values: { opening_balance: number }) => {
    if (!cashRegister?.id) return;

    try {
      const { error } = await supabase
        .from('cash_registers')
        .update({ opening_balance: values.opening_balance })
        .eq('id', cashRegister.id);

      if (error) throw error;

      setCashRegister(prev => prev ? { ...prev, opening: values.opening_balance, can_edit_opening: false } : null);
      toast({
        title: "Base inicial actualizada",
        description: `Base de caja establecida en ${formatCurrency(values.opening_balance)}`
      });
    } catch (error) {
      console.error('Error updating opening balance:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la base inicial",
        variant: "destructive"
      });
    }
  };

  const handleCreateCashPayment = async (values: { 
    amount: number; 
    description: string; 
    category: string; 
    payment_method: string;
    custom_method?: string;
  }) => {
    if (!cashRegister?.id || !profile?.id) return;

    try {
      const finalPaymentMethod = values.payment_method === 'otro' 
        ? values.custom_method || 'otro'
        : values.payment_method;

      const { error } = await supabase
        .from('cash_payments')
        .insert({
          cash_register_id: cashRegister.id,
          user_id: profile.id,
          amount: -values.amount, // Negativo para pagos
          description: values.description,
          category: values.category,
          payment_method: finalPaymentMethod
        });

      if (error) throw error;

      paymentForm.reset();
      loadCashPayments();
      loadCashRegister();
      
      const message = values.payment_method === 'efectivo' 
        ? `Se descontaron ${formatCurrency(values.amount)} del efectivo`
        : `Pago registrado por ${finalPaymentMethod}`;
      
      toast({
        title: "Pago registrado",
        description: message
      });
    } catch (error) {
      console.error('Error creating cash payment:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar el pago",
        variant: "destructive"
      });
    }
  };

  const handleCreateCashIncome = async (values: { amount: number; description: string; category: string }) => {
    if (!cashRegister?.id || !profile?.id) return;

    try {
      const { error } = await supabase
        .from('cash_payments')
        .insert({
          cash_register_id: cashRegister.id,
          user_id: profile.id,
          amount: values.amount, // Positivo para ingresos
          description: values.description,
          category: 'ingreso_efectivo',
          payment_method: 'efectivo'
        });

      if (error) throw error;

      incomeForm.reset();
      loadCashPayments();
      loadCashRegister();
      toast({
        title: "Ingreso registrado",
        description: `Se agregaron ${formatCurrency(values.amount)} al efectivo`
      });
    } catch (error) {
      console.error('Error creating cash income:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar el ingreso",
        variant: "destructive"
      });
    }
  };

  const handleCloseCashRegister = async (values: { final_cash: number }) => {
    if (!cashRegister?.id || !profile?.id) return;

    try {
      const expectedCash = cashRegister.opening + cashRegister.sales - cashRegister.expenses;
      const difference = values.final_cash - expectedCash;
      
      const { error } = await supabase
        .from('cash_registers')
        .update({ 
          final_cash: values.final_cash,
          cash_difference: difference,
          is_closed: true,
          closed_at: new Date().toISOString(),
          closed_by: profile.id
        })
        .eq('id', cashRegister.id);

      if (error) throw error;

      // Generar documento de cierre de caja con análisis completo
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Obtener datos completos del día para el análisis
        const [salesResult, expensesResult, productsResult, paymentsResult] = await Promise.all([
          supabase
            .from('sales')
            .select(`
              *,
              sale_items(
                *,
                products(name, price, cost_price, category)
              )
            `)
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59`),
          
          supabase
            .from('expenses')
            .select('*')
            .gte('expense_date', `${today}T00:00:00`)
            .lt('expense_date', `${today}T23:59:59`),
          
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true),
          
          supabase
            .from('cash_payments')
            .select('*')
            .eq('cash_register_id', cashRegister.id)
        ]);

        const closingSummary = {
          cash_register: {
            opening_balance: cashRegister.opening,
            final_cash: values.final_cash,
            expected_cash: expectedCash,
            difference: difference,
            total_sales: cashRegister.sales,
            total_expenses: cashRegister.expenses,
            cards_total: cashRegister.cards || 0,
            transfers_total: 0 // TODO: implementar transferencias
          },
          sales_data: salesResult.data || [],
          expenses_data: expensesResult.data || [],
          products_data: productsResult.data || [],
          payments_data: paymentsResult.data || [],
          closing_date: new Date().toISOString(),
          closed_by: profile.full_name
        };

        // Generar análisis de IA del cierre
        const { data: aiResult } = await supabase.functions.invoke('business-analysis', {
          body: { 
            data: {
              sales: salesResult.data || [],
              expenses: expensesResult.data || [],
              products: productsResult.data || [],
              date: today,
              type: 'daily_summary' as const,
              cash_register: closingSummary.cash_register
            }
          }
        });

        // Guardar documento de cierre
        await supabase
          .from('business_documents')
          .insert({
            restaurant_id: profile.restaurant_id,
            user_id: profile.id,
            document_type: 'daily_summary',
            document_date: today,
            title: `Cierre de Caja - ${new Date().toLocaleDateString('es-ES')}`,
            content: closingSummary,
            ai_analysis: aiResult?.analysis || null,
            metadata: {
              auto_generated: true,
              source: 'cash_management',
              cash_register_id: cashRegister.id,
              final_balance: values.final_cash,
              difference: difference
            },
            is_confidential: true
          });

        toast({
          title: "📊 Cierre Completo",
          description: `Caja cerrada y resumen generado. ${difference >= 0 
            ? `Sobrante: ${formatCurrency(difference)}`
            : `Faltante: ${formatCurrency(Math.abs(difference))}`}`
        });

      } catch (docError) {
        console.error('Error generating closing document:', docError);
        toast({
          title: "⚠️ Caja cerrada",
          description: `${difference >= 0 
            ? `Sobrante: ${formatCurrency(difference)}`
            : `Faltante: ${formatCurrency(Math.abs(difference))}`} (Error en reporte automático)`
        });
      }

      setCashRegister(prev => prev ? { 
        ...prev, 
        final_cash: values.final_cash,
        difference,
        is_closed: true 
      } : null);

    } catch (error) {
      console.error('Error closing cash register:', error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la caja",
        variant: "destructive"
      });
    }
  };

  const renderOverview = () => {
    if (loading || !cashRegister) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando datos de caja...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Configurar base inicial */}
        {cashRegister.can_edit_opening && (
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-sm"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3 text-white text-xl">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <DollarSign className="h-6 w-6" />
                </div>
                Configurar Base Inicial de Caja
                <Badge className="bg-yellow-400/90 text-yellow-900 hover:bg-yellow-400">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Requerido
                </Badge>
              </CardTitle>
              <p className="text-white/90 text-sm">
                Establece el dinero inicial con el que abre la caja. Solo se puede configurar una vez por día.
              </p>
            </CardHeader>
            <CardContent className="relative z-10">
              <Form {...openingForm}>
                <form onSubmit={openingForm.handleSubmit(handleSetOpeningBalance)} className="space-y-4">
                  <FormField
                    control={openingForm.control}
                    name="opening_balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium">Dinero inicial en caja</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="Ej: 500000"
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/60 backdrop-blur-sm h-12 text-lg font-medium pr-16"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 font-medium">
                              COP
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage className="text-yellow-200" />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Establecer Base de Caja
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Resumen de caja */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Estado de Caja - {new Date().toLocaleDateString()}
              {cashRegister.is_closed && (
                <Badge variant="secondary" className="ml-2">
                  <Lock className="h-3 w-3 mr-1" />
                  Cerrada
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-muted-foreground">Base Inicial</p>
                <p className="text-2xl font-bold">{formatCurrency(cashRegister.opening)}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {canViewAmounts ? 'Ventas Totales' : 'Ventas'}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {canViewAmounts ? formatCurrency(cashRegister.sales) : '***'}
                </p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-muted-foreground">Gastos</p>
                <p className="text-2xl font-bold text-red-600">
                  {canViewAmounts ? formatCurrency(cashRegister.expenses) : '***'}
                </p>
              </div>
              <div className={`text-center p-4 rounded-lg ${
                cashRegister.difference >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <p className="text-sm text-muted-foreground">Diferencia</p>
                <p className={`text-2xl font-bold ${
                  cashRegister.difference >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {canViewAmounts 
                    ? formatCurrency(Math.abs(cashRegister.difference))
                    : '***'
                  }
                </p>
                <p className="text-xs">
                  {cashRegister.difference >= 0 ? 'Sobrante' : 'Faltante'}
                </p>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Banknote className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Efectivo</span>
                </div>
                <p className="text-xl font-bold text-blue-600">
                  {canViewAmounts ? formatCurrency(cashRegister.cash) : '***'}
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Tarjetas</span>
                </div>
                <p className="text-xl font-bold text-purple-600">
                  {canViewAmounts ? formatCurrency(cashRegister.cards) : '***'}
                </p>
              </div>
            </div>

            {/* Cerrar caja */}
            {!cashRegister.is_closed && isOwnerOrAdmin && (
              <>
                <Separator className="my-6" />
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 via-pink-500 to-purple-600 p-0.5 shadow-2xl">
                  <div className="relative bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 rounded-2xl p-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-pink-500/10 to-purple-600/10 rounded-2xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-full shadow-lg">
                          <Lock className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
                            Cerrar Caja del Día
                          </h4>
                          <p className="text-sm text-gray-600">
                            Cuenta el efectivo físico para calcular la diferencia final
                          </p>
                        </div>
                      </div>
                      <Form {...finalCashForm}>
                        <form onSubmit={finalCashForm.handleSubmit(handleCloseCashRegister)} className="space-y-4">
                          <FormField
                            control={finalCashForm.control}
                            name="final_cash"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700 font-semibold">Efectivo real en caja</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      placeholder="Contar billetes y monedas físicas"
                                      className="bg-white/70 border-2 border-purple-200 focus:border-purple-400 h-12 text-lg font-medium pr-16 rounded-xl shadow-sm"
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                      COP
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 hover:from-red-600 hover:via-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          >
                            <Lock className="h-5 w-5 mr-2" />
                            Cerrar Caja Definitivamente
                          </Button>
                        </form>
                      </Form>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

      </div>
    );
  };

  const renderReceiptUpload = () => (
    <div className="space-y-6">
      <ReceiptProcessor onProcessComplete={handleReceiptProcessed} />

      {/* Transacciones recientes procesadas por IA */}
      <Card>
        <CardHeader>
          <CardTitle>Facturas Procesadas por IA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processedReceipts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay facturas procesadas aún</p>
                <p className="text-sm">Sube una factura arriba para comenzar</p>
              </div>
            ) : (
              processedReceipts.map(expense => (
                <div key={expense.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{expense.supplier_name || 'Proveedor desconocido'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(expense.expense_date).toLocaleDateString()} • {formatCurrency(expense.total_amount)}
                      </p>
                      {expense.invoice_number && (
                        <p className="text-xs text-muted-foreground">
                          Factura: {expense.invoice_number}
                        </p>
                      )}
                    </div>
                    <Badge variant={expense.status === 'processed' ? 'default' : 'secondary'}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {expense.ai_analysis?.confidence || 95}% confianza
                    </Badge>
                  </div>
                  
                  {/* Productos detectados */}
                  {expense.expense_items && expense.expense_items.length > 0 && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Productos detectados:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {expense.expense_items.map((item, idx) => (
                            <div key={idx} className="bg-muted/30 rounded p-2 text-sm">
                              <span className="font-medium">{item.description}</span>
                              <span className="text-muted-foreground ml-2">
                                {item.quantity} {item.unit || 'unidades'} • {formatCurrency(item.unit_price)}/unidad
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTransactions = () => (
    <div className="space-y-6">
      {/* Registrar nuevo ingreso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <ArrowUpRight className="h-5 w-5" />
            Registrar Ingreso en Efectivo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Agregar dinero adicional a la caja (no ventas)
          </p>
        </CardHeader>
        <CardContent>
          <Form {...incomeForm}>
            <form onSubmit={incomeForm.handleSubmit(handleCreateCashIncome)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={incomeForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={incomeForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <FormControl>
                        <select className="w-full p-2 border rounded" {...field}>
                          <option value="efectivo">Efectivo adicional</option>
                          <option value="cambio">Cambio</option>
                          <option value="reembolso">Reembolso</option>
                          <option value="otros">Otros ingresos</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Agregar Ingreso
                  </Button>
                </div>
              </div>
              <FormField
                control={incomeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe el ingreso..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Formulario registrar pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Minus className="h-5 w-5" />
            Registrar Pago
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Registra pagos y gastos de la operación diaria
          </p>
        </CardHeader>
        <CardContent>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(handleCreateCashPayment)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  control={paymentForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <FormControl>
                        <select className="w-full p-2 border rounded" {...field}>
                          <option value="servicios">Servicios</option>
                          <option value="proveedores">Proveedores</option>
                          <option value="nomina">Nómina</option>
                          <option value="mantenimiento">Mantenimiento</option>
                          <option value="otros">Otros</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pago</FormLabel>
                      <FormControl>
                        <select className="w-full p-2 border rounded" {...field}>
                          <option value="efectivo">Efectivo</option>
                          <option value="tarjeta">Tarjeta</option>
                          <option value="transferencia">Transferencia</option>
                          <option value="cheque">Cheque</option>
                          <option value="otro">Otro</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                    <Minus className="h-4 w-4 mr-2" />
                    Registrar Pago
                  </Button>
                </div>
              </div>
              
              {paymentForm.watch('payment_method') === 'otro' && (
                <FormField
                  control={paymentForm.control}
                  name="custom_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especificar método de pago</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Crypto, Efectivo USD, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={paymentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe el pago..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Historial tipo banco */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Historial de Transacciones del Día
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Registro tipo banco de todos los movimientos
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...cashIncomes.map(item => ({...item, type: 'income'})), 
              ...cashPayments.map(item => ({...item, type: 'expense'}))]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay transacciones registradas</p>
                <p className="text-sm">Los movimientos aparecerán aquí conforme los registres</p>
              </div>
            ) : (
              [...cashIncomes.map(item => ({...item, type: 'income'})), 
               ...cashPayments.map(item => ({...item, type: 'expense'}))]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((transaction, index) => (
                <div key={`${transaction.type}-${transaction.id}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground font-mono">
                      #{String(index + 1).padStart(3, '0')}
                    </div>
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{transaction.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{transaction.category}</span>
                        <span>•</span>
                        <span>{transaction.payment_method}</span>
                        <span>•</span>
                        <span>{new Date(transaction.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <Badge variant={transaction.payment_method === 'efectivo' ? 'default' : 'secondary'}>
                      {transaction.payment_method}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Gestión de Caja
          </h1>
          <p className="text-muted-foreground mt-2">
            Control total de ingresos, gastos e inventario con IA
          </p>
        </div>

        {/* Navegación */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button 
            variant={currentView === 'overview' ? 'default' : 'outline'}
            onClick={() => setCurrentView('overview')}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Resumen
          </Button>
          <Button 
            variant={currentView === 'receipts' ? 'default' : 'outline'}
            onClick={() => setCurrentView('receipts')}
          >
            <Camera className="h-4 w-4 mr-2" />
            Facturas IA
          </Button>
          <Button 
            variant={currentView === 'transactions' ? 'default' : 'outline'}
            onClick={() => setCurrentView('transactions')}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Transacciones
          </Button>
          <Button 
            variant={currentView === 'analysis' ? 'default' : 'outline'}
            onClick={() => setCurrentView('analysis')}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Análisis IA
          </Button>
        </div>

        {/* Contenido según vista */}
        {currentView === 'overview' && renderOverview()}
        {currentView === 'receipts' && renderReceiptUpload()}
        {currentView === 'transactions' && renderTransactions()}
        {currentView === 'analysis' && (
          <Card>
            <CardContent className="p-8 text-center">
              <Bot className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Análisis IA en Desarrollo</h3>
              <p className="text-muted-foreground">
                Próximamente: Análisis predictivo de gastos, recomendaciones de optimización y alertas automáticas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CashManagement;