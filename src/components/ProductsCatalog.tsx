import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProductAvailability } from '@/hooks/useProductAvailability';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
  category_id: string;
  categories?: {
    name: string;
  };
}

const ProductsCatalog = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [productsWithAvailability, setProductsWithAvailability] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [profile]);

  const loadProducts = async () => {
    if (!profile?.restaurant_id) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('user_id', profile.restaurant_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
      
      // Load availability for each product
      if (data && data.length > 0) {
        const productsWithData = await Promise.all(
          data.map(async (product) => {
            try {
              const { data: availData } = await supabase
                .rpc('check_product_ingredients_available', {
                  p_product_id: product.id,
                  p_quantity: 1
                });
              
              return {
                ...product,
                maxUnits: availData?.[0]?.max_units || 0,
                limitingIngredient: availData?.[0]?.limiting_ingredient_name || null
              };
            } catch (error) {
              console.error(`Error loading availability for ${product.name}:`, error);
              return {
                ...product,
                maxUnits: 0,
                limitingIngredient: null
              };
            }
          })
        );
        
        setProductsWithAvailability(productsWithData);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!profile?.restaurant_id) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', profile.restaurant_id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filteredProducts = productsWithAvailability.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Productos</h1>
          <p className="text-muted-foreground">Visualiza todos tus productos disponibles</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            size="sm"
          >
            Todos
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              size="sm"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          const isAvailable = product.maxUnits > 0;
          
          return (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square relative bg-muted">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl text-muted-foreground">🍽️</span>
                  </div>
                )}
                {!isAvailable && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Badge variant="destructive" className="text-lg">
                      No disponible
                    </Badge>
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {isAvailable ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  )}
                </div>
                {product.categories && (
                  <Badge variant="secondary" className="w-fit">
                    {product.categories.name}
                  </Badge>
                )}
                {/* Availability Badge */}
                <Badge variant={isAvailable ? "default" : "destructive"} className="w-fit mt-2">
                  {isAvailable 
                    ? `${product.maxUnits} disponibles` 
                    : 'Sin stock'}
                </Badge>
              </CardHeader>
              <CardContent>
                {product.description && (
                  <CardDescription className="mb-2 line-clamp-2">
                    {product.description}
                  </CardDescription>
                )}
                <p className="text-2xl font-bold text-primary">
                  ${product.price.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron productos</p>
        </div>
      )}
    </div>
  );
};

export default ProductsCatalog;
