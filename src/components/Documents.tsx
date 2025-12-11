import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DailySalesView from './DailySalesView';
import InvoiceEditor from './InvoiceEditor';
import AuditorIA from './AuditorIA';
import { 
  FileText,
  TrendingUp,
  Calendar,
  Download,
  Eye,
  Brain,
  Sparkles,
  BarChart3,
  DollarSign,
  AlertTriangle,
  Utensils,
  CheckCircle,
  Clock,
  RefreshCw,
  Zap,
  Target,
  Award,
  Activity,
  Edit3,
  Trash2,
  Receipt,
  CreditCard,
  Calculator,
  Camera,
  Smartphone,
  Shield
} from 'lucide-react';

interface BusinessDocument {
  id: string;
  document_type: string;
  document_date: string;
  title: string;
  content: any;
  ai_analysis: any;
  metadata: any;
  created_at: string;
}

const Documents = () => {
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<BusinessDocument | null>(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [showDailySales, setShowDailySales] = useState(false);
  const [todaySalesCount, setTodaySalesCount] = useState<number | null>(null);
  const [showTransferPhotos, setShowTransferPhotos] = useState(false);
  const [transferPhotos, setTransferPhotos] = useState<any[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [showAuditorIA, setShowAuditorIA] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorSale, setEditorSale] = useState<any>(null);
  const [editorLoading, setEditorLoading] = useState(false);

  // Check if user has audit permissions
  const hasAuditPermission = 
    profile?.role === 'owner' || 
    profile?.role === 'admin' || 
    (profile?.permissions as any)?.view_audit_ia;

  const localToday = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  useEffect(() => {
    loadDocuments();
    loadTodaySalesCount();
    loadTransferPhotos();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      // Only load monthly summary documents (not individual sales)
      const { data: docs, error: docsError } = await supabase
        .from('business_documents')
        .select('*')
        .eq('document_type', 'monthly_invoice_summary')
        .order('document_date', { ascending: false });

      if (docsError) throw docsError;

      // Format monthly summary documents
      const monthlyDocuments = (docs || []).map(doc => {
        const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;
        const content = typeof doc.content === 'string' ? JSON.parse(doc.content) : doc.content;
        
        return {
          ...doc,
          metadata,
          content,
          document_type: 'monthly_summary'
        };
      });

      setDocuments(monthlyDocuments);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTodaySalesCount = async () => {
    try {
      const { count, error } = await supabase
        .from('sales')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${localToday}T00:00:00`)
        .lt('created_at', `${localToday}T23:59:59`);

      if (error) throw error;
      setTodaySalesCount(count ?? 0);
    } catch (err) {
      console.error('Error loading today sales count:', err);
      setTodaySalesCount(0);
    }
  };

  const generateDailySummary = async () => {
    setGeneratingAnalysis(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Obtener datos del día
      const [salesResult, expensesResult, productsResult] = await Promise.all([
        supabase
          .from('sales')
          .select(`
            *,
            sale_items(
              *,
              products(name, price, cost_price)
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
          .eq('is_active', true)
      ]);

      const analysisData = {
        sales: salesResult.data || [],
        expenses: expensesResult.data || [],
        products: productsResult.data || [],
        date: today,
        type: 'daily_summary' as const
      };

      // Llamar al edge function para análisis de IA
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('business-analysis', {
        body: { data: analysisData }
      });

      if (aiError) throw aiError;

      // Obtener el perfil del usuario para el restaurant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.restaurant_id) {
        throw new Error('Restaurant ID not found');
      }

      // Guardar el documento
      const { error: saveError } = await supabase
        .from('business_documents')
        .insert({
          restaurant_id: profile.restaurant_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          document_type: 'daily_summary',
          document_date: today,
          title: `Resumen Diario - ${new Date(today).toLocaleDateString('es-ES')}`,
          content: analysisData,
          ai_analysis: aiResult.analysis,
          metadata: {
            total_sales: analysisData.sales.length,
            total_expenses: analysisData.expenses.length,
            generated_by: 'ai_assistant'
          }
        });

      if (saveError) throw saveError;

      toast({
        title: "✅ Análisis Generado",
        description: "El resumen diario se ha creado exitosamente"
      });

      loadDocuments();
    } catch (error: any) {
      console.error('Error generating analysis:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el análisis",
        variant: "destructive"
      });
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const loadTransferPhotos = async () => {
    if (!profile?.restaurant_id) return;
    
    try {
      setTransferLoading(true);
      
      // Get transfer photos from storage
      const { data: files, error } = await supabase.storage
        .from('transfer-photos')
        .list(`${profile.id}`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      // Group photos by date
      const photosByDate = files?.reduce((acc: any, file) => {
        const date = new Date(file.created_at).toISOString().slice(0, 10);
        if (!acc[date]) acc[date] = [];
        
        const photoUrl = supabase.storage
          .from('transfer-photos')
          .getPublicUrl(`${profile.id}/${file.name}`).data.publicUrl;
          
        acc[date].push({
          ...file,
          url: photoUrl,
          date
        });
        return acc;
      }, {}) || {};

      setTransferPhotos(Object.entries(photosByDate).map(([date, photos]) => ({
        date,
        photos,
        count: (photos as any[]).length
      })));
      
    } catch (error: any) {
      console.error('Error loading transfer photos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las fotos de transferencias",
        variant: "destructive"
      });
    } finally {
      setTransferLoading(false);
    }
  };

  // Generar resumen de cierre de caja de ayer
  const generateYesterdayClosingReport = async () => {
    setGeneratingAnalysis(true);
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Obtener perfil primero
      const { data: profile } = await supabase
        .from('profiles')
        .select('restaurant_id, id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.restaurant_id) {
        throw new Error('Restaurant ID not found');
      }

      // Obtener ventas de ayer
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          payment_method,
          customer_email,
          table_number,
          created_at,
          sale_items!inner(
            id,
            quantity,
            unit_price,
            subtotal,
            products(name, price)
          )
        `)
        .gte('created_at', `${yesterdayStr}T00:00:00`)
        .lt('created_at', `${yesterdayStr}T23:59:59`)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      // Obtener caja de ayer
      const { data: cashRegister } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('date', yesterdayStr)
        .eq('restaurant_id', profile.restaurant_id)
        .maybeSingle();

      // Calcular estadísticas
      const totalSales = sales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const totalOrders = sales?.length || 0;
      const cashSales = sales?.filter(s => s.payment_method === 'efectivo').reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const cardSales = sales?.filter(s => s.payment_method === 'tarjeta').reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

      // Productos más vendidos
      const productSales = new Map();
      sales?.forEach(sale => {
        sale.sale_items.forEach(item => {
          if (item.products) {
            const key = item.products.name;
            const current = productSales.get(key) || { quantity: 0, revenue: 0 };
            productSales.set(key, {
              quantity: current.quantity + item.quantity,
              revenue: current.revenue + Number(item.subtotal)
            });
          }
        });
      });

      const topProducts = Array.from(productSales.entries())
        .sort((a, b) => b[1].quantity - a[1].quantity)
        .slice(0, 5);

      const closingData = {
        date: yesterdayStr,
        sales_summary: {
          total_revenue: totalSales,
          total_orders: totalOrders,
          average_ticket: totalOrders > 0 ? totalSales / totalOrders : 0,
          payment_methods: {
            cash: cashSales,
            card: cardSales
          }
        },
        cash_register: cashRegister ? {
          opening_balance: Number(cashRegister.opening_balance),
          final_cash: Number(cashRegister.final_cash || 0),
          cash_difference: Number(cashRegister.cash_difference || 0),
          is_closed: cashRegister.is_closed
        } : null,
        top_products: topProducts.map(([name, data]) => ({
          name,
          quantity_sold: data.quantity,
          revenue: data.revenue
        })),
        orders_by_time: sales?.map(sale => ({
          time: new Date(sale.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          amount: Number(sale.total_amount),
          payment_method: sale.payment_method,
          table: sale.table_number
        })) || []
      };

      // Guardar el documento de cierre
      const { error: saveError } = await supabase
        .from('business_documents')
        .insert({
          restaurant_id: profile.restaurant_id,
          user_id: profile.id,
          document_type: 'daily_summary',
          document_date: yesterdayStr,
          title: `Cierre de Caja - ${yesterday.toLocaleDateString('es-ES')}`,
          content: closingData,
          metadata: {
            auto_generated: true,
            source: 'manual_generation',
            total_sales: totalSales,
            total_orders: totalOrders,
            has_cash_register: !!cashRegister
          },
          is_confidential: true
        });

      if (saveError) throw saveError;

      await loadDocuments();
      
      toast({
        title: "📋 Cierre de Ayer Archivado",
        description: `${totalOrders} órdenes • ${totalSales.toLocaleString('es-ES', { style: 'currency', currency: 'COP' })} en ventas`
      });

    } catch (error) {
      console.error('Error generating yesterday report:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el cierre de ayer",
        variant: "destructive"
      });
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  const openInvoiceEditor = async () => {
    if (!selectedDocument?.content?.sale_id) return;
    try {
      setEditorLoading(true);
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          payment_method,
          customer_email,
          table_number,
          created_at,
          status,
          user_id,
          sale_items(
            id,
            quantity,
            unit_price,
            subtotal,
            product_id,
            products(id, name, price)
          )
        `)
        .eq('id', selectedDocument.content.sale_id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Factura no encontrada');

      setEditorSale(data as any);
      setIsEditorOpen(true);
    } catch (err: any) {
      console.error('Error loading sale for editor:', err);
      toast({
        title: 'Error',
        description: err.message || 'No se pudo abrir el editor de factura',
        variant: 'destructive',
      });
    } finally {
      setEditorLoading(false);
    }
  };
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'daily_summary': return <BarChart3 className="h-5 w-5" />;
      case 'sales_analysis': return <TrendingUp className="h-5 w-5" />;
      case 'expense_report': return <DollarSign className="h-5 w-5" />;
      case 'invoice': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getDocumentColor = (type: string) => {
    switch (type) {
      case 'daily_summary': return 'from-blue-500 to-purple-600';
      case 'sales_analysis': return 'from-green-500 to-emerald-600';
      case 'expense_report': return 'from-red-500 to-pink-600';
      case 'invoice': return 'from-orange-500 to-yellow-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const DocumentCard = ({ doc }: { doc: BusinessDocument }) => (
    <Card className="group relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer">
      {/* Gradiente animado de fondo */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getDocumentColor(doc.document_type)} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
      
      {/* Efecto shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      <div className="relative p-6">
        {/* Header con icono */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${getDocumentColor(doc.document_type)} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            {getDocumentIcon(doc.document_type)}
          </div>
          <Badge variant={doc.ai_analysis ? "default" : "secondary"} className="px-3 py-1">
            {doc.ai_analysis ? (
              <><Brain className="h-3 w-3 mr-1" /> IA Analizado</>
            ) : (
              <><Clock className="h-3 w-3 mr-1" /> Pendiente</>
            )}
          </Badge>
        </div>

        {/* Título y fecha */}
        <h3 className="font-bold text-lg mb-2 text-secondary group-hover:text-primary transition-colors duration-300">
          {doc.title}
        </h3>
        <p className="text-muted-foreground mb-4 flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          {formatDate(doc.document_date)}
        </p>

        {/* Métricas rápidas */}
        {doc.content?.sales && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Ventas</div>
              <div className="text-lg font-bold text-green-700">{doc.content.sales.length}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Productos</div>
              <div className="text-lg font-bold text-blue-700">{doc.content.products?.length || 0}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <Button 
            onClick={() => setSelectedDocument(doc)}
            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Análisis
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  if (showAuditorIA) {
    return <AuditorIA onClose={() => setShowAuditorIA(false)} />;
  }

  if (showDailySales) {
    return <DailySalesView onClose={() => setShowDailySales(false)} />;
  }

  if (showTransferPhotos) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowTransferPhotos(false)}
              className="flex items-center gap-2"
            >
              ←
            </Button>
            <Camera className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Fotos de Transferencias</h1>
          </div>
          <Button
            onClick={loadTransferPhotos}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>

        {transferLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>Cargando fotos...</p>
          </div>
        ) : transferPhotos.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay fotos de transferencias</h3>
            <p className="text-gray-500">Las fotos aparecerán aquí cuando proceses pagos por transferencia</p>
          </div>
        ) : (
          <div className="space-y-6">
            {transferPhotos.map((dayGroup, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-lg">
                    {new Date(dayGroup.date).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <Badge variant="secondary">{dayGroup.count} fotos</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {dayGroup.photos.map((photo: any, photoIndex: number) => (
                    <div key={photoIndex} className="relative group">
                      <img
                        src={photo.url}
                        alt={`Transferencia ${photo.name}`}
                        className="w-full h-32 object-cover rounded-lg border hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => window.open(photo.url, '_blank')}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {new Date(photo.created_at).toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      {/* Header Hero */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-secondary to-primary/80 p-8 text-white shadow-2xl">
        {/* Efectos de fondo */}
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-white/10 blur-xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3 flex items-center">
                <Sparkles className="h-10 w-10 mr-4 animate-pulse" />
                Centro de Documentos Inteligente
              </h1>
              <p className="text-xl opacity-90 mb-6 max-w-2xl">
                Análisis automático con IA • Reportes en tiempo real • Insights empresariales
              </p>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  {documents.length} Documentos
                </div>
                <div className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  {documents.filter(d => d.ai_analysis).length} Analizados por IA
                </div>
                <div className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Sistema Activo
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={generateDailySummary}
                disabled={generatingAnalysis}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm px-6 py-3"
              >
                {generatingAnalysis ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Resumen de Hoy
                  </>
                )}
              </Button>
              
              <Button 
                onClick={generateYesterdayClosingReport}
                disabled={generatingAnalysis}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm px-6 py-3"
              >
                {generatingAnalysis ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Cierre de Ayer
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 h-20 w-20 bg-white/10 rounded-bl-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <Award className="h-8 w-8" />
              <Badge className="bg-white/20 text-white">+15%</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{documents.filter(d => d.document_type === 'daily_summary').length}</div>
            <div className="text-sm opacity-90">Cierres de Caja</div>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 h-20 w-20 bg-white/10 rounded-bl-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="h-8 w-8" />
              <Badge className="bg-white/20 text-white">IA</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{documents.filter(d => d.document_type === 'sales_analysis').length}</div>
            <div className="text-sm opacity-90">Análisis de Ventas</div>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 h-20 w-20 bg-white/10 rounded-bl-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="h-8 w-8" />
              <Badge className="bg-white/20 text-white">Auto</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">{documents.filter(d => d.document_type === 'expense_report').length}</div>
            <div className="text-sm opacity-90">Reportes de Gastos</div>
          </div>
        </Card>

        <Card 
          className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 p-6 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
          onClick={() => setShowDailySales(true)}
        >
          <div className="absolute top-0 right-0 h-20 w-20 bg-white/10 rounded-bl-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <FileText className="h-8 w-8" />
              <Badge className="bg-white/20 text-white">Real Time</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">
              {todaySalesCount && todaySalesCount > 0 ? todaySalesCount : '-'}
            </div>
            <div className="text-sm opacity-90">Facturas de Hoy</div>
          </div>
        </Card>

        <Card 
          className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-cyan-600 p-6 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
          onClick={() => setShowTransferPhotos(true)}
        >
          <div className="absolute top-0 right-0 h-20 w-20 bg-white/10 rounded-bl-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <Camera className="h-8 w-8" />
              <Badge className="bg-white/20 text-white">Storage</Badge>
            </div>
            <div className="text-3xl font-bold mb-1">
              {transferPhotos.reduce((acc, day) => acc + day.count, 0) || '-'}
            </div>
            <div className="text-sm opacity-90">Fotos Transferencias</div>
          </div>
        </Card>

        {/* auditorIA Card - Only show if user has permission */}
        {hasAuditPermission && (
          <Card 
            className="relative overflow-hidden bg-gradient-to-br from-cyan-500 via-teal-500 to-orange-500 p-6 text-white border-0 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 cursor-pointer col-span-1 md:col-span-2 lg:col-span-1"
            onClick={() => setShowAuditorIA(true)}
          >
            <div className="absolute top-0 right-0 h-20 w-20 bg-white/10 rounded-bl-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <Eye className="h-8 w-8" />
                <Badge className="bg-white/20 text-white border border-white/30">Hunter</Badge>
              </div>
              <div className="text-2xl font-bold mb-1">
                <span className="text-white">auditor</span>
                <span className="bg-gradient-to-r from-cyan-200 to-orange-200 bg-clip-text text-transparent">IA</span>
              </div>
              <div className="text-sm opacity-90">Auditoría del negocio</div>
            </div>
          </Card>
        )}
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-4" />
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </Card>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No hay documentos aún</h3>
          <p className="text-muted-foreground mb-6">
            Comienza generando tu primer resumen diario con análisis de IA
          </p>
          <Button 
            onClick={generateDailySummary}
            disabled={generatingAnalysis}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            <Zap className="h-4 w-4 mr-2" />
            Generar Primer Análisis
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map(doc => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-secondary">{selectedDocument.title}</h2>
                <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                  Cerrar
                </Button>
              </div>

              {selectedDocument.document_type === 'invoice' ? (
                <div className="space-y-6">
                  {/* Invoice Header with Enhanced Design */}
                  <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-l-4 border-l-primary">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Receipt className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="text-xl font-bold text-primary">Factura #</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedDocument.content?.timestamp || selectedDocument.created_at).toLocaleDateString('es-CO', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-sm">
                        {selectedDocument.content?.payment_method || 'N/A'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(selectedDocument.content?.timestamp || selectedDocument.created_at).toLocaleTimeString('es-CO')}</span>
                      </div>
                      {selectedDocument.content?.table_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Utensils className="h-4 w-4 text-muted-foreground" />
                          <span>Mesa {selectedDocument.content.table_number}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">Pagado</span>
                      </div>
                    </div>
                  </Card>

                  {/* Items Section with Visual Invoice Design */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Detalle de Productos
                    </h3>
                    <div className="space-y-3">
                      {(selectedDocument.content?.items || []).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} × {new Intl.NumberFormat('es-CO', { 
                                style: 'currency', 
                                currency: 'COP', 
                                minimumFractionDigits: 0 
                              }).format(Number(item.unit_price) || 0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              {new Intl.NumberFormat('es-CO', { 
                                style: 'currency', 
                                currency: 'COP', 
                                minimumFractionDigits: 0 
                              }).format(Number(item.subtotal) || 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {(!selectedDocument.content?.items || selectedDocument.content.items.length === 0) && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Sin productos para mostrar</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Invoice Summary */}
                  <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/10">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-primary" />
                      Resumen de Factura
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-lg">
                        <span>Subtotal</span>
                        <span className="font-semibold">
                          {new Intl.NumberFormat('es-CO', { 
                            style: 'currency', 
                            currency: 'COP', 
                            minimumFractionDigits: 0 
                          }).format(
                            (selectedDocument.content?.items || []).reduce((s: number, it: any) => s + (Number(it.subtotal) || 0), 0)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Impoconsumo (8%)</span>
                        <span>
                          {new Intl.NumberFormat('es-CO', { 
                            style: 'currency', 
                            currency: 'COP', 
                            minimumFractionDigits: 0 
                          }).format(
                            Math.round(((selectedDocument.content?.items || []).reduce((s: number, it: any) => s + (Number(it.subtotal) || 0), 0)) * 0.08)
                          )}
                        </span>
                      </div>
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-2xl font-bold">
                          <span>Total</span>
                          <span className="text-primary">
                            {new Intl.NumberFormat('es-CO', { 
                              style: 'currency', 
                              currency: 'COP', 
                              minimumFractionDigits: 0 
                            }).format(Number(selectedDocument.content?.total) || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3">
                      {profile?.role === 'owner' ? (
                        <Button 
                          onClick={() => {
                            console.log('Profile role:', profile?.role, 'Is owner:', profile?.role === 'owner');
                            openInvoiceEditor();
                          }} 
                          disabled={editorLoading}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          {editorLoading ? 'Abriendo Editor...' : 'Editar Factura'}
                        </Button>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Solo propietarios pueden editar facturas (Tu rol: {profile?.role || 'Desconocido'})
                        </div>
                      )}
                    </div>
                    <Button variant="outline" onClick={() => setSelectedDocument(null)}>
                      Cerrar
                    </Button>
                  </div>
                </div>
              ) : selectedDocument.ai_analysis ? (
                <div className="space-y-6">
                  {/* Resumen Ejecutivo */}
                  {selectedDocument.ai_analysis.resumen_ejecutivo && (
                    <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-primary">
                      <h3 className="font-semibold text-lg mb-2 flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-primary" />
                        Resumen Ejecutivo
                      </h3>
                      <p className="text-muted-foreground">{selectedDocument.ai_analysis.resumen_ejecutivo}</p>
                    </Card>
                  )}

                  {/* Productos Top */}
                  {selectedDocument.ai_analysis.productos_top && (
                    <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500">
                      <h3 className="font-semibold text-lg mb-2 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                        Productos Destacados
                      </h3>
                      <ul className="space-y-2">
                        {selectedDocument.ai_analysis.productos_top.map((producto: string, i: number) => (
                          <li key={i} className="flex items-center">
                            <Award className="h-4 w-4 mr-2 text-green-600" />
                            {producto}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Productos Bajo Rendimiento */}
                  {selectedDocument.ai_analysis.productos_bajo_rendimiento && (
                    <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-l-yellow-500">
                      <h3 className="font-semibold text-lg mb-2 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                        Productos a Mejorar
                      </h3>
                      <ul className="space-y-2">
                        {selectedDocument.ai_analysis.productos_bajo_rendimiento.map((producto: string, i: number) => (
                          <li key={i} className="flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                            {producto}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  {/* Recomendaciones */}
                  {selectedDocument.ai_analysis.recomendaciones && (
                    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-l-purple-500">
                      <h3 className="font-semibold text-lg mb-2 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-purple-600" />
                        Recomendaciones
                      </h3>
                      <ul className="space-y-2">
                        {selectedDocument.ai_analysis.recomendaciones.map((rec: string, i: number) => (
                          <li key={i} className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-purple-600" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Sin contenido para mostrar.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Invoice Editor Modal */}
      <InvoiceEditor
        sale={editorSale}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditorSale(null);
        }}
        onSaleUpdated={() => {
          setIsEditorOpen(false);
          setEditorSale(null);
          setSelectedDocument(null);
          loadDocuments();
          loadTodaySalesCount();
          toast({
            title: "✅ Factura Actualizada",
            description: "Los cambios se han guardado correctamente"
          });
        }}
      />
    </div>
  );
};

export default Documents;