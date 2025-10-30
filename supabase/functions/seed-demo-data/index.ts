import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Authorization required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Initialize Supabase client with user context
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Get authenticated user's profile
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('restaurant_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.restaurant_id || userProfile.role !== 'owner') {
      throw new Error('Access denied: Only restaurant owners can seed demo data');
    }

    const restaurantId = userProfile.restaurant_id;

    console.log(`Seeding demo data for restaurant: ${restaurantId}`);

    // Create demo products
    const demoProducts = [
      {
        user_id: user.id,
        name: 'Pizza Margherita',
        price: 25000,
        cost_price: 8500,
        category: 'Pizzas',
        is_active: true
      },
      {
        user_id: user.id,
        name: 'Hamburguesa Clásica',
        price: 18000,
        cost_price: 6200,
        category: 'Hamburguesas',
        is_active: true
      },
      {
        user_id: user.id,
        name: 'Pasta Carbonara',
        price: 22000,
        cost_price: 7500,
        category: 'Pastas',
        is_active: true
      },
      {
        user_id: user.id,
        name: 'Ensalada César',
        price: 15000,
        cost_price: 4500,
        category: 'Ensaladas',
        is_active: true
      },
      {
        user_id: user.id,
        name: 'Lomo de Cerdo',
        price: 35000,
        cost_price: 14000,
        category: 'Carnes',
        is_active: true
      }
    ];

    // Insert products
    const { data: insertedProducts, error: productsError } = await supabase
      .from('products')
      .insert(demoProducts)
      .select();

    if (productsError) {
      throw new Error(`Error creating products: ${productsError.message}`);
    }

    // Create inventory for each product
    const inventoryData = insertedProducts?.map(product => ({
      product_id: product.id,
      current_stock: Math.floor(Math.random() * 50) + 10, // 10-60 units
      min_stock: 5,
      user_id: user.id,
      unit: 'unidades'
    })) || [];

    const { error: inventoryError } = await supabase
      .from('inventory')
      .insert(inventoryData);

    if (inventoryError) {
      throw new Error(`Error creating inventory: ${inventoryError.message}`);
    }

    // Create demo sales (last 30 days)
    const demoSales = [];
    const demoSaleItems = [];
    
    for (let i = 0; i < 15; i++) {
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 30));
      
      const saleId = crypto.randomUUID();
      const randomProducts = insertedProducts?.slice(0, Math.floor(Math.random() * 3) + 1) || [];
      
      let totalAmount = 0;
      const items = randomProducts.map(product => {
        const quantity = Math.floor(Math.random() * 3) + 1;
        const subtotal = product.price * quantity;
        totalAmount += subtotal;
        
        return {
          sale_id: saleId,
          product_id: product.id,
          quantity,
          unit_price: product.price,
          subtotal
        };
      });

      demoSales.push({
        id: saleId,
        user_id: user.id,
        total_amount: totalAmount,
        payment_method: ['efectivo', 'tarjeta', 'transferencia'][Math.floor(Math.random() * 3)],
        table_number: Math.floor(Math.random() * 10) + 1,
        created_at: saleDate.toISOString()
      });

      demoSaleItems.push(...items);
    }

    // Insert sales
    const { error: salesError } = await supabase
      .from('sales')
      .insert(demoSales);

    if (salesError) {
      throw new Error(`Error creating sales: ${salesError.message}`);
    }

    // Insert sale items
    const { error: saleItemsError } = await supabase
      .from('sale_items')
      .insert(demoSaleItems);

    if (saleItemsError) {
      throw new Error(`Error creating sale items: ${saleItemsError.message}`);
    }

    console.log('Demo data seeded successfully');

    return new Response(JSON.stringify({
      success: true,
      message: 'Demo data seeded successfully',
      data: {
        products_created: insertedProducts?.length || 0,
        sales_created: demoSales.length,
        sale_items_created: demoSaleItems.length
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error seeding demo data:', error);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});