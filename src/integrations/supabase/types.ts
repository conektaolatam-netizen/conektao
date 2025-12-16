export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ai_conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          is_temporary: boolean | null
          last_message_at: string | null
          restaurant_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_temporary?: boolean | null
          last_message_at?: string | null
          restaurant_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_temporary?: boolean | null
          last_message_at?: string | null
          restaurant_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_daily_limits: {
        Row: {
          additional_credits: number | null
          created_at: string | null
          current_usage: number | null
          daily_limit: number | null
          id: string
          plan_type: string | null
          reset_date: string | null
          restaurant_id: string | null
          updated_at: string | null
        }
        Insert: {
          additional_credits?: number | null
          created_at?: string | null
          current_usage?: number | null
          daily_limit?: number | null
          id?: string
          plan_type?: string | null
          reset_date?: string | null
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_credits?: number | null
          created_at?: string | null
          current_usage?: number | null
          daily_limit?: number | null
          id?: string
          plan_type?: string | null
          reset_date?: string | null
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_daily_limits_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_daily_recommendations: {
        Row: {
          applied_at: string | null
          created_at: string | null
          data_context: Json | null
          date: string | null
          id: string
          is_applied: boolean | null
          priority: string | null
          recommendation_text: string
          recommendation_type: string | null
          restaurant_id: string | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string | null
          data_context?: Json | null
          date?: string | null
          id?: string
          is_applied?: boolean | null
          priority?: string | null
          recommendation_text: string
          recommendation_type?: string | null
          restaurant_id?: string | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string | null
          data_context?: Json | null
          date?: string | null
          id?: string
          is_applied?: boolean | null
          priority?: string | null
          recommendation_text?: string
          recommendation_type?: string | null
          restaurant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_daily_recommendations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_tracking: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          date: string | null
          id: string
          question_text: string | null
          question_type: string
          response_text: string | null
          restaurant_id: string | null
          tokens_consumed: number | null
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          question_text?: string | null
          question_type: string
          response_text?: string | null
          restaurant_id?: string | null
          tokens_consumed?: number | null
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          question_text?: string | null
          question_type?: string
          response_text?: string | null
          restaurant_id?: string | null
          tokens_consumed?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_tracking_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      business_documents: {
        Row: {
          ai_analysis: Json | null
          content: Json
          created_at: string
          document_date: string
          document_type: string
          file_url: string | null
          id: string
          is_confidential: boolean | null
          metadata: Json | null
          restaurant_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          content: Json
          created_at?: string
          document_date: string
          document_type: string
          file_url?: string | null
          id?: string
          is_confidential?: boolean | null
          metadata?: Json | null
          restaurant_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          content?: Json
          created_at?: string
          document_date?: string
          document_type?: string
          file_url?: string | null
          id?: string
          is_confidential?: boolean | null
          metadata?: Json | null
          restaurant_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      business_payment_accounts: {
        Row: {
          account_holder: string
          account_number: string
          account_type: string
          created_at: string
          id: string
          is_active: boolean
          last_four_digits: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          account_holder: string
          account_number: string
          account_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_four_digits: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          account_holder?: string
          account_number?: string
          account_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_four_digits?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_payment_accounts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_payments: {
        Row: {
          amount: number
          cash_register_id: string
          category: string | null
          created_at: string
          description: string
          id: string
          payment_method: string
          user_id: string
        }
        Insert: {
          amount: number
          cash_register_id: string
          category?: string | null
          created_at?: string
          description: string
          id?: string
          payment_method?: string
          user_id: string
        }
        Update: {
          amount?: number
          cash_register_id?: string
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          payment_method?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_payments_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers: {
        Row: {
          cash_difference: number | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          current_cash: number | null
          date: string
          final_cash: number | null
          id: string
          is_closed: boolean
          notes: string | null
          opening_balance: number
          restaurant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cash_difference?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          current_cash?: number | null
          date?: string
          final_cash?: number | null
          id?: string
          is_closed?: boolean
          notes?: string | null
          opening_balance?: number
          restaurant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cash_difference?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          current_cash?: number | null
          date?: string
          final_cash?: number | null
          id?: string
          is_closed?: boolean
          notes?: string | null
          opening_balance?: number
          restaurant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          document_number: string
          document_type: string
          email: string
          full_name: string
          id: string
          phone: string | null
          restaurant_id: string
          tax_regime: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          document_number: string
          document_type: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          restaurant_id: string
          tax_regime?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          document_number?: string
          document_type?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          restaurant_id?: string
          tax_regime?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_items: {
        Row: {
          created_at: string
          description: string
          expense_id: string
          id: string
          product_id: string | null
          quantity: number
          subtotal: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          expense_id: string
          id?: string
          product_id?: string | null
          quantity: number
          subtotal: number
          unit?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          expense_id?: string
          id?: string
          product_id?: string | null
          quantity?: number
          subtotal?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_items_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          ai_analysis: Json | null
          created_at: string
          currency: string | null
          expense_date: string
          id: string
          invoice_number: string | null
          receipt_url: string | null
          status: string | null
          subtotal: number
          supplier_name: string | null
          tax: number | null
          total_amount: number
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string
          currency?: string | null
          expense_date?: string
          id?: string
          invoice_number?: string | null
          receipt_url?: string | null
          status?: string | null
          subtotal?: number
          supplier_name?: string | null
          tax?: number | null
          total_amount?: number
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string
          currency?: string | null
          expense_date?: string
          id?: string
          invoice_number?: string | null
          receipt_url?: string | null
          status?: string | null
          subtotal?: number
          supplier_name?: string | null
          tax?: number | null
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      ingredient_movements: {
        Row: {
          batch_code: string | null
          created_at: string | null
          id: string
          ingredient_id: string
          movement_type: string
          notes: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          waste_detected: boolean | null
        }
        Insert: {
          batch_code?: string | null
          created_at?: string | null
          id?: string
          ingredient_id: string
          movement_type: string
          notes?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          waste_detected?: boolean | null
        }
        Update: {
          batch_code?: string | null
          created_at?: string | null
          id?: string
          ingredient_id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          waste_detected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_movements_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_product_mappings: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          created_by_ai: boolean | null
          id: string
          ingredient_id: string
          notes: string | null
          product_name: string
          restaurant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          created_by_ai?: boolean | null
          id?: string
          ingredient_id: string
          notes?: string | null
          product_name: string
          restaurant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          created_by_ai?: boolean | null
          id?: string
          ingredient_id?: string
          notes?: string | null
          product_name?: string
          restaurant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_product_mappings_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_product_mappings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_recipes: {
        Row: {
          base_ingredient_id: string
          compound_ingredient_id: string
          created_at: string
          id: string
          quantity_needed: number
          unit: string
          updated_at: string
          yield_amount: number
        }
        Insert: {
          base_ingredient_id: string
          compound_ingredient_id: string
          created_at?: string
          id?: string
          quantity_needed: number
          unit?: string
          updated_at?: string
          yield_amount: number
        }
        Update: {
          base_ingredient_id?: string
          compound_ingredient_id?: string
          created_at?: string
          id?: string
          quantity_needed?: number
          unit?: string
          updated_at?: string
          yield_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_recipes_base_ingredient_id_fkey"
            columns: ["base_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_recipes_compound_ingredient_id_fkey"
            columns: ["compound_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          cost_per_unit: number | null
          created_at: string | null
          current_stock: number
          description: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          is_compound: boolean | null
          min_stock: number
          name: string
          restaurant_id: string | null
          unit: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string | null
          current_stock?: number
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          is_compound?: boolean | null
          min_stock?: number
          name: string
          restaurant_id?: string | null
          unit?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string | null
          current_stock?: number
          description?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          is_compound?: boolean | null
          min_stock?: number
          name?: string
          restaurant_id?: string | null
          unit?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      internal_productions: {
        Row: {
          compound_ingredient_id: string
          created_at: string
          id: string
          notes: string | null
          production_date: string
          quantity_produced: number
          restaurant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          compound_ingredient_id: string
          created_at?: string
          id?: string
          notes?: string | null
          production_date?: string
          quantity_produced: number
          restaurant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          compound_ingredient_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          production_date?: string
          quantity_produced?: number
          restaurant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_productions_compound_ingredient_id_fkey"
            columns: ["compound_ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_productions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          current_stock: number
          id: string
          last_updated: string | null
          max_stock: number | null
          min_stock: number | null
          product_id: string | null
          unit: string | null
          user_id: string | null
        }
        Insert: {
          current_stock?: number
          id?: string
          last_updated?: string | null
          max_stock?: number | null
          min_stock?: number | null
          product_id?: string | null
          unit?: string | null
          user_id?: string | null
        }
        Update: {
          current_stock?: number
          id?: string
          last_updated?: string | null
          max_stock?: number | null
          min_stock?: number | null
          product_id?: string | null
          unit?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_alerts: {
        Row: {
          created_at: string | null
          id: string
          ingredient_id: string | null
          is_read: boolean | null
          message: string
          resolved_at: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingredient_id?: string | null
          is_read?: boolean | null
          message: string
          resolved_at?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ingredient_id?: string | null
          is_read?: boolean | null
          message?: string
          resolved_at?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          id: string
          movement_type: string
          notes: string | null
          product_id: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          product_id?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          ai_validation_notes: string | null
          ai_validation_status: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          invoice_number: string
          invoice_type: string
          payment_method: string
          payment_voucher_url: string | null
          pdf_url: string | null
          restaurant_id: string
          sale_id: string | null
          sent_at: string | null
          sent_to_email: boolean | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          xml_url: string | null
        }
        Insert: {
          ai_validation_notes?: string | null
          ai_validation_status?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          invoice_number: string
          invoice_type: string
          payment_method: string
          payment_voucher_url?: string | null
          pdf_url?: string | null
          restaurant_id: string
          sale_id?: string | null
          sent_at?: string | null
          sent_to_email?: boolean | null
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          xml_url?: string | null
        }
        Update: {
          ai_validation_notes?: string | null
          ai_validation_status?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: string
          payment_method?: string
          payment_voucher_url?: string | null
          pdf_url?: string | null
          restaurant_id?: string
          sale_id?: string | null
          sent_at?: string | null
          sent_to_email?: boolean | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales_with_masked_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          kitchen_order_id: string
          message: string
          read_at: string | null
          restaurant_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          kitchen_order_id: string
          message: string
          read_at?: string | null
          restaurant_id: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          kitchen_order_id?: string
          message?: string
          read_at?: string | null
          restaurant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_notifications_kitchen_order_id_fkey"
            columns: ["kitchen_order_id"]
            isOneToOne: false
            referencedRelation: "kitchen_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_order_items: {
        Row: {
          created_at: string
          id: string
          kitchen_order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          special_instructions: string | null
          status: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          kitchen_order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          special_instructions?: string | null
          status?: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          kitchen_order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          special_instructions?: string | null
          status?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_order_items_kitchen_order_id_fkey"
            columns: ["kitchen_order_id"]
            isOneToOne: false
            referencedRelation: "kitchen_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          estimated_time: number | null
          id: string
          notes: string | null
          order_number: string
          priority: string | null
          restaurant_id: string
          sent_at: string
          started_at: string | null
          status: string
          table_number: number | null
          total_items: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          estimated_time?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          priority?: string | null
          restaurant_id: string
          sent_at?: string
          started_at?: string | null
          status?: string
          table_number?: number | null
          total_items?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          estimated_time?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          priority?: string | null
          restaurant_id?: string
          sent_at?: string
          started_at?: string | null
          status?: string
          table_number?: number | null
          total_items?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      menu_import_sessions: {
        Row: {
          categories_created: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          extracted_data: Json | null
          final_data: Json | null
          id: string
          original_images: string[] | null
          products_created: number | null
          restaurant_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          categories_created?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          final_data?: Json | null
          id?: string
          original_images?: string[] | null
          products_created?: number | null
          restaurant_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          categories_created?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          final_data?: Json | null
          id?: string
          original_images?: string[] | null
          products_created?: number | null
          restaurant_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_import_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_sales_targets: {
        Row: {
          created_at: string
          id: string
          month: number
          restaurant_id: string
          target_amount: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          restaurant_id: string
          target_amount?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          restaurant_id?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          commission_amount: number
          created_at: string
          external_transaction_id: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          payment_method: string
          payment_provider: string | null
          processed_at: string | null
          released_to_supplier_at: string | null
          restaurant_id: string
          status: Database["public"]["Enums"]["payment_status"]
          supplier_amount: number
          supplier_id: string
          transaction_number: string
          updated_at: string
        }
        Insert: {
          amount: number
          commission_amount: number
          created_at?: string
          external_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_method: string
          payment_provider?: string | null
          processed_at?: string | null
          released_to_supplier_at?: string | null
          restaurant_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          supplier_amount: number
          supplier_id: string
          transaction_number?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          commission_amount?: number
          created_at?: string
          external_transaction_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          payment_method?: string
          payment_provider?: string | null
          processed_at?: string | null
          released_to_supplier_at?: string | null
          restaurant_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          supplier_amount?: number
          supplier_id?: string
          transaction_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_validations: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          payment_method: string
          validated_at: string | null
          validated_by: string | null
          validation_details: Json | null
          validation_status: string
          voucher_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          payment_method: string
          validated_at?: string | null
          validated_by?: string | null
          validation_details?: Json | null
          validation_status: string
          voucher_url: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          payment_method?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_details?: Json | null
          validation_status?: string
          voucher_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_validations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      prelaunch_registrations: {
        Row: {
          branches: string
          business_name: string
          city: string
          created_at: string
          email: string
          free_trial_interest: string
          id: string
          improvements_wanted: string[]
          main_business_type: string
          name: string
          phone: string
          pos_name: string | null
          pos_uses: boolean
        }
        Insert: {
          branches: string
          business_name: string
          city: string
          created_at?: string
          email: string
          free_trial_interest: string
          id?: string
          improvements_wanted?: string[]
          main_business_type: string
          name: string
          phone: string
          pos_name?: string | null
          pos_uses?: boolean
        }
        Update: {
          branches?: string
          business_name?: string
          city?: string
          created_at?: string
          email?: string
          free_trial_interest?: string
          id?: string
          improvements_wanted?: string[]
          main_business_type?: string
          name?: string
          phone?: string
          pos_name?: string | null
          pos_uses?: boolean
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          created_at: string | null
          id: string
          ingredient_id: string
          product_id: string
          quantity_needed: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingredient_id: string
          product_id: string
          quantity_needed: number
        }
        Update: {
          created_at?: string | null
          id?: string
          ingredient_id?: string
          product_id?: string
          quantity_needed?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_toppings: {
        Row: {
          created_at: string
          id: string
          product_id: string
          topping_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          topping_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          topping_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price: number
          sku: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price: number
          sku?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price?: number
          sku?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          created_at: string
          created_by: string | null
          email: string
          employee_type: string | null
          face_descriptor: number[] | null
          face_enrolled_at: string | null
          face_photo_url: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          location_radius: number | null
          permissions: Json | null
          phone: string | null
          restaurant_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          work_address: string | null
          work_latitude: number | null
          work_longitude: number | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          created_at?: string
          created_by?: string | null
          email: string
          employee_type?: string | null
          face_descriptor?: number[] | null
          face_enrolled_at?: string | null
          face_photo_url?: string | null
          full_name: string
          hourly_rate?: number | null
          id: string
          is_active?: boolean | null
          location_radius?: number | null
          permissions?: Json | null
          phone?: string | null
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          work_address?: string | null
          work_latitude?: number | null
          work_longitude?: number | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          created_at?: string
          created_by?: string | null
          email?: string
          employee_type?: string | null
          face_descriptor?: number[] | null
          face_enrolled_at?: string | null
          face_photo_url?: string | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          location_radius?: number | null
          permissions?: Json | null
          phone?: string | null
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          work_address?: string | null
          work_latitude?: number | null
          work_longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          delivery_address: string | null
          delivery_date: string | null
          discount_amount: number | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          restaurant_id: string
          status: string | null
          subtotal: number
          supplier_id: string
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          restaurant_id: string
          status?: string | null
          subtotal: number
          supplier_id: string
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_address?: string | null
          delivery_date?: string | null
          discount_amount?: number | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          restaurant_id?: string
          status?: string | null
          subtotal?: number
          supplier_id?: string
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          category: string | null
          cook_time: number | null
          created_at: string
          description: string | null
          difficulty: string | null
          id: string
          ingredients: Json | null
          instructions: string | null
          is_active: boolean | null
          name: string
          prep_time: number | null
          servings: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          cook_time?: number | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          ingredients?: Json | null
          instructions?: string | null
          is_active?: boolean | null
          name: string
          prep_time?: number | null
          servings?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          cook_time?: number | null
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          ingredients?: Json | null
          instructions?: string | null
          is_active?: boolean | null
          name?: string
          prep_time?: number | null
          servings?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      restaurant_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          restaurant_id: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          restaurant_id: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          restaurant_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_invitations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          allow_sales_without_stock: boolean | null
          created_at: string
          default_tip_percentage: number | null
          id: string
          latitude: number | null
          location_radius: number | null
          longitude: number | null
          name: string
          nit: string | null
          owner_id: string
          tip_auto_distribute: boolean | null
          tip_cashier_can_distribute: boolean | null
          tip_default_distribution_type: string | null
          tip_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allow_sales_without_stock?: boolean | null
          created_at?: string
          default_tip_percentage?: number | null
          id?: string
          latitude?: number | null
          location_radius?: number | null
          longitude?: number | null
          name: string
          nit?: string | null
          owner_id: string
          tip_auto_distribute?: boolean | null
          tip_cashier_can_distribute?: boolean | null
          tip_default_distribution_type?: string | null
          tip_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allow_sales_without_stock?: boolean | null
          created_at?: string
          default_tip_percentage?: number | null
          id?: string
          latitude?: number | null
          location_radius?: number | null
          longitude?: number | null
          name?: string
          nit?: string | null
          owner_id?: string
          tip_auto_distribute?: boolean | null
          tip_cashier_can_distribute?: boolean | null
          tip_default_distribution_type?: string | null
          tip_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      sale_item_toppings: {
        Row: {
          created_at: string
          id: string
          quantity: number
          sale_item_id: string
          subtotal: number
          topping_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          quantity?: number
          sale_item_id: string
          subtotal: number
          topping_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          sale_item_id?: string
          subtotal?: number
          topping_id?: string
          unit_price?: number
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number
          sale_id: string | null
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          sale_id?: string | null
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          sale_id?: string | null
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales_with_masked_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string | null
          customer_email: string | null
          id: string
          idempotency_key: string | null
          payment_method: string
          status: string | null
          table_number: number | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: string | null
          id?: string
          idempotency_key?: string | null
          payment_method: string
          status?: string | null
          table_number?: number | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string | null
          id?: string
          idempotency_key?: string | null
          payment_method?: string
          status?: string | null
          table_number?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_settings: {
        Row: {
          auto_renew: boolean
          billing_cycle: string
          created_at: string
          expires_at: string | null
          id: string
          plan_type: string
          restaurant_id: string
          service_charge_enabled: boolean
          service_charge_percentage: number | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          billing_cycle?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          restaurant_id: string
          service_charge_enabled?: boolean
          service_charge_percentage?: number | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          billing_cycle?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          restaurant_id?: string
          service_charge_enabled?: boolean
          service_charge_percentage?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      supplier_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "supplier_products"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_orders: {
        Row: {
          commission_amount: number
          created_at: string
          delivered_at: string | null
          delivery_address: string
          delivery_instructions: string | null
          estimated_delivery: string | null
          id: string
          notes: string | null
          order_number: string
          ordered_by: string
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          restaurant_id: string
          shipping_cost: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          supplier_id: string
          tax_amount: number
          total_amount: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          commission_amount: number
          created_at?: string
          delivered_at?: string | null
          delivery_address: string
          delivery_instructions?: string | null
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          ordered_by: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          restaurant_id: string
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          supplier_id: string
          tax_amount?: number
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string
          delivery_instructions?: string | null
          estimated_delivery?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          ordered_by?: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          restaurant_id?: string
          shipping_cost?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          availability_status: string | null
          category: string | null
          created_at: string
          description: string | null
          dimensions: Json | null
          discount: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_new: boolean | null
          maximum_quantity: number | null
          minimum_quantity: number | null
          name: string
          price: number
          shipping_cost: number | null
          sku: string | null
          stock: number | null
          supplier_id: string | null
          tags: string[] | null
          tax_rate: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          availability_status?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          discount?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          maximum_quantity?: number | null
          minimum_quantity?: number | null
          name: string
          price: number
          shipping_cost?: number | null
          sku?: string | null
          stock?: number | null
          supplier_id?: string | null
          tags?: string[] | null
          tax_rate?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          availability_status?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          dimensions?: Json | null
          discount?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_new?: boolean | null
          maximum_quantity?: number | null
          minimum_quantity?: number | null
          name?: string
          price?: number
          shipping_cost?: number | null
          sku?: string | null
          stock?: number | null
          supplier_id?: string | null
          tags?: string[] | null
          tax_rate?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          order_id: string | null
          rating: number | null
          restaurant_id: string
          supplier_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          rating?: number | null
          restaurant_id: string
          supplier_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          rating?: number | null
          restaurant_id?: string
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_reviews_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_settings: {
        Row: {
          accepts_bank_transfer: boolean | null
          accepts_cash_on_delivery: boolean | null
          bank_account_info: Json | null
          business_description: string | null
          business_name: string
          commission_rate: number
          created_at: string
          delivery_time_max: number | null
          delivery_time_min: number | null
          id: string
          is_active: boolean | null
          minimum_order_amount: number | null
          shipping_cities: string[] | null
          shipping_coverage: Database["public"]["Enums"]["shipping_coverage"]
          updated_at: string
          user_id: string
          verification_documents: Json | null
          verification_status: string | null
        }
        Insert: {
          accepts_bank_transfer?: boolean | null
          accepts_cash_on_delivery?: boolean | null
          bank_account_info?: Json | null
          business_description?: string | null
          business_name: string
          commission_rate?: number
          created_at?: string
          delivery_time_max?: number | null
          delivery_time_min?: number | null
          id?: string
          is_active?: boolean | null
          minimum_order_amount?: number | null
          shipping_cities?: string[] | null
          shipping_coverage?: Database["public"]["Enums"]["shipping_coverage"]
          updated_at?: string
          user_id: string
          verification_documents?: Json | null
          verification_status?: string | null
        }
        Update: {
          accepts_bank_transfer?: boolean | null
          accepts_cash_on_delivery?: boolean | null
          bank_account_info?: Json | null
          business_description?: string | null
          business_name?: string
          commission_rate?: number
          created_at?: string
          delivery_time_max?: number | null
          delivery_time_min?: number | null
          id?: string
          is_active?: boolean | null
          minimum_order_amount?: number | null
          shipping_cities?: string[] | null
          shipping_coverage?: Database["public"]["Enums"]["shipping_coverage"]
          updated_at?: string
          user_id?: string
          verification_documents?: Json | null
          verification_status?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          category: string | null
          contact: string | null
          cover_image: string | null
          created_at: string
          delivery_time: string | null
          description: string | null
          email: string | null
          free_shipping: number | null
          id: string
          is_active: boolean | null
          location: string | null
          logo: string | null
          min_order: number | null
          name: string
          primary_color: string | null
          rating: number | null
          restaurant_id: string | null
          secondary_color: string | null
          specialties: Json | null
          type: string | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          category?: string | null
          contact?: string | null
          cover_image?: string | null
          created_at?: string
          delivery_time?: string | null
          description?: string | null
          email?: string | null
          free_shipping?: number | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          logo?: string | null
          min_order?: number | null
          name: string
          primary_color?: string | null
          rating?: number | null
          restaurant_id?: string | null
          secondary_color?: string | null
          specialties?: Json | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          category?: string | null
          contact?: string | null
          cover_image?: string | null
          created_at?: string
          delivery_time?: string | null
          description?: string | null
          email?: string | null
          free_shipping?: number | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          logo?: string | null
          min_order?: number | null
          name?: string
          primary_color?: string | null
          rating?: number | null
          restaurant_id?: string | null
          secondary_color?: string | null
          specialties?: Json | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      support_chats: {
        Row: {
          assigned_to: string | null
          category: string
          closed_at: string | null
          created_at: string
          first_response_at: string | null
          id: string
          priority: string
          resolved_at: string | null
          satisfaction_feedback: string | null
          satisfaction_rating: number | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          closed_at?: string | null
          created_at?: string
          first_response_at?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          satisfaction_feedback?: string | null
          satisfaction_rating?: number | null
          status?: string
          subject: string
          ticket_number?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string
          first_response_at?: string | null
          id?: string
          priority?: string
          resolved_at?: string | null
          satisfaction_feedback?: string | null
          satisfaction_rating?: number | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          chat_id: string
          created_at: string
          file_url: string | null
          id: string
          is_internal: boolean | null
          message: string
          message_type: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_internal?: boolean | null
          message: string
          message_type?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_internal?: boolean | null
          message?: string
          message_type?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "support_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      table_states: {
        Row: {
          created_at: string
          current_order: Json
          guest_count: number
          id: string
          order_total: number
          pending_command_reminder: boolean | null
          restaurant_id: string
          status: string
          table_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_order?: Json
          guest_count?: number
          id?: string
          order_total?: number
          pending_command_reminder?: boolean | null
          restaurant_id: string
          status?: string
          table_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_order?: Json
          guest_count?: number
          id?: string
          order_total?: number
          pending_command_reminder?: boolean | null
          restaurant_id?: string
          status?: string
          table_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      time_clock_records: {
        Row: {
          clock_type: Database["public"]["Enums"]["clock_type"]
          created_at: string
          device_info: Json | null
          employee_id: string
          face_confidence: number | null
          face_photo_url: string | null
          face_verified: boolean | null
          id: string
          is_valid_location: boolean | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          restaurant_id: string
          timestamp: string
        }
        Insert: {
          clock_type: Database["public"]["Enums"]["clock_type"]
          created_at?: string
          device_info?: Json | null
          employee_id: string
          face_confidence?: number | null
          face_photo_url?: string | null
          face_verified?: boolean | null
          id?: string
          is_valid_location?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          restaurant_id: string
          timestamp?: string
        }
        Update: {
          clock_type?: Database["public"]["Enums"]["clock_type"]
          created_at?: string
          device_info?: Json | null
          employee_id?: string
          face_confidence?: number | null
          face_photo_url?: string | null
          face_verified?: boolean | null
          id?: string
          is_valid_location?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          restaurant_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_records_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      tip_distributions: {
        Row: {
          cash_register_id: string | null
          created_at: string | null
          distributed_at: string | null
          distributed_by: string | null
          distribution_type: string
          id: string
          notes: string | null
          restaurant_id: string
          sale_id: string | null
          total_tip_amount: number
        }
        Insert: {
          cash_register_id?: string | null
          created_at?: string | null
          distributed_at?: string | null
          distributed_by?: string | null
          distribution_type?: string
          id?: string
          notes?: string | null
          restaurant_id: string
          sale_id?: string | null
          total_tip_amount: number
        }
        Update: {
          cash_register_id?: string | null
          created_at?: string | null
          distributed_at?: string | null
          distributed_by?: string | null
          distribution_type?: string
          id?: string
          notes?: string | null
          restaurant_id?: string
          sale_id?: string | null
          total_tip_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "tip_distributions_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_distributions_distributed_by_fkey"
            columns: ["distributed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_distributions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_distributions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_distributions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales_with_masked_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      tip_payouts: {
        Row: {
          amount: number
          created_at: string | null
          distribution_id: string
          employee_id: string
          hours_worked: number | null
          id: string
          paid_at: string | null
          paid_by: string | null
          percentage: number | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          distribution_id: string
          employee_id: string
          hours_worked?: number | null
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          percentage?: number | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          distribution_id?: string
          employee_id?: string
          hours_worked?: number | null
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          percentage?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tip_payouts_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "tip_distributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_payouts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_payouts_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      toppings: {
        Row: {
          cost_price: number | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          price: number
          restaurant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          restaurant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          restaurant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      sales_with_masked_emails: {
        Row: {
          created_at: string | null
          customer_email: string | null
          id: string | null
          payment_method: string | null
          status: string | null
          table_number: number | null
          total_amount: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email?: never
          id?: string | null
          payment_method?: string | null
          status?: string | null
          table_number?: number | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: never
          id?: string | null
          payment_method?: string | null
          status?: string | null
          table_number?: number | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      calculate_product_cost: {
        Args: { p_product_id: string }
        Returns: number
      }
      can_manage_restaurant: {
        Args: { target_restaurant_id: string }
        Returns: boolean
      }
      can_see_customer_emails: { Args: never; Returns: boolean }
      check_product_ingredients_available: {
        Args: { p_product_id: string; p_quantity?: number }
        Returns: {
          is_available: boolean
          limiting_ingredient_name: string
          max_units: number
        }[]
      }
      cleanup_expired_invitations: { Args: never; Returns: undefined }
      generate_monthly_invoice_document: {
        Args: { p_month: number; p_restaurant_id: string; p_year: number }
        Returns: string
      }
      get_current_user_role: { Args: never; Returns: string }
      is_owner_or_admin: {
        Args: { target_restaurant_id: string; user_id: string }
        Returns: boolean
      }
      mask_customer_email: { Args: { email: string }; Returns: string }
      reset_daily_ai_usage: { Args: never; Returns: undefined }
      seed_table_states: {
        Args: { p_count?: number; p_restaurant_id: string }
        Returns: undefined
      }
      user_restaurant_id: { Args: { _user_id: string }; Returns: string }
      validate_clock_location: {
        Args: {
          restaurant_id_param: string
          user_lat: number
          user_lng: number
        }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "restaurant" | "supplier"
      clock_type: "clock_in" | "clock_out"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      shipping_coverage: "national" | "local" | "cities"
      user_role: "owner" | "admin" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["restaurant", "supplier"],
      clock_type: ["clock_in", "clock_out"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      shipping_coverage: ["national", "local", "cities"],
      user_role: ["owner", "admin", "employee"],
    },
  },
} as const
