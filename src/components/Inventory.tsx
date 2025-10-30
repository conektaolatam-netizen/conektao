import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Package,
  Plus,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Filter,
  Eye,
  Edit,
  Calendar,
  Truck,
  Trash2,
  Save,
  X
} from 'lucide-react';

interface InventoryProps {
  userData?: any;
}

const Inventory = ({ userData }: InventoryProps) => {
  const { toast } = useToast();
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingStock, setEditingStock] = useState<number | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const [suppliers, setSuppliers] = useState([
    'TechSupply Colombia',
    'Oficina Total', 
    'ElectroIndustrial',
    'Proveedor General'
  ]);
  const [newSupplier, setNewSupplier] = useState('');
  const [showSupplierInput, setShowSupplierInput] = useState(false);
  const [customCategories, setCustomCategories] = useState([
    'Bases', 'Pasta', 'Quesos', 'Carnes', 'Mariscos', 'Vegetales', 
    'Hierbas', 'Frutas', 'Bebidas', 'Postres', 'Condimentos'
  ]);
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  
  // Estados del formulario de nuevo producto
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    supplier: '',
    initialStock: '',
    minStock: '',
    unit: '',
    unitPrice: ''
  });

  // Generar inventario dinámicamente desde los datos del usuario
  const generateInventoryProducts = () => {
    if (!userData?.products || userData.products.length === 0) {
      // Inventario por defecto si no hay datos del usuario
      return [
        {
          id: 1,
          name: "Producto Base 1",
          category: "General",
          currentStock: 10,
          minStock: 5,
          unit: "unidades",
          lastEntry: new Date().toISOString().split('T')[0],
          lastEntryQty: 15,
          lastExit: new Date().toISOString().split('T')[0],
          lastExitQty: 3,
          supplier: "Proveedor General",
          unitPrice: 5000,
          totalValue: 50000,
          status: "Normal",
          movement: "stable"
        }
      ];
    }

    // Crear inventario desde los productos del usuario
    const userInventory = userData.products.map((product: any, index: number) => ({
      id: index + 1,
      name: product.name,
      category: getInventoryCategory(product.name, userData.businessType),
      currentStock: Math.floor(Math.random() * 20) + 10, // Stock aleatorio entre 10-30
      minStock: Math.floor(Math.random() * 10) + 3, // Stock mínimo entre 3-13
      unit: getProductUnit(product.name, userData.businessType),
      lastEntry: new Date().toISOString().split('T')[0],
      lastEntryQty: Math.floor(Math.random() * 30) + 10,
      lastExit: new Date().toISOString().split('T')[0],
      lastExitQty: Math.floor(Math.random() * 10) + 1,
      supplier: `Proveedor ${userData.companyName}`,
      unitPrice: Math.floor(product.price * 0.6), // 60% del precio de venta como costo
      totalValue: Math.floor(product.price * 0.6) * (Math.floor(Math.random() * 20) + 10),
      status: Math.random() > 0.7 ? "Bajo" : "Normal", // 30% chance de stock bajo
      movement: Math.random() > 0.5 ? "up" : Math.random() > 0.3 ? "stable" : "down"
    }));

    // Agregar materias primas complementarias según el tipo de negocio
    const complementaryInventory = getComplementaryInventory(userData.businessType);
    
    return [...userInventory, ...complementaryInventory];
  };

  const [products, setProducts] = useState(() => generateInventoryProducts());

  const getInventoryCategory = (productName: string, businessType: string) => {
    const name = productName.toLowerCase();
    if (name.includes('pizza')) return 'Masas';
    if (name.includes('bebida') || name.includes('jugo') || name.includes('gaseosa')) return 'Bebidas';
    if (name.includes('carne') || name.includes('pollo') || name.includes('jamón')) return 'Carnes';
    if (name.includes('queso')) return 'Lácteos';
    if (name.includes('vegetal') || name.includes('tomate') || name.includes('lechuga')) return 'Vegetales';
    
    // Categorías por tipo de negocio
    switch (businessType) {
      case 'pizzeria': return 'Ingredientes Pizza';
      case 'cafeteria': return 'Café y Pasteles';
      case 'bar': return 'Licores y Snacks';
      case 'heladeria': return 'Helados y Toppings';
      case 'panaderia': return 'Harinas y Levaduras';
      default: return 'Materias Primas';
    }
  };

  const getProductUnit = (productName: string, businessType: string) => {
    const name = productName.toLowerCase();
    if (name.includes('líquido') || name.includes('jugo') || name.includes('leche')) return 'litros';
    if (name.includes('harina') || name.includes('azúcar') || name.includes('carne')) return 'kg';
    if (name.includes('unidad') || name.includes('botella') || name.includes('lata')) return 'unidades';
    
    // Unidades por tipo de negocio
    switch (businessType) {
      case 'pizzeria': return 'kg';
      case 'cafeteria': return 'kg';
      case 'bar': return 'botellas';
      case 'heladeria': return 'litros';
      case 'panaderia': return 'kg';
      default: return 'unidades';
    }
  };

  const getComplementaryInventory = (businessType: string) => {
    const baseId = 1000; // Para evitar conflictos con IDs de productos del usuario
    
    switch (businessType) {
      case 'pizzeria':
        return [
          {
            id: baseId + 1,
            name: "Harina de Trigo",
            category: "Harinas",
            currentStock: 25,
            minStock: 10,
            unit: "kg",
            lastEntry: new Date().toISOString().split('T')[0],
            lastEntryQty: 50,
            lastExit: new Date().toISOString().split('T')[0],
            lastExitQty: 8,
            supplier: "Molinos S.A.",
            unitPrice: 2500,
            totalValue: 62500,
            status: "Normal",
            movement: "stable"
          },
          {
            id: baseId + 2,
            name: "Mozzarella",
            category: "Quesos",
            currentStock: 15,
            minStock: 5,
            unit: "kg",
            lastEntry: new Date().toISOString().split('T')[0],
            lastEntryQty: 20,
            lastExit: new Date().toISOString().split('T')[0],
            lastExitQty: 6,
            supplier: "Lácteos Premium",
            unitPrice: 18000,
            totalValue: 270000,
            status: "Normal",
            movement: "up"
          }
        ];
      case 'bar':
        return [
          {
            id: baseId + 1,
            name: "Cerveza en Barril",
            category: "Licores",
            currentStock: 8,
            minStock: 3,
            unit: "barriles",
            lastEntry: new Date().toISOString().split('T')[0],
            lastEntryQty: 10,
            lastExit: new Date().toISOString().split('T')[0],
            lastExitQty: 3,
            supplier: "Distribuidora Bavaria",
            unitPrice: 85000,
            totalValue: 680000,
            status: "Normal",
            movement: "stable"
          }
        ];
      case 'cafeteria':
        return [
          {
            id: baseId + 1,
            name: "Café en Grano",
            category: "Café",
            currentStock: 12,
            minStock: 5,
            unit: "kg",
            lastEntry: new Date().toISOString().split('T')[0],
            lastEntryQty: 20,
            lastExit: new Date().toISOString().split('T')[0],
            lastExitQty: 4,
            supplier: "Café de Colombia",
            unitPrice: 25000,
            totalValue: 300000,
            status: "Normal",
            movement: "up"
          }
        ];
      default:
        return [
          {
            id: baseId + 1,
            name: "Materia Prima General",
            category: "General",
            currentStock: 20,
            minStock: 8,
            unit: "unidades",
            lastEntry: new Date().toISOString().split('T')[0],
            lastEntryQty: 30,
            lastExit: new Date().toISOString().split('T')[0],
            lastExitQty: 5,
            supplier: "Proveedor General",
            unitPrice: 8000,
            totalValue: 160000,
            status: "Normal",
            movement: "stable"
          }
        ];
    }
  };

  const categories = ['all', 'Bases', 'Pasta', 'Quesos', 'Carnes', 'Mariscos', 'Vegetales', 'Hierbas', 'Frutas', 'Bebidas', 'Postres', 'Condimentos'];

  const handleEditStock = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setEditingStock(productId);
      setTempStock(product.currentStock);
    }
  };

  const handleSaveStock = (productId: number) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { 
            ...product, 
            currentStock: tempStock, 
            totalValue: tempStock * product.unitPrice,
            status: tempStock <= product.minStock ? 'Bajo' : tempStock === 0 ? 'Agotado' : 'Normal'
          }
        : product
    ));
    setEditingStock(null);
  };

  const handleCancelEdit = () => {
    setEditingStock(null);
    setTempStock(0);
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      setProducts(prev => prev.filter(product => product.id !== productId));
    }
  };

  const handleAddSupplier = () => {
    if (newSupplier.trim() && !suppliers.includes(newSupplier.trim())) {
      setSuppliers(prev => [...prev, newSupplier.trim()]);
      setNewSupplier('');
      setShowSupplierInput(false);
    }
  };

  const handleDeleteSupplier = (supplierToDelete: string) => {
    if (confirm(`¿Eliminar el proveedor "${supplierToDelete}"?`)) {
      setSuppliers(prev => prev.filter(supplier => supplier !== supplierToDelete));
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !customCategories.includes(newCategory.trim())) {
      setCustomCategories(prev => [...prev, newCategory.trim()]);
      setNewCategory('');
      setShowCategoryInput(false);
    }
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    if (confirm(`¿Eliminar la categoría "${categoryToDelete}"?`)) {
      setCustomCategories(prev => prev.filter(category => category !== categoryToDelete));
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddProduct = () => {
    // Validación básica
    if (!formData.name || !formData.category || !formData.initialStock || !formData.unitPrice) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    const newProduct = {
      id: Math.max(...products.map(p => p.id)) + 1,
      name: formData.name,
      category: formData.category,
      currentStock: parseInt(formData.initialStock),
      minStock: parseInt(formData.minStock) || 5,
      unit: formData.unit || 'unidades',
      lastEntry: new Date().toISOString().split('T')[0],
      lastEntryQty: parseInt(formData.initialStock),
      lastExit: new Date().toISOString().split('T')[0],
      lastExitQty: 0,
      supplier: formData.supplier || 'Sin proveedor',
      unitPrice: parseFloat(formData.unitPrice),
      totalValue: parseInt(formData.initialStock) * parseFloat(formData.unitPrice),
      status: parseInt(formData.initialStock) <= (parseInt(formData.minStock) || 5) ? 'Bajo' : 'Normal',
      movement: 'stable'
    };

    setProducts(prev => [...prev, newProduct]);
    
    // Limpiar formulario
    setFormData({
      name: '',
      category: '',
      supplier: '',
      initialStock: '',
      minStock: '',
      unit: '',
      unitPrice: ''
    });

    // Cerrar modal
    setShowNewProduct(false);

    // Mostrar confirmación
    toast({
      title: "✅ Producto agregado",
      description: `${formData.name} se agregó correctamente al inventario`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Normal': return 'bg-green-100 text-green-800';
      case 'Bajo': return 'bg-yellow-100 text-yellow-800';
      case 'Agotado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementIcon = (movement: string) => {
    switch (movement) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getFilteredProducts = () => {
    return selectedCategory === 'all' 
      ? products 
      : products.filter(p => p.category === selectedCategory);
  };

  const getTotalInventoryValue = () => {
    return products.reduce((sum, product) => sum + product.totalValue, 0);
  };

  const getLowStockCount = () => {
    return products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0).length;
  };

  const getOutOfStockCount = () => {
    return products.filter(p => p.currentStock === 0).length;
  };

  const getTopMovingProducts = () => {
    return products
      .filter(p => p.lastExitQty > 0)
      .sort((a, b) => b.lastExitQty - a.lastExitQty)
      .slice(0, 3);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary">Inventario</h2>
          <p className="text-muted-foreground mt-2">Control completo de stock y productos</p>
        </div>
        <Button 
          onClick={() => setShowNewProduct(true)}
          className="bg-gradient-primary hover:bg-primary-hover shadow-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-card border-0 shadow-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Productos Totales</p>
              <p className="text-xl font-bold">{products.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-card border-0 shadow-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-xl font-bold">{formatCurrency(getTotalInventoryValue())}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-card border-0 shadow-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stock Bajo</p>
              <p className="text-xl font-bold">{getLowStockCount()}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-card border-0 shadow-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Package className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Agotados</p>
              <p className="text-xl font-bold">{getOutOfStockCount()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {(getLowStockCount() > 0 || getOutOfStockCount() > 0) && (
        <Card className="p-4 border-l-4 border-l-destructive bg-destructive/5">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">Alertas de Inventario</p>
              <p className="text-sm text-muted-foreground">
                {getOutOfStockCount() > 0 && `${getOutOfStockCount()} productos agotados. `}
                {getLowStockCount() > 0 && `${getLowStockCount()} productos con stock bajo.`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* New Product Form */}
      {showNewProduct && (
        <Card className="p-6 bg-gradient-card border-0 shadow-float">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Agregar Nuevo Producto</h3>
            <Button variant="outline" onClick={() => setShowNewProduct(false)}>
              Cerrar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Nombre del Producto</Label>
                <Input 
                  placeholder="Nombre del producto" 
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <div className="space-y-2">
                  {!showCategoryInput ? (
                    <select 
                      className="w-full p-2 border rounded-md bg-white z-10"
                      value={formData.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                    >
                      <option value="">Seleccionar categoría</option>
                      {customCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex space-x-2">
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Nombre de la nueva categoría"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      />
                      <Button size="sm" onClick={handleAddCategory}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowCategoryInput(false)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowCategoryInput(!showCategoryInput)}
                      className="text-xs"
                    >
                      {showCategoryInput ? 'Cancelar' : '+ Nueva Categoría'}
                    </Button>
                  </div>
                  
                  {/* Lista de categorías existentes */}
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {customCategories.map(category => (
                      <div key={category} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-xs">
                        <span>{category}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCategory(category)}
                          className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <Label>Proveedor</Label>
                <div className="space-y-2">
                  {!showSupplierInput ? (
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={formData.supplier}
                      onChange={(e) => handleFormChange('supplier', e.target.value)}
                    >
                      <option value="">Seleccionar proveedor</option>
                      {suppliers.map(supplier => (
                        <option key={supplier} value={supplier}>{supplier}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex space-x-2">
                      <Input
                        value={newSupplier}
                        onChange={(e) => setNewSupplier(e.target.value)}
                        placeholder="Nombre del nuevo proveedor"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSupplier()}
                      />
                      <Button size="sm" onClick={handleAddSupplier}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowSupplierInput(false)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowSupplierInput(!showSupplierInput)}
                      className="text-xs"
                    >
                      {showSupplierInput ? 'Cancelar' : '+ Nuevo Proveedor'}
                    </Button>
                  </div>
                  
                  {/* Lista de proveedores existentes */}
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {suppliers.map(supplier => (
                      <div key={supplier} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-xs">
                        <span>{supplier}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSupplier(supplier)}
                          className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Stock Inicial</Label>
                <Input 
                  type="number" 
                  placeholder="Cantidad inicial" 
                  value={formData.initialStock}
                  onChange={(e) => handleFormChange('initialStock', e.target.value)}
                />
              </div>
              <div>
                <Label>Stock Mínimo</Label>
                <Input 
                  type="number" 
                  placeholder="Stock mínimo alerta" 
                  value={formData.minStock}
                  onChange={(e) => handleFormChange('minStock', e.target.value)}
                />
              </div>
              <div>
                <Label>Unidad de Medida</Label>
                <select 
                  className="w-full p-2 border rounded-md bg-white"
                  value={formData.unit}
                  onChange={(e) => handleFormChange('unit', e.target.value)}
                >
                  <option value="">Seleccionar unidad</option>
                  <option value="unidades">Unidades</option>
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="g">Gramos (g)</option>
                  <option value="litros">Litros</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="porciones">Porciones</option>
                  <option value="cajas">Cajas</option>
                  <option value="botellas">Botellas</option>
                  <option value="latas">Latas</option>
                  <option value="paquetes">Paquetes</option>
                  <option value="metros">Metros</option>
                  <option value="cm">Centímetros</option>
                </select>
              </div>
              <div>
                <Label>Precio Unitario</Label>
                <Input 
                  type="number" 
                  placeholder="Precio por unidad" 
                  value={formData.unitPrice}
                  onChange={(e) => handleFormChange('unitPrice', e.target.value)}
                />
              </div>
              <Button 
                className="w-full bg-gradient-primary"
                onClick={handleAddProduct}
              >
                Agregar Producto
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Inventory Table */}
        <div className="lg:col-span-3">
          <Card className="bg-gradient-card border-0 shadow-card">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Lista de Productos</h3>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar productos..." className="pl-10 w-64" />
                  </div>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="p-2 border rounded-md"
                  >
                    <option value="all">Todas las categorías</option>
                    {customCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Producto</th>
                      <th className="text-left p-3">Stock</th>
                      <th className="text-left p-3">Estado</th>
                      <th className="text-left p-3">Última Entrada</th>
                      <th className="text-left p-3">Última Salida</th>
                      <th className="text-left p-3">Valor Total</th>
                      <th className="text-left p-3">Tendencia</th>
                      <th className="text-left p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredProducts().map(product => (
                      <tr key={product.id} className="border-b hover:bg-accent/50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                            <p className="text-xs text-muted-foreground">{product.supplier}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          {editingStock === product.id ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                value={tempStock}
                                onChange={(e) => setTempStock(Number(e.target.value))}
                                className="w-16 h-8 text-sm"
                                min="0"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSaveStock(product.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium">{product.currentStock}</p>
                              <p className="text-xs text-muted-foreground">Mín: {product.minStock}</p>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(product.status)}>
                            {product.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-sm">{product.lastEntry}</p>
                            <p className="text-xs text-green-600">+{product.lastEntryQty}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-sm">{product.lastExit}</p>
                            <p className="text-xs text-red-600">-{product.lastExitQty}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{formatCurrency(product.totalValue)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(product.unitPrice)}/u
                          </p>
                        </td>
                        <td className="p-3">
                          {getMovementIcon(product.movement)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditStock(product.id)}
                              disabled={editingStock === product.id}
                              title="Editar cantidad"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar producto"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* Analytics Sidebar */}
        <div className="space-y-6">
          {/* Quick Analytics */}
          <Card className="p-4 bg-gradient-secondary border-0 shadow-secondary">
            <div className="text-white">
              <h4 className="font-semibold mb-3">Análisis Rápido</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Rotación Alta:</span>
                  <span>23%</span>
                </div>
                <div className="flex justify-between">
                  <span>Rotación Media:</span>
                  <span>45%</span>
                </div>
                <div className="flex justify-between">
                  <span>Rotación Baja:</span>
                  <span>32%</span>
                </div>
                <div className="pt-2 border-t border-white/20">
                  <div className="flex justify-between font-medium">
                    <span>Eficiencia:</span>
                    <span>78%</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Top Moving Products */}
          <Card className="p-4 bg-gradient-card border-0 shadow-card">
            <h4 className="font-semibold mb-3">Productos Más Vendidos</h4>
            <div className="space-y-3">
              {getTopMovingProducts().map((product, index) => (
                <div key={product.id} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      -{product.lastExitQty} unidades
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Restock Recommendations */}
          <Card className="p-4 bg-gradient-card border-0 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Recomendaciones</h4>
              <Truck className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-2 text-sm">
              {products.filter(p => p.status === 'Bajo' || p.status === 'Agotado').map(product => (
                <div key={product.id} className="p-2 bg-yellow-50 rounded border-l-2 border-l-yellow-400">
                  <p className="font-medium text-yellow-800">{product.name}</p>
                  <p className="text-yellow-600 text-xs">
                    {product.status === 'Agotado' ? 'Restock urgente' : 'Restock recomendado'}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-4 bg-gradient-card border-0 shadow-card">
            <h4 className="font-semibold mb-3">Actividad Reciente</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Entrada: Laptop Dell (+10)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Salida: Mouse (-5)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Actualización: Monitor 24"</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Inventory;