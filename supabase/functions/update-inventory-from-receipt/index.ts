import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentInfo {
  method: 'cash_register' | 'cash_petty' | 'transfer' | 'card' | 'credit' | 'loan' | 'split';
  amount: number;
  paidFromRegister?: boolean;
  transferReference?: string;
  transferBank?: string;
  creditDays?: number;
  creditDueDate?: string;
  loanSource?: string;
  loanReference?: string;
  splitDetails?: {
    cashAmount: number;
    otherAmount: number;
    otherMethod: 'transfer' | 'card';
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      extractedData, 
      userId, 
      receiptUrl, 
      paymentInfo, 
      paymentOnly,
      // New fields for deferred inventory and audit
      receiptState,
      originalExtraction,
      userCorrected,
      hasManualEdits,
      captureHashes,
      captureSource
    } = await req.json();

    if (!extractedData || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing invoice for user:', userId, 'Payment info:', paymentInfo);

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

    // If this is payment-only update (inventory already processed)
    if (paymentOnly && paymentInfo) {
      const result = await processPayment(supabase, restaurantId, userId, extractedData, paymentInfo, receiptUrl);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get product-ingredient mappings for this user
    const { data: mappings } = await supabase
      .from('ingredient_product_mappings')
      .select('product_name, ingredient_id')
      .eq('user_id', userId);
    
    const mappingsMap = new Map(mappings?.map(m => [m.product_name.toLowerCase(), m.ingredient_id]) || []);

    // Determine payment method and status for expense
    let paymentMethod = 'pending';
    let paymentStatus = 'pending';
    let currentReceiptState = receiptState || 'pending_confirmation';
    
    if (paymentInfo) {
      paymentMethod = paymentInfo.method;
      paymentStatus = paymentInfo.method === 'credit' ? 'credit' : 'paid';
    }

    // DEFERRED INVENTORY: Only apply inventory when state is PAID
    const shouldApplyInventory = currentReceiptState === 'paid' || 
                                  (paymentInfo && paymentStatus === 'paid');

    // 1. Create expense record first (always save for audit)
    const { data: expense, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        restaurant_id: restaurantId,
        supplier_name: extractedData.supplier_name,
        invoice_number: extractedData.invoice_number,
        expense_date: extractedData.date,
        currency: extractedData.currency || 'COP',
        subtotal: extractedData.subtotal,
        tax: extractedData.tax || 0,
        total_amount: extractedData.total,
        status: shouldApplyInventory ? 'processed' : 'pending_inventory',
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        payment_details: paymentInfo || null,
        ai_analysis: {
          ...extractedData,
          original_extraction: originalExtraction || extractedData,
          user_corrected: userCorrected || null,
          has_manual_edits: hasManualEdits || false,
          capture_hashes: captureHashes || [],
          capture_source: captureSource || 'camera',
          receipt_state: currentReceiptState
        },
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

    console.log('Expense created:', expense.id, '| Apply inventory:', shouldApplyInventory);

    // If payment is not complete, save and return without applying inventory
    if (!shouldApplyInventory) {
      // Save to business_documents for tracking
      await supabase
        .from('business_documents')
        .insert({
          restaurant_id: restaurantId,
          user_id: userId,
          document_type: 'supplier_invoice_pending',
          document_date: extractedData.date || new Date().toISOString().split('T')[0],
          title: `[PENDIENTE] Factura ${extractedData.invoice_number || 'S/N'} - ${extractedData.supplier_name}`,
          content: JSON.stringify({
            expense_id: expense.id,
            supplier_name: extractedData.supplier_name,
            invoice_number: extractedData.invoice_number,
            total: extractedData.total,
            items_count: extractedData.items?.length || 0,
            receipt_url: receiptUrl,
            receipt_state: currentReceiptState,
            has_manual_edits: hasManualEdits
          }),
          metadata: {
            expense_id: expense.id,
            receipt_state: currentReceiptState,
            pending_inventory: true
          }
        });

      return new Response(
        JSON.stringify({
          success: true,
          expense_id: expense.id,
          inventory_applied: false,
          message: '📋 Factura guardada. El inventario se actualizará cuando se registre el pago.',
          receipt_state: currentReceiptState
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PROCEED WITH INVENTORY UPDATE (state is PAID)

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
            continue;
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
          product_id: ingredientId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'kg',
          unit_price: item.unit_price,
          subtotal: item.subtotal
        });
    }

    // 4. Save invoice to business_documents for historical record
    await supabase
      .from('business_documents')
      .insert({
        restaurant_id: restaurantId,
        user_id: userId,
        document_type: 'supplier_invoice',
        document_date: extractedData.date || new Date().toISOString().split('T')[0],
        title: `Factura ${extractedData.invoice_number || 'S/N'} - ${extractedData.supplier_name}`,
        content: JSON.stringify({
          expense_id: expense.id,
          supplier_name: extractedData.supplier_name,
          invoice_number: extractedData.invoice_number,
          total: extractedData.total,
          items_count: extractedData.items?.length || 0,
          receipt_url: receiptUrl,
          payment_method: paymentMethod,
          payment_status: paymentStatus
        }),
        metadata: {
          expense_id: expense.id,
          supplier_name: extractedData.supplier_name,
          total_amount: extractedData.total,
          items_count: extractedData.items?.length || 0,
          ai_processed: true,
          confidence: extractedData.confidence
        }
      });

    console.log('Invoice saved to business_documents');

    // 5. Process payment if provided
    let paymentResult = null;
    if (paymentInfo) {
      paymentResult = await processPayment(supabase, restaurantId, userId, extractedData, paymentInfo, receiptUrl, expense.id);
    }

    console.log('Ingredients inventory update completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        expense_id: expense.id,
        updated_ingredients: updatedIngredients,
        new_ingredients: newIngredients,
        payment_result: paymentResult,
        summary: {
          total_items: extractedData.items.length,
          ingredients_updated: updatedIngredients.length,
          ingredients_created: newIngredients.length,
          total_amount: extractedData.total,
          payment_method: paymentInfo?.method || 'pending'
        },
        message: `✅ Inventario actualizado: ${updatedIngredients.length} actualizados, ${newIngredients.length} nuevos creados`
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

async function processPayment(
  supabase: any,
  restaurantId: string,
  userId: string,
  extractedData: any,
  paymentInfo: PaymentInfo,
  receiptUrl: string | null,
  expenseId?: string
) {
  const results: any = {
    cash_registered: false,
    accounts_payable_created: false,
    transaction_created: false
  };

  try {
    // Update expense with payment info if we have expense ID
    if (expenseId) {
      await supabase
        .from('expenses')
        .update({
          payment_method: paymentInfo.method,
          payment_status: paymentInfo.method === 'credit' ? 'credit' : 'paid',
          payment_details: paymentInfo
        })
        .eq('id', expenseId);
    }

    const totalAmount = extractedData.total || paymentInfo.amount;

    // Process based on payment method
    switch (paymentInfo.method) {
      case 'cash_register':
      case 'cash_petty': {
        // Register cash payment in cash register
        const { data: openCashRegister } = await supabase
          .from('cash_registers')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('date', new Date().toISOString().split('T')[0])
          .eq('is_closed', false)
          .maybeSingle();

        if (openCashRegister) {
          await supabase
            .from('cash_payments')
            .insert({
              cash_register_id: openCashRegister.id,
              user_id: userId,
              amount: -totalAmount,
              description: `Compra proveedor - ${extractedData.supplier_name}`,
              category: 'compras',
              payment_method: paymentInfo.method === 'cash_register' ? 'efectivo' : 'caja_menor'
            });
          results.cash_registered = true;
          console.log('Cash payment registered');
        }
        break;
      }

      case 'credit': {
        // Create accounts payable record
        const dueDate = paymentInfo.creditDueDate 
          ? new Date(paymentInfo.creditDueDate).toISOString().split('T')[0]
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        await supabase
          .from('accounts_payable')
          .insert({
            restaurant_id: restaurantId,
            user_id: userId,
            supplier_name: extractedData.supplier_name,
            invoice_number: extractedData.invoice_number,
            expense_id: expenseId,
            amount: totalAmount,
            due_date: dueDate,
            status: 'open',
            notes: `Crédito ${paymentInfo.creditDays || 30} días`
          });
        
        results.accounts_payable_created = true;
        console.log('Accounts payable created, due:', dueDate);
        break;
      }

      case 'transfer':
      case 'card': {
        // Just record the transaction - doesn't affect cash register
        results.transaction_created = true;
        results.transaction_details = {
          method: paymentInfo.method,
          reference: paymentInfo.transferReference,
          bank: paymentInfo.transferBank
        };
        console.log(`${paymentInfo.method} payment recorded`);
        break;
      }

      case 'split': {
        // Handle split payment - cash portion goes to register
        if (paymentInfo.splitDetails?.cashAmount) {
          const { data: openCashRegister } = await supabase
            .from('cash_registers')
            .select('*')
            .eq('restaurant_id', restaurantId)
            .eq('date', new Date().toISOString().split('T')[0])
            .eq('is_closed', false)
            .maybeSingle();

          if (openCashRegister) {
            await supabase
              .from('cash_payments')
              .insert({
                cash_register_id: openCashRegister.id,
                user_id: userId,
                amount: -paymentInfo.splitDetails.cashAmount,
                description: `Compra proveedor (parcial efectivo) - ${extractedData.supplier_name}`,
                category: 'compras',
                payment_method: 'efectivo'
              });
            results.cash_registered = true;
          }
        }
        results.split_details = paymentInfo.splitDetails;
        console.log('Split payment processed');
        break;
      }
    }

    return {
      success: true,
      ...results
    };

  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
}