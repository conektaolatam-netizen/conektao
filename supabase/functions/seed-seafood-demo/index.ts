import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🦐 Iniciando seed de Marisquería del Pacífico...');

    // 1. Create demo user
    const demoEmail = 'demo.mariscos@conektao.app';
    const demoPassword = 'Mariscos2024!';

    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let userId: string;
    
    const existingUser = existingUsers?.users?.find(u => u.email === demoEmail);
    
    if (existingUser) {
      userId = existingUser.id;
      console.log('Usuario demo ya existe, actualizando datos...');
    } else {
      const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
        email: demoEmail,
        password: demoPassword,
        email_confirm: true,
        user_metadata: { full_name: 'Demo Marisquería' }
      });
      
      if (userError) throw new Error(`Error creando usuario: ${userError.message}`);
      userId = newUser.user!.id;
      console.log('✅ Usuario demo creado');
    }

    // 2. Create restaurant
    const { data: existingRestaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', userId)
      .single();

    let restaurantId: string;

    if (existingRestaurant) {
      restaurantId = existingRestaurant.id;
      await supabase
        .from('restaurants')
        .update({
          name: 'Marisquería del Pacífico',
          address: 'Carrera 15 #93-75, Chapinero, Bogotá',
          nit: '901234567-8',
          latitude: 4.6761,
          longitude: -74.0486,
          location_radius: 50,
          tip_enabled: true,
          default_tip_percentage: 10,
          tip_auto_distribute: false,
          tip_default_distribution_type: 'equal',
          allow_sales_without_stock: false
        })
        .eq('id', restaurantId);
      console.log('✅ Restaurante actualizado');
    } else {
      const { data: newRestaurant, error: restError } = await supabase
        .from('restaurants')
        .insert({
          owner_id: userId,
          name: 'Marisquería del Pacífico',
          address: 'Carrera 15 #93-75, Chapinero, Bogotá',
          nit: '901234567-8',
          latitude: 4.6761,
          longitude: -74.0486,
          location_radius: 50,
          tip_enabled: true,
          default_tip_percentage: 10,
          tip_auto_distribute: false,
          tip_default_distribution_type: 'equal',
          allow_sales_without_stock: false
        })
        .select()
        .single();
      
      if (restError) throw new Error(`Error creando restaurante: ${restError.message}`);
      restaurantId = newRestaurant.id;
      console.log('✅ Restaurante creado');
    }

    // 3. Update owner profile
    await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: demoEmail,
        full_name: 'Roberto Ospina',
        role: 'owner',
        restaurant_id: restaurantId,
        is_active: true,
        work_latitude: 4.6761,
        work_longitude: -74.0486,
        location_radius: 50,
        work_address: 'Carrera 15 #93-75, Chapinero, Bogotá'
      }, { onConflict: 'id' });
    console.log('✅ Perfil owner actualizado');

    // 4. Create category - name is unique globally
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'Mariscos')
      .maybeSingle();

    let categoryId: string;
    if (existingCategory) {
      categoryId = existingCategory.id;
      // Update user_id if needed
      await supabase.from('categories').update({ user_id: userId }).eq('id', categoryId);
    } else {
      const { data: newCat, error: catError } = await supabase
        .from('categories')
        .insert({ name: 'Mariscos', description: 'Platos de mariscos frescos', user_id: userId })
        .select()
        .single();
      if (catError) throw new Error(`Error creando categoría: ${catError.message}`);
      categoryId = newCat.id;
    }

    // Create bebidas category - name is unique globally
    const { data: existingBebidas } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'Bebidas')
      .maybeSingle();

    let bebidasCategoryId: string;
    if (existingBebidas) {
      bebidasCategoryId = existingBebidas.id;
      await supabase.from('categories').update({ user_id: userId }).eq('id', bebidasCategoryId);
    } else {
      const { data: newBebCat, error: bebError } = await supabase
        .from('categories')
        .insert({ name: 'Bebidas', description: 'Bebidas y refrescos', user_id: userId })
        .select()
        .single();
      if (bebError) throw new Error(`Error creando categoría bebidas: ${bebError.message}`);
      bebidasCategoryId = newBebCat.id;
    }
    console.log('✅ Categorías creadas');

    // 5. Clear existing data for clean demo
    await supabase.from('sale_items').delete().eq('sale_id', 
      supabase.from('sales').select('id').eq('user_id', userId)
    );
    await supabase.from('sales').delete().eq('user_id', userId);
    await supabase.from('product_ingredients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('ingredient_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('ingredients').delete().eq('user_id', userId);
    await supabase.from('inventory').delete().eq('user_id', userId);
    await supabase.from('products').delete().eq('user_id', userId);
    console.log('✅ Datos anteriores limpiados');

    // 6. Create ingredients
    const ingredientsData = [
      { name: 'Camarón tigre', unit: 'kg', current_stock: 25, cost_per_unit: 38000, min_stock: 5 },
      { name: 'Langostinos', unit: 'kg', current_stock: 15, cost_per_unit: 52000, min_stock: 3 },
      { name: 'Pescado robalo', unit: 'kg', current_stock: 20, cost_per_unit: 28000, min_stock: 5 },
      { name: 'Pulpo', unit: 'kg', current_stock: 10, cost_per_unit: 48000, min_stock: 2 },
      { name: 'Calamar', unit: 'kg', current_stock: 18, cost_per_unit: 22000, min_stock: 4 },
      { name: 'Mojarra', unit: 'unidades', current_stock: 30, cost_per_unit: 12000, min_stock: 10 },
      { name: 'Mejillones', unit: 'kg', current_stock: 12, cost_per_unit: 18000, min_stock: 3 },
      { name: 'Limón', unit: 'kg', current_stock: 15, cost_per_unit: 4000, min_stock: 5 },
      { name: 'Cebolla morada', unit: 'kg', current_stock: 10, cost_per_unit: 3500, min_stock: 3 },
      { name: 'Cilantro', unit: 'manojos', current_stock: 20, cost_per_unit: 1500, min_stock: 5 },
      { name: 'Arroz', unit: 'kg', current_stock: 25, cost_per_unit: 4200, min_stock: 10 },
      { name: 'Leche de coco', unit: 'litros', current_stock: 15, cost_per_unit: 8000, min_stock: 5 },
      { name: 'Aceite de oliva', unit: 'litros', current_stock: 8, cost_per_unit: 32000, min_stock: 2 },
      { name: 'Ajo', unit: 'kg', current_stock: 5, cost_per_unit: 12000, min_stock: 1 },
      { name: 'Cerveza Corona', unit: 'unidades', current_stock: 120, cost_per_unit: 5500, min_stock: 24 },
      { name: 'Coco fresco', unit: 'unidades', current_stock: 25, cost_per_unit: 3000, min_stock: 10 },
      { name: 'Papa criolla', unit: 'kg', current_stock: 15, cost_per_unit: 5000, min_stock: 5 },
      { name: 'Tomate', unit: 'kg', current_stock: 12, cost_per_unit: 4500, min_stock: 4 },
    ];

    const ingredientIds: Record<string, string> = {};
    for (const ing of ingredientsData) {
      const { data } = await supabase
        .from('ingredients')
        .insert({
          ...ing,
          user_id: userId,
          restaurant_id: restaurantId,
          is_active: true
        })
        .select()
        .single();
      if (data) ingredientIds[ing.name] = data.id;
    }
    console.log('✅ Ingredientes creados:', Object.keys(ingredientIds).length);

    // 7. Create products
    const productsData = [
      { name: 'Ceviche Mixto', price: 38000, cost_price: 14500, category_id: categoryId, description: 'Ceviche de camarón, calamar y pescado con limón y cilantro' },
      { name: 'Cazuela de Mariscos', price: 52000, cost_price: 22000, category_id: categoryId, description: 'Cazuela con camarones, langostinos, mejillones en salsa de coco' },
      { name: 'Arroz con Camarones', price: 42000, cost_price: 16800, category_id: categoryId, description: 'Arroz cremoso con camarones salteados' },
      { name: 'Filete de Robalo', price: 48000, cost_price: 19200, category_id: categoryId, description: 'Filete de robalo a la plancha con vegetales' },
      { name: 'Langostinos al Ajillo', price: 58000, cost_price: 26100, category_id: categoryId, description: 'Langostinos salteados en aceite de oliva y ajo' },
      { name: 'Coctel de Camarón', price: 28000, cost_price: 11200, category_id: categoryId, description: 'Camarones frescos con salsa rosada' },
      { name: 'Sopa Marinera', price: 32000, cost_price: 12800, category_id: categoryId, description: 'Sopa tradicional con variedad de mariscos' },
      { name: 'Calamares Fritos', price: 35000, cost_price: 14000, category_id: categoryId, description: 'Anillos de calamar apanados y fritos' },
      { name: 'Mojarra Frita', price: 36000, cost_price: 13500, category_id: categoryId, description: 'Mojarra entera frita con patacones' },
      { name: 'Pulpo a la Parrilla', price: 62000, cost_price: 28000, category_id: categoryId, description: 'Pulpo a la brasa con papas criollas' },
      { name: 'Limonada de Coco', price: 8000, cost_price: 2400, category_id: bebidasCategoryId, description: 'Limonada refrescante con leche de coco' },
      { name: 'Cerveza Corona', price: 12000, cost_price: 5500, category_id: bebidasCategoryId, description: 'Cerveza Corona 330ml' },
    ];

    const productIds: Record<string, string> = {};
    for (const prod of productsData) {
      const { data } = await supabase
        .from('products')
        .insert({
          ...prod,
          user_id: userId,
          is_active: true,
          sku: `MAR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
        })
        .select()
        .single();
      if (data) {
        productIds[prod.name] = data.id;
        // Create inventory entry
        await supabase.from('inventory').insert({
          product_id: data.id,
          user_id: userId,
          current_stock: 100,
          min_stock: 10,
          unit: 'unidades'
        });
      }
    }
    console.log('✅ Productos creados:', Object.keys(productIds).length);

    // 8. Create product-ingredient relationships (recipes)
    const recipes: { product: string; ingredients: { name: string; qty: number }[] }[] = [
      { product: 'Ceviche Mixto', ingredients: [
        { name: 'Camarón tigre', qty: 0.2 }, { name: 'Calamar', qty: 0.15 }, 
        { name: 'Pescado robalo', qty: 0.1 }, { name: 'Limón', qty: 0.1 }, 
        { name: 'Cebolla morada', qty: 0.05 }, { name: 'Cilantro', qty: 0.5 }
      ]},
      { product: 'Cazuela de Mariscos', ingredients: [
        { name: 'Camarón tigre', qty: 0.15 }, { name: 'Langostinos', qty: 0.1 },
        { name: 'Mejillones', qty: 0.1 }, { name: 'Calamar', qty: 0.05 },
        { name: 'Leche de coco', qty: 0.2 }, { name: 'Ajo', qty: 0.02 }
      ]},
      { product: 'Arroz con Camarones', ingredients: [
        { name: 'Camarón tigre', qty: 0.25 }, { name: 'Arroz', qty: 0.15 },
        { name: 'Cebolla morada', qty: 0.03 }, { name: 'Ajo', qty: 0.01 }
      ]},
      { product: 'Filete de Robalo', ingredients: [
        { name: 'Pescado robalo', qty: 0.3 }, { name: 'Aceite de oliva', qty: 0.02 },
        { name: 'Ajo', qty: 0.01 }, { name: 'Limón', qty: 0.05 }
      ]},
      { product: 'Langostinos al Ajillo', ingredients: [
        { name: 'Langostinos', qty: 0.3 }, { name: 'Aceite de oliva', qty: 0.05 },
        { name: 'Ajo', qty: 0.03 }
      ]},
      { product: 'Coctel de Camarón', ingredients: [
        { name: 'Camarón tigre', qty: 0.2 }, { name: 'Limón', qty: 0.03 },
        { name: 'Tomate', qty: 0.05 }
      ]},
      { product: 'Sopa Marinera', ingredients: [
        { name: 'Camarón tigre', qty: 0.1 }, { name: 'Pescado robalo', qty: 0.1 },
        { name: 'Mejillones', qty: 0.08 }, { name: 'Papa criolla', qty: 0.1 },
        { name: 'Cilantro', qty: 0.3 }
      ]},
      { product: 'Calamares Fritos', ingredients: [
        { name: 'Calamar', qty: 0.25 }, { name: 'Limón', qty: 0.02 }
      ]},
      { product: 'Mojarra Frita', ingredients: [
        { name: 'Mojarra', qty: 1 }, { name: 'Limón', qty: 0.03 }
      ]},
      { product: 'Pulpo a la Parrilla', ingredients: [
        { name: 'Pulpo', qty: 0.35 }, { name: 'Papa criolla', qty: 0.15 },
        { name: 'Aceite de oliva', qty: 0.03 }
      ]},
      { product: 'Limonada de Coco', ingredients: [
        { name: 'Limón', qty: 0.08 }, { name: 'Leche de coco', qty: 0.1 },
        { name: 'Coco fresco', qty: 0.5 }
      ]},
      { product: 'Cerveza Corona', ingredients: [
        { name: 'Cerveza Corona', qty: 1 }
      ]}
    ];

    for (const recipe of recipes) {
      const productId = productIds[recipe.product];
      if (!productId) continue;
      
      for (const ing of recipe.ingredients) {
        const ingredientId = ingredientIds[ing.name];
        if (!ingredientId) continue;
        
        await supabase.from('product_ingredients').insert({
          product_id: productId,
          ingredient_id: ingredientId,
          quantity_needed: ing.qty
        });
      }
    }
    console.log('✅ Recetas creadas');

    // 9. Create 60 days of sales using BATCH INSERTS for speed
    const productNames = Object.keys(productIds);
    const now = new Date();
    
    // Pre-generate all sales data
    const allSales: any[] = [];
    const allSaleItemsData: { saleIndex: number; productId: string; quantity: number; unitPrice: number }[] = [];
    
    for (let daysAgo = 59; daysAgo >= 0; daysAgo--) {
      const baseDate = new Date(now);
      baseDate.setDate(baseDate.getDate() - daysAgo);
      
      const dayOfWeek = baseDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
      const numTransactions = isWeekend ? 25 : 15; // Reduced for speed
      
      for (let t = 0; t < numTransactions; t++) {
        const saleDate = new Date(baseDate);
        saleDate.setHours(11 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60), 0, 0);
        
        const numItems = 1 + Math.floor(Math.random() * 3);
        let subtotal = 0;
        const itemsForThisSale: typeof allSaleItemsData = [];
        
        for (let i = 0; i < numItems; i++) {
          const productName = productNames[Math.floor(Math.random() * productNames.length)];
          const product = productsData.find(p => p.name === productName)!;
          const quantity = productName.includes('Cerveza') ? (1 + Math.floor(Math.random() * 2)) : 1;
          
          itemsForThisSale.push({
            saleIndex: allSales.length,
            productId: productIds[productName],
            quantity,
            unitPrice: product.price
          });
          subtotal += product.price * quantity;
        }
        
        // Random tip (30% chance) - add to total
        const hasTip = Math.random() < 0.3;
        const tipAmount = hasTip ? Math.round(subtotal * 0.1) : 0;
        const pmRand = Math.random();
        
        allSales.push({
          user_id: userId,
          total_amount: subtotal + tipAmount,
          payment_method: pmRand < 0.4 ? 'efectivo' : pmRand < 0.75 ? 'tarjeta' : 'transferencia',
          status: 'completed',
          table_number: 1 + Math.floor(Math.random() * 15),
          created_at: saleDate.toISOString()
        });
        
        allSaleItemsData.push(...itemsForThisSale);
      }
    }
    
    console.log(`📊 Generando ${allSales.length} ventas en lotes...`);
    
    // Insert sales in batches of 50
    const BATCH_SIZE = 50;
    const createdSaleIds: string[] = [];
    
    for (let i = 0; i < allSales.length; i += BATCH_SIZE) {
      const batch = allSales.slice(i, i + BATCH_SIZE);
      const { data: insertedSales, error } = await supabase
        .from('sales')
        .insert(batch)
        .select('id');
      
      if (error) {
        console.error('Error inserting sales batch:', error);
        continue;
      }
      if (insertedSales) {
        createdSaleIds.push(...insertedSales.map(s => s.id));
      }
    }
    
    console.log(`✅ Ventas insertadas: ${createdSaleIds.length}`);
    
    // Now insert sale items in batches
    const allSaleItems = allSaleItemsData.map(item => ({
      sale_id: createdSaleIds[item.saleIndex],
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.unitPrice * item.quantity
    })).filter(item => item.sale_id); // Filter out any with missing sale_id
    
    for (let i = 0; i < allSaleItems.length; i += BATCH_SIZE) {
      const batch = allSaleItems.slice(i, i + BATCH_SIZE);
      await supabase.from('sale_items').insert(batch);
    }
    
    console.log(`✅ Items de venta insertados: ${allSaleItems.length}`);

    // 10. Create employees (simplified - no time clock history for speed)
    const employees = [
      { full_name: 'Carlos Mendoza', email: 'carlos.chef@marisqueria.com', role: 'employee', employee_type: 'fixed', hourly_rate: 18000 },
      { full_name: 'María Rodríguez', email: 'maria.mesera@marisqueria.com', role: 'employee', employee_type: 'fixed', hourly_rate: 10000 },
      { full_name: 'Juan Pérez', email: 'juan.mesero@marisqueria.com', role: 'employee', employee_type: 'fixed', hourly_rate: 10000 },
      { full_name: 'Ana García', email: 'ana.cajera@marisqueria.com', role: 'cashier', employee_type: 'fixed', hourly_rate: 12000 },
      { full_name: 'Pedro Sánchez', email: 'pedro.ayudante@marisqueria.com', role: 'employee', employee_type: 'hourly', hourly_rate: 8500 },
    ];

    let employeesCreated = 0;
    for (const emp of employees) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingEmp = existingUsers?.users?.find(u => u.email === emp.email);
        
        let empUserId: string;
        if (existingEmp) {
          empUserId = existingEmp.id;
        } else {
          const { data: empUser, error: empError } = await supabase.auth.admin.createUser({
            email: emp.email,
            password: 'Empleado2024!',
            email_confirm: true,
            user_metadata: { full_name: emp.full_name }
          });
          if (empError || !empUser?.user) continue;
          empUserId = empUser.user.id;
        }

        await supabase.from('profiles').upsert({
          id: empUserId,
          email: emp.email,
          full_name: emp.full_name,
          role: emp.role as any,
          employee_type: emp.employee_type,
          hourly_rate: emp.hourly_rate,
          restaurant_id: restaurantId,
          is_active: true,
          work_latitude: 4.6761,
          work_longitude: -74.0486,
          location_radius: 50,
          work_address: 'Carrera 15 #93-75, Chapinero, Bogotá',
          created_by: userId
        }, { onConflict: 'id' });
        
        employeesCreated++;
      } catch (e) {
        console.log(`Error con empleado ${emp.email}:`, e);
      }
    }
    console.log('✅ Empleados creados:', employeesCreated);

    // 11. Setup AI daily limits
    await supabase.from('ai_daily_limits').upsert({
      restaurant_id: restaurantId,
      daily_limit: 10,
      current_usage: 0,
      plan_type: 'basic',
      reset_date: new Date().toISOString().split('T')[0]
    }, { onConflict: 'restaurant_id' });

    // 12. Create AI conversation history
    const { data: conversation } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        restaurant_id: restaurantId,
        title: 'Análisis del Negocio - Marisquería',
        is_temporary: false
      })
      .select()
      .single();

    if (conversation) {
      const messages = [
        { role: 'user', content: '¿Cuál es mi producto más vendido este mes?' },
        { role: 'assistant', content: 'Basándome en tus datos de ventas, la **Cazuela de Mariscos** es tu producto estrella este mes con aproximadamente 180 unidades vendidas, representando el 22% de tus ingresos totales. Le sigue el **Arroz con Camarones** con 145 unidades. Te recomiendo mantener stock suficiente de langostinos y mejillones, que son los ingredientes clave de la cazuela.' },
        { role: 'user', content: '¿Cómo van mis ventas comparadas con el mes pasado?' },
        { role: 'assistant', content: '📈 **Excelentes noticias!** Tus ventas muestran un crecimiento del 14% respecto al mes anterior:\n\n- **Mes actual:** ~$18,500,000 COP\n- **Mes anterior:** ~$16,200,000 COP\n\nLos fines de semana siguen siendo tus días más fuertes, especialmente los sábados. El ticket promedio subió de $78,000 a $85,000 COP, lo que indica que los clientes están pidiendo más por visita.' }
      ];

      for (const msg of messages) {
        await supabase.from('ai_conversation_messages').insert({
          conversation_id: conversation.id,
          role: msg.role,
          content: msg.content
        });
      }
    }
    console.log('✅ Configuración IA completada');

    // Calculate summary stats
    const { data: salesStats } = await supabase
      .from('sales')
      .select('total_amount, created_at')
      .eq('user_id', userId);

    const thisMonth = salesStats?.filter(s => {
      const d = new Date(s.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;

    const avgTicket = salesStats && salesStats.length > 0 
      ? Math.round(salesStats.reduce((sum, s) => sum + Number(s.total_amount), 0) / salesStats.length)
      : 0;

    return new Response(JSON.stringify({
      success: true,
      message: '🦐 Demo Marisquería del Pacífico creado exitosamente',
      credentials: {
        email: demoEmail,
        password: demoPassword
      },
      stats: {
        products: Object.keys(productIds).length,
        ingredients: Object.keys(ingredientIds).length,
        sales: createdSaleIds.length,
        employees: employeesCreated,
        monthly_sales: `$${thisMonth.toLocaleString('es-CO')} COP`,
        avg_ticket: `$${avgTicket.toLocaleString('es-CO')} COP`
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
