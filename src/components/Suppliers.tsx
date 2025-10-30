import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Truck,
  Phone,
  Mail,
  MapPin,
  Star,
  DollarSign,
  Calendar,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Send
} from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
  status: 'active' | 'inactive' | 'pending';
  products: string[];
  paymentTerms: string;
  deliveryTime: string;
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: { product: string; quantity: number; unitPrice: number }[];
  total: number;
  status: 'draft' | 'sent' | 'confirmed' | 'delivered' | 'cancelled';
  orderDate: string;
  expectedDelivery: string;
  notes: string;
}

const Suppliers = () => {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<'suppliers' | 'orders' | 'new-supplier' | 'new-order'>('suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');

  // Sample suppliers data
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: 'SUPP001',
      name: 'Distribuidora Alimentaria S.A.S',
      contact: 'María González',
      email: 'maria@distribuidora.com',
      phone: '+57 301 234 5678',
      address: 'Calle 123 #45-67, Medellín',
      category: 'Ingredientes',
      rating: 4.8,
      totalOrders: 45,
      totalSpent: 15400000,
      lastOrder: '2024-01-20',
      status: 'active',
      products: ['Tomate', 'Cebolla', 'Pimiento', 'Lechuga'],
      paymentTerms: '30 días',
      deliveryTime: '24-48 horas'
    },
    {
      id: 'SUPP002',
      name: 'Bebidas y Más Ltda',
      contact: 'Carlos Rodríguez',
      email: 'carlos@bebidasymas.com',
      phone: '+57 312 876 5432',
      address: 'Carrera 78 #12-34, Bogotá',
      category: 'Bebidas',
      rating: 4.5,
      totalOrders: 32,
      totalSpent: 8900000,
      lastOrder: '2024-01-18',
      status: 'active',
      products: ['Coca Cola', 'Cerveza', 'Jugos', 'Agua'],
      paymentTerms: '15 días',
      deliveryTime: '48-72 horas'
    },
    {
      id: 'SUPP003',
      name: 'Carnes Premium',
      contact: 'Ana López',
      email: 'ana@carnespremium.com',
      phone: '+57 315 567 8901',
      address: 'Avenida 68 #89-12, Cali',
      category: 'Proteínas',
      rating: 4.9,
      totalOrders: 28,
      totalSpent: 12300000,
      lastOrder: '2024-01-22',
      status: 'active',
      products: ['Pollo', 'Carne de Res', 'Cerdo', 'Pescado'],
      paymentTerms: '7 días',
      deliveryTime: '12-24 horas'
    }
  ]);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: 'PO-2024-001',
      supplierId: 'SUPP001',
      supplierName: 'Distribuidora Alimentaria S.A.S',
      items: [
        { product: 'Tomate', quantity: 50, unitPrice: 3500 },
        { product: 'Cebolla', quantity: 30, unitPrice: 2800 }
      ],
      total: 259000,
      status: 'confirmed',
      orderDate: '2024-01-22',
      expectedDelivery: '2024-01-24',
      notes: 'Entrega urgente para fin de semana'
    },
    {
      id: 'PO-2024-002',
      supplierId: 'SUPP002',
      supplierName: 'Bebidas y Más Ltda',
      items: [
        { product: 'Coca Cola', quantity: 100, unitPrice: 2200 },
        { product: 'Cerveza', quantity: 50, unitPrice: 3500 }
      ],
      total: 395000,
      status: 'sent',
      orderDate: '2024-01-23',
      expectedDelivery: '2024-01-26',
      notes: 'Promoción especial enero'
    }
  ]);

  // New supplier form state
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    paymentTerms: '',
    deliveryTime: '',
    products: ''
  });

  // New order form state
  const [newOrder, setNewOrder] = useState({
    supplierId: '',
    items: [{ product: '', quantity: 0, unitPrice: 0 }],
    notes: '',
    expectedDelivery: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': case 'confirmed': case 'delivered': return CheckCircle;
      case 'pending': case 'sent': return Clock;
      case 'inactive': case 'cancelled': return AlertTriangle;
      default: return Clock;
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSupplier = () => {
    const supplier: Supplier = {
      id: `SUPP${String(suppliers.length + 1).padStart(3, '0')}`,
      ...newSupplier,
      rating: 0,
      totalOrders: 0,
      totalSpent: 0,
      lastOrder: '',
      status: 'active',
      products: newSupplier.products.split(',').map(p => p.trim())
    };

    setSuppliers([...suppliers, supplier]);
    setNewSupplier({
      name: '', contact: '', email: '', phone: '', address: '',
      category: '', paymentTerms: '', deliveryTime: '', products: ''
    });
    setCurrentView('suppliers');

    toast({
      title: "Proveedor agregado",
      description: `${supplier.name} fue agregado exitosamente`,
    });
  };

  const handleCreateOrder = () => {
    const supplier = suppliers.find(s => s.id === newOrder.supplierId);
    if (!supplier) return;

    const total = newOrder.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    );

    const order: PurchaseOrder = {
      id: `PO-2024-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      supplierId: newOrder.supplierId,
      supplierName: supplier.name,
      items: newOrder.items.filter(item => item.product && item.quantity > 0),
      total,
      status: 'draft',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: newOrder.expectedDelivery,
      notes: newOrder.notes
    };

    setPurchaseOrders([...purchaseOrders, order]);
    setNewOrder({
      supplierId: '',
      items: [{ product: '', quantity: 0, unitPrice: 0 }],
      notes: '',
      expectedDelivery: ''
    });
    setCurrentView('orders');

    toast({
      title: "Orden de compra creada",
      description: `Orden ${order.id} por ${formatCurrency(total)}`,
    });
  };

  const handleSendOrder = (orderId: string) => {
    setPurchaseOrders(orders =>
      orders.map(order =>
        order.id === orderId ? { ...order, status: 'sent' } : order
      )
    );

    toast({
      title: "Orden enviada",
      description: `La orden ${orderId} fue enviada al proveedor`,
    });
  };

  // Render views
  if (currentView === 'new-supplier') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setCurrentView('suppliers')}
              className="rounded-full"
            >
              ← Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Agregar Nuevo Proveedor</h1>
              <p className="text-muted-foreground">Complete la información del proveedor</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nombre de la Empresa</label>
                    <Input
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                      placeholder="Distribuidora ABC S.A.S"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Persona de Contacto</label>
                    <Input
                      value={newSupplier.contact}
                      onChange={(e) => setNewSupplier({...newSupplier, contact: e.target.value})}
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Teléfono</label>
                    <Input
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                      placeholder="+57 300 123 4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Dirección</label>
                  <Input
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                    placeholder="Calle 123 #45-67, Ciudad"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Categoría</label>
                    <Input
                      value={newSupplier.category}
                      onChange={(e) => setNewSupplier({...newSupplier, category: e.target.value})}
                      placeholder="Ingredientes"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Términos de Pago</label>
                    <Input
                      value={newSupplier.paymentTerms}
                      onChange={(e) => setNewSupplier({...newSupplier, paymentTerms: e.target.value})}
                      placeholder="30 días"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tiempo de Entrega</label>
                    <Input
                      value={newSupplier.deliveryTime}
                      onChange={(e) => setNewSupplier({...newSupplier, deliveryTime: e.target.value})}
                      placeholder="24-48 horas"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Productos (separados por coma)</label>
                  <Textarea
                    value={newSupplier.products}
                    onChange={(e) => setNewSupplier({...newSupplier, products: e.target.value})}
                    placeholder="Tomate, Cebolla, Pimiento, Lechuga"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleAddSupplier} className="flex-1">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Proveedor
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentView('suppliers')}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Gestión de Proveedores</h1>
            <p className="text-slate-600">Administra proveedores y órdenes de compra</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setCurrentView('new-supplier')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nuevo Proveedor
            </Button>
            <Button 
              variant="outline"
              onClick={() => setCurrentView('new-order')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Nueva Orden
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={currentView === 'suppliers' ? 'default' : 'outline'}
            onClick={() => setCurrentView('suppliers')}
            className="flex items-center gap-2"
          >
            <Truck className="h-4 w-4" />
            Proveedores ({suppliers.length})
          </Button>
          <Button
            variant={currentView === 'orders' ? 'default' : 'outline'}
            onClick={() => setCurrentView('orders')}
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            Órdenes de Compra ({purchaseOrders.length})
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        {currentView === 'suppliers' && (
          <div className="grid gap-6">
            {filteredSuppliers.map(supplier => {
              const StatusIcon = getStatusIcon(supplier.status);
              return (
                <Card key={supplier.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-slate-800">{supplier.name}</h3>
                          <Badge className={getStatusColor(supplier.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {supplier.status}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{supplier.rating}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="h-4 w-4" />
                            {supplier.phone}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="h-4 w-4" />
                            {supplier.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="h-4 w-4" />
                            {supplier.category}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar className="h-4 w-4" />
                            {supplier.deliveryTime}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{supplier.totalOrders}</p>
                            <p className="text-sm text-slate-600">Órdenes Totales</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">
                              {formatCurrency(supplier.totalSpent)}
                            </p>
                            <p className="text-sm text-slate-600">Total Gastado</p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">{supplier.paymentTerms}</p>
                            <p className="text-sm text-slate-600">Términos de Pago</p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm font-medium text-slate-700 mb-2">Productos:</p>
                          <div className="flex flex-wrap gap-2">
                            {supplier.products.map((product, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {product}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedSupplier(supplier.id);
                            setCurrentView('new-order');
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Nueva Orden
                        </Button>
                        <Button size="sm" variant="ghost">
                          Ver Historial
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {currentView === 'orders' && (
          <div className="grid gap-6">
            {purchaseOrders.map(order => {
              const StatusIcon = getStatusIcon(order.status);
              return (
                <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-slate-800">{order.id}</h3>
                          <Badge className={getStatusColor(order.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-slate-600">{order.supplierName}</p>
                        <p className="text-sm text-slate-500">
                          Fecha: {order.orderDate} | Entrega: {order.expectedDelivery}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(order.total)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                          <span className="font-medium">{item.product}</span>
                          <div className="text-right text-sm text-slate-600">
                            {item.quantity} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.quantity * item.unitPrice)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-slate-600">{order.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {order.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleSendOrder(order.id)}
                          className="flex items-center gap-2"
                        >
                          <Send className="h-4 w-4" />
                          Enviar Orden
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        Ver Detalles
                      </Button>
                      <Button size="sm" variant="ghost">
                        Descargar PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Suppliers;