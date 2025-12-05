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

    console.log('Updating ingredients inventory for user:', userId, 'Paid with cash:', paidWithCash);

    // Get user's restaurant_id
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('restaurant_id')
      .eq('id', userId)
      .single();

    if (!userProfile?.restaurant_id) {
      return new Response(
        JSON.stringify({ error: 'User restaurant not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const restaurantId = userProfile.restaurant_id;

    // Get product-ingredient mappings for this user
    const { data: mappings } = await supabase
      .from('ingredient_product_mappings')
      .select('product_name, ingredient_id')
      .eq('user_id', userId);
    
    const mappingsMap = new Map(mappings?.map(m => [m.product_name.toLowerCase(), m.ingredient_id]) || []);

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

    const updatedIngredients = [];
    const newIngredients = [];

    // 2. Process each item and update ingredients inventory
    for (const item of extractedData.items) {
      console.log(`Processing ingredient: ${item.description}`);

      let ingredientId = null;
      
      // First, check if there's a learned mapping for this product
      const productNameOnReceipt = item.product_name_on_receipt || item.description;
      const mappedIngredientId = mappingsMap.get(productNameOnReceipt.toLowerCase());
      
      if (mappedIngredientId) {
        // Use the mapped ingredient directly
        const { data: mappedIngredient } = await supabase
          .from('ingredients')
          .select('*')
          .eq('id', mappedIngredientId)
          .eq('is_active', true)
          .single();
        
        if (mappedIngredient) {
          console.log(`Using learned mapping: ${productNameOnReceipt} -> ${mappedIngredient.name}`);
          ingredientId = mappedIngredient.id;
          
          // Update the ingredient stock with weighted average cost
          const currentStock = mappedIngredient.current_stock || 0;
          const currentCost = mappedIngredient.cost_per_unit || 0;
          const newQuantity = item.quantity;
          const newCost = item.unit_price;
          
          const newAvgCost = currentStock > 0 
            ? ((currentStock * currentCost) + (newQuantity * newCost)) / (currentStock + newQuantity)
            : newCost;

          const newStock = currentStock + newQuantity;

          await supabase
            .from('ingredients')
            .update({
              current_stock: newStock,
              cost_per_unit: newAvgCost,
              updated_at: new Date().toISOString()
            })
            .eq('id', ingredientId);

          updatedIngredients.push({
            name: item.description,
            previous_stock: currentStock,
            new_stock: newStock,
            added_quantity: newQuantity,
            previous_cost: currentCost,
            new_avg_cost: newAvgCost,
            unit: mappedIngredient.unit,
            mapped_from: productNameOnReceipt
          });

          // Create ingredient movement
          await supabase
            .from('ingredient_movements')
            .insert({
              ingredient_id: ingredientId,
              movement_type: 'IN',
              quantity: newQuantity,
              reference_type: 'PURCHASE',
              reference_id: expense.id,
              notes: `Compra - ${productNameOnReceipt} -> ${mappedIngredient.name}`
            });
        }
      }
      
      // If no mapping found, search by name similarity
      if (!ingredientId) {
        const { data: matchingIngredients } = await supabase
          .from('ingredients')
          .select('*')
          .eq('user_id', userId)
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true)
          .ilike('name', `%${item.description}%`)
          .limit(1);
        
        if (matchingIngredients && matchingIngredients.length > 0) {
        // Ingredient exists - update with weighted average cost
        const ingredient = matchingIngredients[0];
        ingredientId = ingredient.id;
        
        const currentStock = ingredient.current_stock || 0;
        const currentCost = ingredient.cost_per_unit || 0;
        const newQuantity = item.quantity;
        const newCost = item.unit_price;
        
        // Calculate weighted average cost: ((old_stock * old_cost) + (new_qty * new_cost)) / (old_stock + new_qty)
        const newAvgCost = currentStock > 0 
          ? ((currentStock * currentCost) + (newQuantity * newCost)) / (currentStock + newQuantity)
          : newCost;

        const newStock = currentStock + newQuantity;

        // Update ingredient with new stock and weighted average cost
        await supabase
          .from('ingredients')
          .update({
            current_stock: newStock,
            cost_per_unit: newAvgCost,
            updated_at: new Date().toISOString()
          })
          .eq('id', ingredientId);

        updatedIngredients.push({
          name: item.description,
          previous_stock: currentStock,
          new_stock: newStock,
          added_quantity: newQuantity,
          previous_cost: currentCost,
          new_avg_cost: newAvgCost,
          unit: ingredient.unit
        });

        console.log(`Updated ingredient ${item.description}: stock ${currentStock} -> ${newStock}, cost ${currentCost} -> ${newAvgCost}`);

        // Create ingredient movement
        await supabase
          .from('ingredient_movements')
          .insert({
            ingredient_id: ingredientId,
            movement_type: 'IN',
            quantity: newQuantity,
            reference_type: 'PURCHASE',
            reference_id: expense.id,
            notes: `Compra - Factura ${extractedData.invoice_number || 'N/A'}`,
            batch_code: item.batch_code || null
          });

        } else {
        // Ingredient doesn't exist - create new ingredient
        console.log(`Creating new ingredient: ${item.description}`);
        
        const { data: newIngredient, error: ingredientError } = await supabase
          .from('ingredients')
          .insert({
            name: item.description,
            current_stock: item.quantity,
            cost_per_unit: item.unit_price,
            unit: item.unit || 'kg',
            min_stock: 5,
            user_id: userId,
            restaurant_id: restaurantId,
            is_active: true,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (ingredientError) {
          console.error('Error creating ingredient:', ingredientError);
          continue; // Skip this item and continue with others
        }

        ingredientId = newIngredient.id;

        newIngredients.push({
          name: item.description,
          initial_stock: item.quantity,
          cost_per_unit: item.unit_price,
          unit: item.unit || 'kg'
        });

        console.log(`Created new ingredient ${item.description}: stock ${item.quantity}, cost ${item.unit_price}`);

        // Create ingredient movement
        await supabase
          .from('ingredient_movements')
          .insert({
            ingredient_id: ingredientId,
            movement_type: 'IN',
            quantity: item.quantity,
            reference_type: 'PURCHASE',
            reference_id: expense.id,
            notes: `Ingrediente nuevo - Factura ${extractedData.invoice_number || 'N/A'}`,
            batch_code: item.batch_code || null
          });
        }
      }

      // 3. Create expense item record
      await supabase
        .from('expense_items')
        .insert({
          expense_id: expense.id,
          product_id: ingredientId, // Using product_id field for ingredient reference
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'kg',
          unit_price: item.unit_price,
          subtotal: item.subtotal
        });
    }

    // 4. Si se pagó en efectivo, registrar en la caja
    let cashPaymentRegistered = false;
    if (paidWithCash) {
      try {
        // Buscar caja abierta del día actual
        const { data: openCashRegister } = await supabase
          .from('cash_registers')
          .select('*')
          .eq('restaurant_id', restaurantId)
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
      } catch (cashError) {
        console.error('Error registering cash payment:', cashError);
        // No fallar el proceso principal, solo loguear
      }
    }

    console.log('Ingredients inventory update completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        expense_id: expense.id,
        updated_ingredients: updatedIngredients,
        new_ingredients: newIngredients,
        cash_payment_registered: cashPaymentRegistered,
        summary: {
          total_items: extractedData.items.length,
          ingredients_updated: updatedIngredients.length,
          ingredients_created: newIngredients.length,
          total_amount: extractedData.total,
          paid_with_cash: paidWithCash
        },
        message: `✅ Inventario de ingredientes actualizado: ${updatedIngredients.length} actualizados (con precio promedio ponderado), ${newIngredients.length} nuevos creados${cashPaymentRegistered ? ' • Pago en efectivo registrado en caja' : ''}`
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
