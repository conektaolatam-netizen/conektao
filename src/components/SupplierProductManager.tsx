import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Package,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Upload,
  Save,
  DollarSign
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  category: string;
  sku: string;
  is_active: boolean;
}

interface SupplierProductManagerProps {
  view: 'add-product' | 'products';
  onBack: () => void;
}

const SupplierProductManager = ({ view, onBack }: SupplierProductManagerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    sku: '',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [supplierId, setSupplierId] = useState<string>('');

  useEffect(() => {
    loadSupplierData();
    if (view === 'products') {
      loadProducts();
    }
  }, [view]);

  const loadSupplierData = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('id')
        .eq('user_id', user.data.user.id)
        .single();

      if (supplierData) {
        setSupplierId(supplierData.id);
      }
    } catch (error) {
      console.error('Error loading supplier data:', error);
    }
  };

  const loadProducts = async () => {
    if (!supplierId) return;
    
    try {
      setLoading(true);
      const { data: productsData, error } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return;

    try {
      setLoading(true);

      let imageUrl = formData.image_url;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const productData = {
        ...formData,
        image_url: imageUrl,
        supplier_id: supplierId,
        is_active: true
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('supplier_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        toast({
          title: "Producto actualizado",
          description: "El producto se actualizó exitosamente"
        });
      } else {
        const { error } = await supabase
          .from('supplier_products')
          .insert(productData);

        if (error) throw error;

        toast({
          title: "Producto creado",
          description: "El producto se creó exitosamente"
        });
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category: '',
        sku: '',
        image_url: ''
      });
      setImageFile(null);
      setEditingProduct(null);

      if (view === 'products') {
        loadProducts();
      } else {
        onBack();
      }

    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el producto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category || '',
      sku: product.sku || '',
      image_url: product.image_url || ''
    });
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      const { error } = await supabase
        .from('supplier_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Producto eliminado",
        description: "El producto se eliminó exitosamente"
      });

      loadProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {view === 'add-product' ? 'Agregar Producto' : 'Gestionar Productos'}
          </h1>
          <p className="text-muted-foreground">
            {view === 'add-product' 
              ? 'Crea un nuevo producto para tu tienda'
              : 'Administra tu catálogo de productos'
            }
          </p>
        </div>
      </div>

      {view === 'add-product' || editingProduct ? (
        /* Product Form */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Producto *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Tomate fresco"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe tu producto..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Precio *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                        placeholder="0"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ingredientes">Ingredientes</SelectItem>
                          <SelectItem value="bebidas">Bebidas</SelectItem>
                          <SelectItem value="lacteos">Lácteos</SelectItem>
                          <SelectItem value="carnes">Carnes</SelectItem>
                          <SelectItem value="vegetales">Vegetales</SelectItem>
                          <SelectItem value="otros">Otros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                        placeholder="Código del producto"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Imagen del Producto</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {formData.image_url ? (
                        <div className="space-y-4">
                          <img
                            src={formData.image_url}
                            alt="Preview"
                            className="max-w-full h-32 object-cover mx-auto rounded"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                          >
                            Cambiar Imagen
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                          <div>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setImageFile(file);
                              }}
                              className="hidden"
                              id="image-upload"
                            />
                            <Label htmlFor="image-upload" className="cursor-pointer">
                              <Button type="button" variant="outline" asChild>
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Subir Imagen
                                </span>
                              </Button>
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingProduct(null);
                    setFormData({
                      name: '',
                      description: '',
                      price: 0,
                      stock: 0,
                      category: '',
                      sku: '',
                      image_url: ''
                    });
                    if (view === 'add-product') onBack();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading || !formData.name}>
                  {loading ? (
                    <>Guardando...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingProduct ? 'Actualizar' : 'Crear'} Producto
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Products List */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Mis Productos</h2>
            <Button onClick={() => setEditingProduct({} as Product)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4 space-y-4">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded"
                    />
                  )}
                  
                  <div>
                    <h3 className="font-medium line-clamp-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">
                      {formatCurrency(product.price)}
                    </span>
                    <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                      Stock: {product.stock}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(product)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierProductManager;