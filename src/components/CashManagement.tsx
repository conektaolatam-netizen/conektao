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
  Minus,
  ArrowLeft,
  Edit3,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getLocalDayRange } from '@/lib/date';
import ReceiptProcessor from '@/components/ReceiptProcessor';
import TipPayoutsSection from '@/components/cash/TipPayoutsSection';
import GuidedCashClose from '@/components/cash/GuidedCashClose';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuditLog } from '@/hooks/useAuditLog';

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
  cashSales: number;        // Ventas en efectivo
  cardSales: number;        // Ventas en tarjeta/transfer
  cashDeposits: number;     // Ingresos manuales en efectivo
  cashWithdrawals: number;  // Retiros/pagos en efectivo
  cashExpenses: number;     // Gastos pagados en efectivo
  currentCash: number;      // Saldo actual calculado
  is_closed: boolean;
  hasOpeningSet: boolean;   // Ya tiene base configurada?
  final_cash?: number;
  difference?: number;
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
  opening_balance: z.number().min(0, "El monto debe ser mayor o igual a 0")
});

const editOpeningSchema = z.object({
  new_opening: z.number().min(0, "El monto debe ser mayor o igual a 0"),
  reason: z.string().min(5, "La razón debe tener al menos 5 caracteres")
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

const CashManagement = ({ onBack }: { onBack?: () => void }) => {
  const [currentView, setCurrentView] = useState<'overview' | 'transactions' | 'receipts' | 'analysis' | 'guided_close'>('overview');
  const [processedReceipts, setProcessedReceipts] = useState<any[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegister | null>(null);
  const [cashPayments, setCashPayments] = useState<CashPayment[]>([]);
  const [cashIncomes, setCashIncomes] = useState<CashPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuidedClose, setShowGuidedClose] = useState(false);
  const [showEditOpeningDialog, setShowEditOpeningDialog] = useState(false);

  const { toast } = useToast();
  const { profile, restaurant } = useAuth();
  const { logAction } = useAuditLog();

  const openingForm = useForm({
    resolver: zodResolver(openingBalanceSchema),
    defaultValues: { opening_balance: 0 }
  });

  const editOpeningForm = useForm({
    resolver: zodResolver(editOpeningSchema),
    defaultValues: { new_opening: 0, reason: '' }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Cargar todos los datos de caja del día
  const loadCashData = async () => {
    if (!restaurant?.id || !profile?.id) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const { startISO, endISO } = getLocalDayRange();

      // Obtener o crear registro de caja de hoy
      let { data: existingRegister } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('date', today)
        .maybeSingle();

      if (!existingRegister) {
        const { data: newRegister, error } = await supabase
          .from('cash_registers')
          .insert({
            user_id: profile.id,
            restaurant_id: restaurant.id,
            date: today,
            opening_balance: 0
          })
          .select()
          .single();

        if (error) throw error;
        existingRegister = newRegister;
      }

      // Cargar ventas del día - separar por método de pago
      const { data: salesData } = await supabase
        .from('sales')
        .select('total_amount, payment_method')
        .gte('created_at', startISO)
        .lt('created_at', endISO)
        .eq('status', 'completed');

      const cashSales = salesData?.filter(s => 
        s.payment_method?.toLowerCase() === 'efectivo' || 
        s.payment_method?.toLowerCase() === 'cash'
      ).reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;

      const cardSales = salesData?.filter(s => 
        s.payment_method?.toLowerCase() !== 'efectivo' && 
        s.payment_method?.toLowerCase() !== 'cash'
      ).reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;

      // Cargar movimientos de caja del día
      const { data: paymentsData } = await supabase
        .from('cash_payments')
        .select('*')
        .eq('cash_register_id', existingRegister.id)
        .order('created_at', { ascending: false });

      // Separar ingresos y egresos en efectivo
      const incomes = paymentsData?.filter(p => p.amount > 0 && p.payment_method === 'efectivo') || [];
      const cashWithdrawals = paymentsData?.filter(p => 
        p.amount < 0 && p.payment_method === 'efectivo'
      ) || [];

      const totalCashDeposits = incomes.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalCashWithdrawals = Math.abs(cashWithdrawals.reduce((sum, p) => sum + Number(p.amount), 0));

      // Cargar gastos del día pagados en efectivo
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('total_amount, payment_method')
        .gte('expense_date', `${today}T00:00:00`)
        .lt('expense_date', `${today}T23:59:59`)
        .eq('payment_method', 'efectivo');

      const cashExpenses = expensesData?.reduce((sum, e) => sum + Number(e.total_amount), 0) || 0;

      // Calcular saldo actual de efectivo
      const openingBalance = Number(existingRegister.opening_balance) || 0;
      const currentCash = openingBalance + cashSales + totalCashDeposits - totalCashWithdrawals - cashExpenses;

      setCashRegister({
        id: existingRegister.id,
        opening: openingBalance,
        cashSales,
        cardSales,
        cashDeposits: totalCashDeposits,
        cashWithdrawals: totalCashWithdrawals,
        cashExpenses,
        currentCash,
        is_closed: existingRegister.is_closed,
        hasOpeningSet: openingBalance > 0,
        final_cash: existingRegister.final_cash,
        difference: existingRegister.cash_difference
      });

      setCashPayments(cashWithdrawals);
      setCashIncomes(incomes);

    } catch (error) {
      console.error('Error loading cash data:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el estado de caja",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
    if (restaurant?.id && profile?.id) {
      loadCashData();
      loadProcessedReceipts();
    }
  }, [restaurant?.id, profile?.id]);

  const handleReceiptProcessed = useCallback((data: any) => {
    console.log('Receipt processed:', data);
    loadProcessedReceipts();
    loadCashData(); // Recargar para reflejar gastos
    toast({
      title: "¡Factura procesada exitosamente!",
      description: "Los productos se han agregado al inventario automáticamente",
    });
  }, [toast]);

  // Establecer base inicial (solo si no hay base)
  const handleSetOpeningBalance = async (values: { opening_balance: number }) => {
    if (!cashRegister?.id) return;

    try {
      const { error } = await supabase
        .from('cash_registers')
        .update({ opening_balance: values.opening_balance })
        .eq('id', cashRegister.id);

      if (error) throw error;

      await logAction({
        tableName: 'cash_registers',
        action: 'BASE_INICIAL_ESTABLECIDA',
        recordId: cashRegister.id,
        newValues: { opening_balance: values.opening_balance }
      });

      loadCashData();
      toast({
        title: "Base inicial establecida",
        description: `Base de caja: ${formatCurrency(values.opening_balance)}`
      });
    } catch (error) {
      console.error('Error setting opening balance:', error);
      toast({
        title: "Error",
        description: "No se pudo establecer la base inicial",
        variant: "destructive"
      });
    }
  };

  // Editar base inicial (con razón obligatoria)
  const handleEditOpeningBalance = async (values: { new_opening: number; reason: string }) => {
    if (!cashRegister?.id) return;

    try {
      const oldOpening = cashRegister.opening;

      const { error } = await supabase
        .from('cash_registers')
        .update({ opening_balance: values.new_opening })
        .eq('id', cashRegister.id);

      if (error) throw error;

      // Registrar en auditoría
      await logAction({
        tableName: 'cash_registers',
        action: 'BASE_INICIAL_EDITADA',
        recordId: cashRegister.id,
        oldValues: { opening_balance: oldOpening },
        newValues: { opening_balance: values.new_opening, reason: values.reason },
        isSensitive: true
      });

      setShowEditOpeningDialog(false);
      editOpeningForm.reset();
      loadCashData();
      
      toast({
        title: "Base inicial actualizada",
        description: `Cambio de ${formatCurrency(oldOpening)} a ${formatCurrency(values.new_opening)}`
      });
    } catch (error) {
      console.error('Error editing opening balance:', error);
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
      loadCashData();
      
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
      loadCashData();
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
      const expectedCash = cashRegister.currentCash;
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
            total_cash_sales: cashRegister.cashSales,
            total_cash_expenses: cashRegister.cashExpenses,
            cards_total: cashRegister.cardSales,
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
          <p className="mt-2 text-white/60">Cargando datos de caja...</p>
        </div>
      );
    }

    const totalSales = cashRegister.cashSales + cashRegister.cardSales;
    const totalEntradas = cashRegister.cashSales + cashRegister.cashDeposits;
    const totalSalidas = cashRegister.cashWithdrawals + cashRegister.cashExpenses;

    return (
      <div className="space-y-6">
        {/* Si NO tiene base configurada - mostrar formulario */}
        {!cashRegister.hasOpeningSet && !cashRegister.is_closed && (
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

        {/* SALDO ACTUAL EN EFECTIVO - PROTAGONISTA */}
        <Card className="bg-gradient-to-br from-emerald-900/60 to-green-900/40 border border-emerald-500/30">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-emerald-300/80 text-sm font-medium mb-1">Saldo Actual en Caja (Efectivo)</p>
              <p className="text-5xl font-bold text-emerald-400">
                {canViewAmounts ? formatCurrency(cashRegister.currentCash) : '***'}
              </p>
              <p className="text-emerald-300/60 text-xs mt-2">
                Actualizado en tiempo real
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Desglose de movimientos */}
        <Card className="bg-gradient-to-r from-gray-800/50 to-slate-800/50 border border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-white">
                <Wallet className="h-5 w-5" />
                Desglose de Caja - {new Date().toLocaleDateString()}
              </CardTitle>
              <div className="flex items-center gap-2">
                {cashRegister.is_closed && (
                  <Badge variant="secondary">
                    <Lock className="h-3 w-3 mr-1" />
                    Cerrada
                  </Badge>
                )}
                {cashRegister.hasOpeningSet && !cashRegister.is_closed && isOwnerOrAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      editOpeningForm.setValue('new_opening', cashRegister.opening);
                      setShowEditOpeningDialog(true);
                    }}
                    className="text-yellow-400 border-yellow-400/50 hover:bg-yellow-400/10"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Editar base
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Fórmula clara */}
            <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-white/5">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Base inicial</span>
                  <span className="font-semibold text-white">{formatCurrency(cashRegister.opening)}</span>
                </div>
                <div className="flex justify-between items-center text-green-400">
                  <span className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Ventas en efectivo
                  </span>
                  <span className="font-semibold">+{formatCurrency(cashRegister.cashSales)}</span>
                </div>
                <div className="flex justify-between items-center text-green-400">
                  <span className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    Otros ingresos efectivo
                  </span>
                  <span className="font-semibold">+{formatCurrency(cashRegister.cashDeposits)}</span>
                </div>
                <div className="flex justify-between items-center text-red-400">
                  <span className="flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4" />
                    Retiros/Pagos efectivo
                  </span>
                  <span className="font-semibold">-{formatCurrency(cashRegister.cashWithdrawals)}</span>
                </div>
                <div className="flex justify-between items-center text-red-400">
                  <span className="flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4" />
                    Gastos en efectivo
                  </span>
                  <span className="font-semibold">-{formatCurrency(cashRegister.cashExpenses)}</span>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex justify-between items-center text-lg">
                  <span className="font-bold text-white">= Saldo actual efectivo</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(cashRegister.currentCash)}</span>
                </div>
              </div>
            </div>

            {/* Resumen rápido */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-700/30 rounded-lg border border-white/10">
                <p className="text-sm text-white/60">Base Inicial</p>
                <p className="text-xl font-bold text-white">{formatCurrency(cashRegister.opening)}</p>
              </div>
              <div className="text-center p-4 bg-green-900/30 rounded-lg border border-green-400/20">
                <p className="text-sm text-green-300/80">Entradas Efectivo</p>
                <p className="text-xl font-bold text-green-400">+{formatCurrency(totalEntradas)}</p>
              </div>
              <div className="text-center p-4 bg-red-900/30 rounded-lg border border-red-400/20">
                <p className="text-sm text-red-300/80">Salidas Efectivo</p>
                <p className="text-xl font-bold text-red-400">-{formatCurrency(totalSalidas)}</p>
              </div>
              <div className="text-center p-4 bg-purple-900/30 rounded-lg border border-purple-400/20">
                <p className="text-sm text-purple-300/80">Ventas Tarjeta/Transfer</p>
                <p className="text-xl font-bold text-purple-400">{formatCurrency(cashRegister.cardSales)}</p>
              </div>
            </div>
            
            <Separator className="my-4" />

            {/* Sección de propinas del día */}
            <TipPayoutsSection 
              cashRegisterId={cashRegister?.id} 
              onPayoutCompleted={loadCashData}
            />
            
            <Separator className="my-4" />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-900/30 rounded-lg border border-blue-400/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Banknote className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Efectivo Actual</span>
                </div>
                <p className="text-xl font-bold text-blue-400">
                  {canViewAmounts ? formatCurrency(cashRegister.currentCash) : '***'}
                </p>
              </div>
              <div className="text-center p-3 bg-purple-900/30 rounded-lg border border-purple-400/20">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">Ventas Digitales</span>
                </div>
                <p className="text-xl font-bold text-purple-400">
                  {canViewAmounts ? formatCurrency(cashRegister.cardSales) : '***'}
                </p>
              </div>
            </div>

            {/* Cerrar caja - Guided Flow */}
            {!cashRegister.is_closed && isOwnerOrAdmin && (
              <>
                <Separator className="my-6" />
                {showGuidedClose ? (
                  <GuidedCashClose
                    cashRegisterId={cashRegister.id || ''}
                    openingBalance={cashRegister.opening}
                    totalSales={cashRegister.cashSales}
                    totalExpenses={cashRegister.cashExpenses}
                    cashPayments={cashRegister.cashWithdrawals}
                    cashIncomes={cashRegister.cashDeposits}
                    onClose={() => setShowGuidedClose(false)}
                    onSuccess={() => {
                      setShowGuidedClose(false);
                      loadCashData();
                    }}
                  />
                ) : (
                  <Button 
                    onClick={() => setShowGuidedClose(true)}
                    className="w-full bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 hover:from-red-600 hover:via-pink-600 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    Cerrar Caja del Día
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialog para editar base inicial */}
        <AlertDialog open={showEditOpeningDialog} onOpenChange={setShowEditOpeningDialog}>
          <AlertDialogContent className="bg-gray-900 border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                Editar Base Inicial
              </AlertDialogTitle>
              <AlertDialogDescription className="text-white/70">
                Ya existe una base inicial de <strong className="text-white">{formatCurrency(cashRegister.opening)}</strong>. 
                Cambiarla quedará registrado para auditoría.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Form {...editOpeningForm}>
              <form onSubmit={editOpeningForm.handleSubmit(handleEditOpeningBalance)} className="space-y-4">
                <FormField
                  control={editOpeningForm.control}
                  name="new_opening"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Nueva base inicial</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="bg-gray-800 border-white/20 text-white"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editOpeningForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Razón del cambio (obligatorio)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ej: Error de digitación, faltó contar un sobre..."
                          className="bg-gray-800 border-white/20 text-white placeholder:text-white/40"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
                    Cancelar
                  </AlertDialogCancel>
                  <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700">
                    Guardar cambio
                  </Button>
                </AlertDialogFooter>
              </form>
            </Form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  const renderReceiptUpload = () => (
    <div className="space-y-6">
      <ReceiptProcessor onProcessComplete={handleReceiptProcessed} />

      {/* Transacciones recientes procesadas por IA */}
      <Card className="bg-gray-800/50 border border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Facturas Procesadas por IA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {processedReceipts.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay facturas procesadas aún</p>
                <p className="text-sm">Sube una factura arriba para comenzar</p>
              </div>
            ) : (
              processedReceipts.map(expense => (
                <div key={expense.id} className="border border-white/10 rounded-lg p-4 bg-gray-700/30">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white">{expense.supplier_name || 'Proveedor desconocido'}</h4>
                      <p className="text-sm text-white/60">
                        {new Date(expense.expense_date).toLocaleDateString()} • {formatCurrency(expense.total_amount)}
                      </p>
                      {expense.invoice_number && (
                        <p className="text-xs text-white/50">
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
                        <p className="text-sm font-medium mb-2 text-white">Productos detectados:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {expense.expense_items.map((item, idx) => (
                            <div key={idx} className="bg-gray-600/30 rounded p-2 text-sm border border-white/10">
                              <span className="font-medium text-white">{item.description}</span>
                              <span className="text-white/60 ml-2">
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
      <Card className="bg-gray-800/50 border border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <ArrowUpRight className="h-5 w-5" />
            Registrar Ingreso en Efectivo
          </CardTitle>
          <p className="text-sm text-white/60">
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
                      <FormLabel className="text-white">Monto</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          className="bg-gray-700/50 border-white/20 text-white placeholder:text-white/40"
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
                      <FormLabel className="text-white">Categoría</FormLabel>
                      <FormControl>
                        <select className="w-full p-2 border rounded bg-gray-700/50 border-white/20 text-white" {...field}>
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
                    <FormLabel className="text-white">Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe el ingreso..." className="bg-gray-700/50 border-white/20 text-white placeholder:text-white/40" {...field} />
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
      <Card className="bg-gray-800/50 border border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <Minus className="h-5 w-5" />
            Registrar Pago
          </CardTitle>
          <p className="text-sm text-white/60">
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
                      <FormLabel className="text-white">Monto</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          className="bg-gray-700/50 border-white/20 text-white placeholder:text-white/40"
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
                      <FormLabel className="text-white">Categoría</FormLabel>
                      <FormControl>
                        <select className="w-full p-2 border rounded bg-gray-700/50 border-white/20 text-white" {...field}>
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
                      <FormLabel className="text-white">Método de Pago</FormLabel>
                      <FormControl>
                        <select className="w-full p-2 border rounded bg-gray-700/50 border-white/20 text-white" {...field}>
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
                      <FormLabel className="text-white">Especificar método de pago</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Crypto, Efectivo USD, etc." className="bg-gray-700/50 border-white/20 text-white placeholder:text-white/40" {...field} />
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
                    <FormLabel className="text-white">Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe el pago..." className="bg-gray-700/50 border-white/20 text-white placeholder:text-white/40" {...field} />
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
      <Card className="bg-gray-800/50 border border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Receipt className="h-5 w-5" />
            Historial de Transacciones del Día
          </CardTitle>
          <p className="text-sm text-white/60">
            Registro tipo banco de todos los movimientos
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...cashIncomes.map(item => ({...item, type: 'income'})), 
              ...cashPayments.map(item => ({...item, type: 'expense'}))]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay transacciones registradas</p>
                <p className="text-sm">Los movimientos aparecerán aquí conforme los registres</p>
              </div>
            ) : (
              [...cashIncomes.map(item => ({...item, type: 'income'})), 
               ...cashPayments.map(item => ({...item, type: 'expense'}))]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((transaction, index) => (
                <div key={`${transaction.type}-${transaction.id}`} className="flex items-center justify-between p-4 border border-white/10 rounded-lg hover:bg-gray-700/30 transition-colors bg-gray-700/20">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-white/50 font-mono">
                      #{String(index + 1).padStart(3, '0')}
                    </div>
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-900/50' : 'bg-red-900/50'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-400" />
                      ) : (
                        <Minus className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{transaction.description}</p>
                      <div className="flex items-center gap-4 text-sm text-white/60">
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
                      transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4 rounded-2xl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          {onBack && (
            <Button 
              variant="outline" 
              onClick={onBack}
              className="group relative overflow-hidden rounded-full border-2 border-orange-500/50 bg-gradient-to-r from-gray-800/80 to-gray-900/80 text-white hover:border-orange-400 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
              <span className="relative z-10">Volver a Facturación</span>
            </Button>
          )}
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Gestión de Caja
            </h1>
            <p className="text-white/80 mt-2">
              Control total de ingresos, gastos e inventario con IA
            </p>
          </div>
          {onBack && <div className="w-[180px]" />} {/* Spacer para centrar el título */}
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
          <Card className="bg-gray-800/50 border border-white/10">
            <CardContent className="p-8 text-center">
              <Bot className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-white">Análisis IA en Desarrollo</h3>
              <p className="text-white/60">
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