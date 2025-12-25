import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Daily Close - Receipt Migration
 * 
 * Migrates all processed receipts from the day to Documents archive
 * Resets daily counters while keeping historical data intact
 * 
 * Called at day close (manual or automatic at 00:00)
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { restaurantId, userId, closeDate, manualClose } = await req.json();

    if (!restaurantId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing restaurantId or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetDate = closeDate || new Date().toISOString().split('T')[0];
    console.log(`Starting daily close for restaurant ${restaurantId} on ${targetDate}`);

    // 1. Get all expenses (receipts) from the day that are paid
    const { data: dayExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*, expense_items(*)')
      .eq('restaurant_id', restaurantId)
      .eq('payment_status', 'paid')
      .gte('expense_date', targetDate)
      .lt('expense_date', new Date(new Date(targetDate).getTime() + 86400000).toISOString().split('T')[0]);

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      throw expensesError;
    }

    console.log(`Found ${dayExpenses?.length || 0} paid expenses for ${targetDate}`);

    const migratedReceipts: any[] = [];
    const pendingReceipts: any[] = [];

    // 2. Process each expense
    for (const expense of dayExpenses || []) {
      // Archive to business_documents if not already archived
      const { data: existingDoc } = await supabase
        .from('business_documents')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .contains('metadata', { expense_id: expense.id, archived: true })
        .maybeSingle();

      if (!existingDoc) {
        // Create archived document
        const { error: docError } = await supabase
          .from('business_documents')
          .insert({
            restaurant_id: restaurantId,
            user_id: userId,
            document_type: 'supplier_invoice_archived',
            document_date: expense.expense_date,
            title: `[ARCHIVADO] Factura ${expense.invoice_number || 'S/N'} - ${expense.supplier_name}`,
            content: JSON.stringify({
              expense_id: expense.id,
              supplier_name: expense.supplier_name,
              invoice_number: expense.invoice_number,
              total: expense.total_amount,
              items: expense.expense_items,
              payment_method: expense.payment_method,
              payment_status: expense.payment_status,
              original_ai_analysis: expense.ai_analysis,
              archived_at: new Date().toISOString()
            }),
            metadata: {
              expense_id: expense.id,
              archived: true,
              archive_date: targetDate,
              close_type: manualClose ? 'manual' : 'automatic',
              total_amount: expense.total_amount,
              items_count: expense.expense_items?.length || 0
            }
          });

        if (docError) {
          console.error('Error archiving expense:', expense.id, docError);
        } else {
          migratedReceipts.push({
            expense_id: expense.id,
            supplier: expense.supplier_name,
            total: expense.total_amount
          });
        }
      }
    }

    // 3. Find pending receipts (not paid) to warn user
    const { data: pendingExpenses } = await supabase
      .from('expenses')
      .select('id, supplier_name, total_amount, payment_status')
      .eq('restaurant_id', restaurantId)
      .neq('payment_status', 'paid')
      .gte('expense_date', targetDate)
      .lt('expense_date', new Date(new Date(targetDate).getTime() + 86400000).toISOString().split('T')[0]);

    for (const pending of pendingExpenses || []) {
      pendingReceipts.push({
        expense_id: pending.id,
        supplier: pending.supplier_name,
        total: pending.total_amount,
        status: pending.payment_status
      });
    }

    // 4. Log the close event
    await supabase
      .from('audit_logs')
      .insert({
        restaurant_id: restaurantId,
        user_id: userId,
        table_name: 'daily_close',
        action: 'CLOSE_DAY_RECEIPTS',
        record_id: targetDate,
        new_values: {
          close_date: targetDate,
          close_type: manualClose ? 'manual' : 'automatic',
          migrated_count: migratedReceipts.length,
          pending_count: pendingReceipts.length,
          total_migrated_amount: migratedReceipts.reduce((sum, r) => sum + r.total, 0),
          total_pending_amount: pendingReceipts.reduce((sum, r) => sum + r.total, 0)
        }
      });

    console.log(`Daily close completed: ${migratedReceipts.length} migrated, ${pendingReceipts.length} pending`);

    return new Response(
      JSON.stringify({
        success: true,
        close_date: targetDate,
        close_type: manualClose ? 'manual' : 'automatic',
        summary: {
          migrated_count: migratedReceipts.length,
          pending_count: pendingReceipts.length,
          total_migrated_amount: migratedReceipts.reduce((sum, r) => sum + r.total, 0),
          total_pending_amount: pendingReceipts.reduce((sum, r) => sum + r.total, 0)
        },
        migrated_receipts: migratedReceipts,
        pending_receipts: pendingReceipts,
        message: pendingReceipts.length > 0 
          ? `⚠️ Hay ${pendingReceipts.length} facturas pendientes de pago que no fueron archivadas.`
          : `✅ ${migratedReceipts.length} facturas archivadas correctamente.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in daily-close-receipts:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
