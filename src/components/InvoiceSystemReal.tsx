import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText,
  Download,
  Mail,
  Search,
  Eye,
  Calendar,
  User,
  Phone,
  CheckCircle,
  Clock,
  Utensils,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import EmailTestPanel from './EmailTestPanel';
import InvoiceEditor from './InvoiceEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Sale {
  id: string;
  total_amount: number;
  payment_method: string;
  customer_email: string;
  table_number: number;
  created_at: string;
  status: string;
  user_id: string;
  sale_items: {
    id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product_id: string;
    products: {
      id: string;
      name: string;
      price: number;
    };
  }[];
}

const InvoiceSystemReal = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, profile, restaurant } = useAuth();

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    if (!profile?.restaurant_id) return;
    
    setLoading(true);
    try {
      // Check if user can see full customer emails
      const { data: canSeeEmails } = await supabase.rpc('can_see_customer_emails');
      
      // Get restaurant users
      const { data: restaurantUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('restaurant_id', profile.restaurant_id);

      const userIds = restaurantUsers?.map(u => u.id) || [];

      // Query sales data first
      const { data: salesData, error: salesError } = await supabase
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
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (salesError) throw salesError;

      // Apply email masking using the database function for each sale
      const processedSales = await Promise.all(
        (salesData || []).map(async (sale) => {
          const { data: maskedEmail } = await supabase
            .rpc('mask_customer_email', { email: sale.customer_email });
          
          return {
            ...sale,
            customer_email: maskedEmail || sale.customer_email
          };
        })
      );

      setSales(processedSales);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendEmail = async (sale: Sale) => {
    console.log("🚀 BUTTON CLICKED - Starting email send process for sale:", sale.id);
    console.log("📧 Customer email:", sale.customer_email);
    console.log("👤 User role:", profile?.role);
    console.log("🏪 Restaurant:", restaurant?.name);
    
    if (!sale.customer_email) {
      console.error("❌ No customer email for sale:", sale.id);
      toast({
        title: "❌ Error",
        description: "Esta venta no tiene email del cliente",
        variant: "destructive"
      });
      return;
    }

    // Check if customer email is masked (user doesn't have permission to see real emails)
    if (sale.customer_email.includes('***@')) {
      console.error("🔒 User doesn't have permission to see full email:", sale.customer_email);
      toast({
        title: "🔒 Sin permisos",
        description: "No tienes permisos para enviar emails a este cliente",
        variant: "destructive"
      });
      return;
    }

    console.log("✅ Email validation passed, preparing invoice data...");
    setLoading(true);
    
    // Show immediate feedback to user
    toast({
      title: "📤 Enviando factura...",
      description: "Preparando email con los datos de la factura",
    });
    
    try {
      // Prepare invoice data for email
      const invoiceData = {
        customerEmail: sale.customer_email,
        customerName: sale.customer_email.split('@')[0], // Use email prefix as name if no name available
        restaurantName: restaurant?.name || "Mi Restaurante",
        invoiceNumber: sale.id.slice(0, 8),
        date: formatDate(sale.created_at),
        time: formatTime(sale.created_at),
        items: sale.sale_items.map(item => ({
          name: item.products.name,
          quantity: item.quantity,
          price: item.unit_price,
          total: item.subtotal
        })),
        subtotal: calculateSubtotal(sale),
        service: 0, // No servicio para negocios de comida
        tax: 0, // Solo impoconsumo, se calcula en el backend
        total: sale.total_amount,
        paymentMethod: sale.payment_method
      };

      console.log("📝 Invoice data prepared:", {
        customerEmail: invoiceData.customerEmail,
        restaurantName: invoiceData.restaurantName,
        invoiceNumber: invoiceData.invoiceNumber,
        itemsCount: invoiceData.items.length,
        total: invoiceData.total
      });

      console.log("🌐 About to call send-invoice edge function...");
      console.log("📨 Full invoice data being sent:", JSON.stringify(invoiceData, null, 2));
      
      // Call the edge function to send email
      const { data, error } = await supabase.functions.invoke('send-invoice', {
        body: invoiceData
      });

      console.log("📨 Edge function response received:");
      console.log("✅ Data:", data);
      console.log("❌ Error:", error);

      if (error) {
        console.error("❌ Supabase function error:", error);
        throw new Error(`Function error: ${error.message}`);
      }

      if (data?.success) {
        console.log("🎉 Email sent successfully! Response:", data);
        toast({
          title: "✨ ¡Factura enviada!",
          description: `Factura digital enviada exitosamente a ${sale.customer_email}`,
        });
      } else {
        console.error("❌ Function returned error:", data);
        throw new Error(data?.error || 'Error desconocido al enviar email');
      }
    } catch (error: any) {
      console.error("💥 CRITICAL ERROR sending invoice email:");
      console.error("Error message:", error.message);
      console.error("Error details:", error);
      console.error("Error stack:", error.stack);
      
      toast({
        title: "❌ Error al enviar",
        description: `No se pudo enviar la factura: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      console.log("🏁 Email send process completed, setting loading to false");
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (sale: Sale) => {
    // Aquí implementarías la descarga del PDF
    toast({
      title: "📥 Descargando factura",
      description: `Factura ${sale.id.slice(0, 8)} descargada como PDF`,
    });
  };

  const calculateSubtotal = (sale: Sale) => {
    return sale.sale_items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calculateImpoconsumo = (sale: Sale) => {
    const subtotal = calculateSubtotal(sale);
    return Math.round(subtotal * 0.08); // 8% impoconsumo
  };

  const filteredSales = sales.filter(sale => 
    sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.table_number?.toString().includes(searchTerm)
  );

  const InvoicePreview = ({ sale }: { sale: Sale }) => (
    <div className="max-w-2xl mx-auto bg-white text-foreground">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10"></div>
        <div className="relative p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mr-4">
              <Utensils className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-primary">CONEKTAO</h1>
              <p className="text-sm text-muted-foreground">Sistema Digital</p>
            </div>
          </div>
        </div>
      </div>

      {/* Información de la Factura */}
      <div className="p-8">
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h2 className="text-xl font-bold mb-4 text-primary">Factura Electrónica</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-semibold">#{sale.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{formatDate(sale.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{formatTime(sale.created_at)}</span>
              </div>
              {sale.table_number && (
                <div className="flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-primary" />
                  <span>Mesa {sale.table_number}</span>
                </div>
              )}
            </div>
          </div>
          
          {sale.customer_email && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-secondary">Cliente</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-secondary" />
                  <span>{sale.customer_email}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Productos */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            Productos
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {sale.sale_items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex-1">
                  <p className="font-medium">{item.products.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.unit_price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{formatCurrency(item.subtotal)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totales */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(calculateSubtotal(sale))}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Impoconsumo (8%)</span>
              <span>{formatCurrency(calculateImpoconsumo(sale))}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(calculateSubtotal(sale) + calculateImpoconsumo(sale))}</span>
            </div>
          </div>
        </div>

        {/* Método de Pago */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Pagado con {sale.payment_method}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>Bogotá, Colombia</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <span>+57 1 234 5678</span>
            </div>
          </div>
          <p className="mb-2">¡Gracias por elegir Conektao!</p>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium">Facturación Digital</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Sistema de Facturación</h2>
          <p className="text-muted-foreground mt-2">Gestiona las facturas de ventas reales</p>
        </div>
        <Button onClick={loadSales} variant="outline">
          Actualizar
        </Button>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Facturas
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Testing Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6 mt-6">
          {/* DEBUG TESTING SECTION */}
          {sales.length > 0 && (
            <Card className="border-2 border-blue-500 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  🧪 Panel de Testing Email
                  <Badge variant="secondary">DEBUG</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-blue-600">
                    Prueba rápida: haz clic en el botón de abajo para enviar un email de la última venta
                  </p>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => {
                        const lastSale = sales.find(s => s.customer_email && !s.customer_email.includes('***@'));
                        if (lastSale) {
                          console.log("🧪 TESTING BUTTON CLICKED!");
                          console.log("📋 Selected sale for testing:", lastSale);
                          handleSendEmail(lastSale);
                        } else {
                          toast({
                            title: "❌ Sin ventas válidas",
                            description: "No hay ventas con email válido para testing",
                            variant: "destructive"
                          });
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      size="lg"
                    >
                      🚀 TEST ENVÍO EMAIL AHORA
                    </Button>
                    <div className="text-sm text-muted-foreground self-center">
                      Total ventas cargadas: {sales.length} | Con email: {sales.filter(s => s.customer_email).length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Facturas</p>
                  <p className="text-2xl font-bold">{sales.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <User className="h-8 w-8 text-secondary" />
                <div>
                  <p className="text-sm text-muted-foreground">Ventas con Email</p>
                  <p className="text-2xl font-bold">
                    {sales.filter(s => s.customer_email).length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Ventas Completadas</p>
                  <p className="text-2xl font-bold">
                    {sales.filter(s => s.status === 'completed').length}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search */}
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por ID, email o mesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {/* Sales Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Facturas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Cargando facturas...</div>
              ) : filteredSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay facturas para mostrar
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Factura</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Mesa</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">
                          #{sale.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          {sale.customer_email || 'Sin email'}
                        </TableCell>
                        <TableCell>
                          {sale.table_number ? `Mesa ${sale.table_number}` : '-'}
                        </TableCell>
                        <TableCell>
                          {formatDate(sale.created_at)}
                        </TableCell>
                        <TableCell className="font-bold text-primary">
                          {formatCurrency(sale.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            sale.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }>
                            {sale.status === 'completed' ? 'Completado' : sale.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedSale(sale);
                                setIsPreviewOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedSale(sale);
                                setIsEditorOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSendEmail(sale)}
                              disabled={loading}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Email
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadInvoice(sale)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="mt-6">
          <EmailTestPanel />
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista Previa de Factura</DialogTitle>
          </DialogHeader>
          {selectedSale && <InvoicePreview sale={selectedSale} />}
        </DialogContent>
      </Dialog>

      {/* Invoice Editor */}
      <InvoiceEditor
        sale={selectedSale}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedSale(null);
        }}
        onSaleUpdated={() => {
          loadSales();
          setIsEditorOpen(false);
          setSelectedSale(null);
        }}
      />
    </div>
  );
};

export default InvoiceSystemReal;