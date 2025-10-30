import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText,
  Download,
  Mail,
  Search,
  Eye,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  Send,
  Printer,
  Share2,
  Star,
  QrCode,
  Sparkles,
  Heart,
  Shield,
  Leaf,
  Utensils,
  Coffee
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvoiceSystemProps {
  userData?: any;
}

const InvoiceSystem = ({ userData }: InvoiceSystemProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const { toast } = useToast();

  // Generar facturas dinámicamente desde los datos del usuario
  const generateSampleInvoices = () => {
    if (!userData?.products || userData.products.length === 0) {
      // Facturas por defecto si no hay datos del usuario
      return [
        {
          id: 'INV-2024-001',
          tableNumber: 1,
          date: new Date().toISOString().split('T')[0],
          time: '12:30',
          customer: {
            name: 'Cliente General',
            email: 'cliente@ejemplo.com',
            phone: '+57 300 000 0000'
          },
          waiter: 'Mesero',
          items: [
            { name: 'Producto General', quantity: 1, price: 10000, total: 10000 }
          ],
          subtotal: 10000,
          service: 800,
          total: 10800,
          paymentMethod: 'Efectivo',
          status: 'Pagado',
          emailSent: false
        }
      ];
    }

    // Crear facturas de ejemplo usando los productos del usuario
    const sampleCustomers = [
      { name: 'María González', email: 'maria@email.com', phone: '+57 300 111 1111' },
      { name: 'Carlos Mendoza', email: 'carlos@email.com', phone: '+57 300 222 2222' },
      { name: 'Ana Rodríguez', email: 'ana@email.com', phone: '+57 300 333 3333' }
    ];

    const waiters = ['Mesero 1', 'Mesero 2', 'Mesero 3'];
    const paymentMethods = ['Efectivo', 'Tarjeta de Crédito', 'Transferencia', 'Daviplata'];

    return sampleCustomers.map((customer, index) => {
      // Seleccionar productos aleatorios del usuario
      const randomProducts = userData.products
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1) // 1-3 productos
        .map((product: any, pIndex: number) => {
          const quantity = Math.floor(Math.random() * 3) + 1;
          return {
            name: product.name,
            quantity: quantity,
            price: product.price,
            total: product.price * quantity
          };
        });

      const subtotal = randomProducts.reduce((sum, item) => sum + item.total, 0);
      const service = Math.floor(subtotal * 0.08);
      const total = subtotal + service;

      return {
        id: `INV-${userData.companyName?.slice(0,3).toUpperCase() || 'BIZ'}-${String(index + 1).padStart(3, '0')}`,
        tableNumber: index + 1,
        date: new Date().toISOString().split('T')[0],
        time: `${12 + index}:${30 + (index * 15)}`,
        customer: customer,
        waiter: waiters[index % waiters.length],
        items: randomProducts,
        subtotal: subtotal,
        service: service,
        total: total,
        paymentMethod: paymentMethods[index % paymentMethods.length],
        status: 'Pagado',
        emailSent: Math.random() > 0.5
      };
    });
  };

  const invoices = generateSampleInvoices();

  const filteredInvoices = invoices.filter(invoice => 
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.tableNumber.toString().includes(searchTerm)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSendEmail = (invoice: any) => {
    toast({
      title: "📧 Factura enviada",
      description: `Factura ${invoice.id} enviada a ${invoice.customer.email}`,
    });
  };

  const handleDownloadInvoice = (invoice: any) => {
    toast({
      title: "📥 Descargando factura",
      description: `Factura ${invoice.id} descargada como PDF`,
    });
  };

  const InvoicePreview = ({ invoice }: { invoice: any }) => (
    <div className="max-w-2xl mx-auto bg-white text-foreground">
      {/* Header Revolucionario */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="relative p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mr-4">
              <Utensils className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                CONEKTAO
              </h1>
              <p className="text-sm text-muted-foreground">Pizzería Revolucionaria</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge className="bg-gradient-primary text-white">
              <Leaf className="h-3 w-3 mr-1" />
              100% Digital
            </Badge>
            <Badge className="bg-gradient-secondary text-white">
              <Shield className="h-3 w-3 mr-1" />
              Cero Papel
            </Badge>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <Heart className="h-3 w-3 mr-1" />
              Eco-Friendly
            </Badge>
          </div>
        </div>
      </div>

      {/* Información de la Factura */}
      <div className="p-8 bg-gradient-card">
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h2 className="text-xl font-bold mb-4 text-primary">Factura Electrónica</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-semibold">#{invoice.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{invoice.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{invoice.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <Utensils className="h-4 w-4 text-primary" />
                <span>Mesa {invoice.tableNumber}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-secondary">Cliente</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-secondary" />
                <span>{invoice.customer.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-secondary" />
                <span>{invoice.customer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-secondary" />
                <span>{invoice.customer.phone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Coffee className="h-5 w-5 text-primary" />
            Productos Ordenados
          </h3>
          <div className="bg-white/50 rounded-lg p-4 space-y-3">
            {invoice.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{formatCurrency(item.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totales */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Servicio voluntario (8%)</span>
              <span>{formatCurrency(invoice.service)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Método de Pago */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Pagado con {invoice.paymentMethod}</span>
          </div>
        </div>

        {/* Información del Restaurante */}
        <div className="border-t pt-6 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>Calle 123 #45-67, Bogotá</span>
            </div>
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <span>+57 1 234 5678</span>
            </div>
          </div>
          <p className="mb-2">¡Gracias por ser parte de la revolución digital!</p>
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium">Facturación 100% Digital - Cero Papel</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
        </div>

        {/* QR Code Simulado */}
        <div className="text-center mt-6 pt-6 border-t">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <QrCode className="h-4 w-4" />
            <span>Código QR para verificación digital</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Sistema de Facturación Digital
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona tus facturas electrónicas sin papel
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-primary text-white">
                <Leaf className="h-3 w-3 mr-1" />
                Eco-Friendly
              </Badge>
              <Badge className="bg-gradient-secondary text-white">
                <Shield className="h-3 w-3 mr-1" />
                100% Digital
              </Badge>
            </div>
          </div>
        </div>

        {/* Búsqueda */}
        <Card className="mb-6 shadow-card">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por factura, cliente o mesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Facturas */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Facturas Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.customer.name}</TableCell>
                    <TableCell>Mesa {invoice.tableNumber}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell className="font-bold text-primary">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell>
                      {invoice.emailSent ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Enviado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog open={isPreviewOpen && selectedInvoice?.id === invoice.id} onOpenChange={setIsPreviewOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedInvoice(invoice)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Vista Previa - Factura {invoice.id}</DialogTitle>
                            </DialogHeader>
                            <InvoicePreview invoice={invoice} />
                            <div className="flex justify-center gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
                              <Button 
                                onClick={() => handleSendEmail(invoice)}
                                className="bg-gradient-primary hover:bg-primary-hover"
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Enviar por Email
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => handleDownloadInvoice(invoice)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar PDF
                              </Button>
                              <Button variant="outline">
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartir
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSendEmail(invoice)}
                          disabled={invoice.emailSent}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Facturas Hoy</p>
                  <p className="text-2xl font-bold">{invoices.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Emails Enviados</p>
                  <p className="text-2xl font-bold">{invoices.filter(i => i.emailSent).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Papel Ahorrado</p>
                  <p className="text-2xl font-bold">100%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSystem;