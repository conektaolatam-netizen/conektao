import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { extractedData, userId, receiptUrl, paidWithCash } = await req.json();

    if (!extractedData || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Updating inventory automatically for user:', userId, 'Paid with cash:', paidWithCash);

    // 1. Create expense record first
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        supplier_name: extractedData.supplier_name,
        invoice_number: extractedData.invoice_number,
        expense_date: extractedData.date,
        currency: extractedData.currency || 'MXN',
        subtotal: extractedData.subtotal,
        tax: extractedData.tax || 0,
        total_amount: extractedData.total,
        status: 'processed',
        ai_analysis: extractedData,
        receipt_url: receiptUrl || null
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Error creating expense:', expenseError);
      return new Response(
        JSON.stringify({ error: 'Failed to save expense' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Expense created:', expense.id);

    const updatedProducts = [];
    const newProducts = [];

    // 2. Process each item and update inventory
    for (const item of extractedData.items) {
      console.log(`Processing item: ${item.description}`);

      // Find matching product (exact or similar)
      const { data: matchingProducts } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', `%${item.description}%`)
        .limit(1);

      let productId = null;
      
      if (matchingProducts && matchingProducts.length > 0) {
        // Product exists - update it
        productId = matchingProducts[0].id;
        
        // Update product cost price with the new price from invoice
        await supabase
          .from('products')
          .update({
            cost_price: item.unit_price,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        // Find existing inventory
        const { data: inventory } = await supabase
          .from('inventory')
          .select('*')
          .eq('product_id', productId)
          .maybeSingle();

        if (inventory) {
          // Update existing inventory
          const newStock = inventory.current_stock + item.quantity;
          await supabase
            .from('inventory')
            .update({
              current_stock: newStock,
              last_updated: new Date().toISOString()
            })
            .eq('id', inventory.id);

          updatedProducts.push({
            name: item.description,
            previous_stock: inventory.current_stock,
            new_stock: newStock,
            added_quantity: item.quantity,
            unit_cost: item.unit_price
          });
        } else {
          // Create new inventory entry for existing product
          await supabase
            .from('inventory')
            .insert({
              product_id: productId,
              current_stock: item.quantity,
              min_stock: 5,
              unit: item.unit || 'unidades',
              user_id: userId
            });

          updatedProducts.push({
            name: item.description,
            previous_stock: 0,
            new_stock: item.quantity,
            added_quantity: item.quantity,
            unit_cost: item.unit_price
          });
        }

        // Create inventory movement
        await supabase
          .from('inventory_movements')
          .insert({
            product_id: productId,
            movement_type: 'IN',
            quantity: item.quantity,
            reference_type: 'PURCHASE',
            reference_id: expense.id,
            notes: `Compra automática - Factura ${extractedData.invoice_number}`
          });

      } else {
        // Product doesn't exist - create new product and inventory
        console.log(`Creating new product: ${item.description}`);
        
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            name: item.description,
            cost_price: item.unit_price,
            price: item.unit_price * 1.5, // Default markup of 50%
            user_id: userId,
            is_active: true,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (productError) {
          console.error('Error creating product:', productError);
          continue; // Skip this item and continue with others
        }

        productId = newProduct.id;

        // Create inventory for new product
        await supabase
          .from('inventory')
          .insert({
            product_id: productId,
            current_stock: item.quantity,
            min_stock: 5,
            unit: item.unit || 'unidades',
            user_id: userId
          });

        // Create inventory movement
        await supabase
          .from('inventory_movements')
          .insert({
            product_id: productId,
            movement_type: 'IN',
            quantity: item.quantity,
            reference_type: 'PURCHASE',
            reference_id: expense.id,
            notes: `Producto nuevo - Factura ${extractedData.invoice_number}`
          });

        newProducts.push({
          name: item.description,
          initial_stock: item.quantity,
          unit_cost: item.unit_price,
          selling_price: item.unit_price * 1.5
        });
      }

      // 3. Create expense item record
      await supabase
        .from('expense_items')
        .insert({
          expense_id: expense.id,
          product_id: productId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'unidades',
          unit_price: item.unit_price,
          subtotal: item.subtotal
        });
    }

    // 4. Si se pagó en efectivo, registrar en la caja
    let cashPaymentRegistered = false;
    if (paidWithCash) {
      try {
        // Obtener el restaurant_id del usuario
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('restaurant_id')
          .eq('id', userId)
          .single();

        if (userProfile?.restaurant_id) {
          // Buscar caja abierta del día actual
          const { data: openCashRegister } = await supabase
            .from('cash_registers')
            .select('*')
            .eq('restaurant_id', userProfile.restaurant_id)
            .eq('date', new Date().toISOString().split('T')[0])
            .eq('is_closed', false)
            .maybeSingle();

          if (openCashRegister) {
            // Registrar pago en efectivo
            await supabase
              .from('cash_payments')
              .insert({
                cash_register_id: openCashRegister.id,
                user_id: userId,
                amount: -extractedData.total, // Negativo porque es un gasto
                description: `Compra - ${extractedData.supplier_name}`,
                category: 'compras',
                payment_method: 'efectivo'
              });

            cashPaymentRegistered = true;
            console.log('Cash payment registered in cash register:', openCashRegister.id);
          } else {
            console.log('No open cash register found for today');
          }
        }
      } catch (cashError) {
        console.error('Error registering cash payment:', cashError);
        // No fallar el proceso principal, solo loguear
      }
    }

    console.log('Inventory update completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        expense_id: expense.id,
        updated_products: updatedProducts,
        new_products: newProducts,
        cash_payment_registered: cashPaymentRegistered,
        summary: {
          total_items: extractedData.items.length,
          products_updated: updatedProducts.length,
          products_created: newProducts.length,
          total_amount: extractedData.total,
          paid_with_cash: paidWithCash
        },
        message: `✅ Inventario actualizado: ${updatedProducts.length} productos actualizados, ${newProducts.length} productos nuevos creados${cashPaymentRegistered ? ' • Pago en efectivo registrado en caja' : ''}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-inventory-from-receipt:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});