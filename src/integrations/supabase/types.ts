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
      accounts_payable: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          expense_id: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          payment_reference: string | null
          restaurant_id: string
          status: string
          supplier_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          expense_id?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_reference?: string | null
          restaurant_id: string
          status?: string
          supplier_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          expense_id?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          payment_reference?: string | null
          restaurant_id?: string
          status?: string
          supplier_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
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
          alert_generated: boolean | null
          created_at: string | null
          id: string
          ip_address: string | null
          is_sensitive: boolean | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          restaurant_id: string | null
          table_name: string
          user_id: string | null
          user_name: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          alert_generated?: boolean | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          is_sensitive?: boolean | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          restaurant_id?: string | null
          table_name: string
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          alert_generated?: boolean | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          is_sensitive?: boolean | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          restaurant_id?: string | null
          table_name?: string
          user_id?: string | null
          user_name?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
      employee_bonuses: {
        Row: {
          ai_conversation_id: string | null
          bonus_type: string
          conditions: Json | null
          configured_via_ai: boolean | null
          created_at: string | null
          employee_id: string | null
          formula: Json | null
          frequency: string
          id: string
          is_active: boolean | null
          max_cap: number | null
          restaurant_id: string | null
          rule_description: string
          updated_at: string | null
        }
        Insert: {
          ai_conversation_id?: string | null
          bonus_type: string
          conditions?: Json | null
          configured_via_ai?: boolean | null
          created_at?: string | null
          employee_id?: string | null
          formula?: Json | null
          frequency: string
          id?: string
          is_active?: boolean | null
          max_cap?: number | null
          restaurant_id?: string | null
          rule_description: string
          updated_at?: string | null
        }
        Update: {
          ai_conversation_id?: string | null
          bonus_type?: string
          conditions?: Json | null
          configured_via_ai?: boolean | null
          created_at?: string | null
          employee_id?: string | null
          formula?: Json | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          max_cap?: number | null
          restaurant_id?: string | null
          rule_description?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_bonuses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_bonuses_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_permissions: {
        Row: {
          allowed: boolean | null
          created_at: string | null
          danger_confirmed_at: string | null
          danger_confirmed_by: string | null
          employee_id: string | null
          id: string
          module_key: string
          permission_key: string
          restaurant_id: string | null
          updated_at: string | null
        }
        Insert: {
          allowed?: boolean | null
          created_at?: string | null
          danger_confirmed_at?: string | null
          danger_confirmed_by?: string | null
          employee_id?: string | null
          id?: string
          module_key: string
          permission_key: string
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed?: boolean | null
          created_at?: string | null
          danger_confirmed_at?: string | null
          danger_confirmed_by?: string | null
          employee_id?: string | null
          id?: string
          module_key?: string
          permission_key?: string
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_permissions_danger_confirmed_by_fkey"
            columns: ["danger_confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_permissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_permissions_restaurant_id_fkey"
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
          payment_details: Json | null
          payment_method: string | null
          payment_status: string | null
          receipt_url: string | null
          restaurant_id: string | null
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
          payment_details?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          receipt_url?: string | null
          restaurant_id?: string | null
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
          payment_details?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          receipt_url?: string | null
          restaurant_id?: string | null
          status?: string | null
          subtotal?: number
          supplier_name?: string | null
          tax?: number | null
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      gas_anomalies: {
        Row: {
          anomaly_type: string
          assigned_to: string | null
          created_at: string | null
          delivery_id: string | null
          description: string | null
          details_json: Json | null
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          route_id: string | null
          severity: string | null
          status: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          anomaly_type: string
          assigned_to?: string | null
          created_at?: string | null
          delivery_id?: string | null
          description?: string | null
          details_json?: Json | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          route_id?: string | null
          severity?: string | null
          status?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          anomaly_type?: string
          assigned_to?: string | null
          created_at?: string | null
          delivery_id?: string | null
          description?: string | null
          details_json?: Json | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          route_id?: string | null
          severity?: string | null
          status?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gas_anomalies_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "gas_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gas_anomalies_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "gas_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gas_anomalies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      gas_ar_ledger: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          created_by: string | null
          delivery_id: string | null
          due_date: string | null
          entry_type: string
          id: string
          matched_at: string | null
          matched_by: string | null
          method: string | null
          notes: string | null
          reference_number: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          created_by?: string | null
          delivery_id?: string | null
          due_date?: string | null
          entry_type: string
          id?: string
          matched_at?: string | null
          matched_by?: string | null
          method?: string | null
          notes?: string | null
          reference_number?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          delivery_id?: string | null
          due_date?: string | null
          entry_type?: string
          id?: string
          matched_at?: string | null
          matched_by?: string | null
          method?: string | null
          notes?: string | null
          reference_number?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gas_ar_ledger_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "gas_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gas_ar_ledger_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "gas_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gas_ar_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      gas_clients: {
        Row: {
          address: string
          city: string | null
          client_type: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_json: Json | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          address: string
          city?: string | null
          client_type?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_json?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          client_type?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_json?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gas_clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      gas_deliveries: {
        Row: {
          client_id: string
          created_at: string | null
          delivered_at: string | null
          delivered_qty: number | null
          delivery_order: number | null
          id: string
          incident_reason: string | null
          location_lat: number | null
          location_lng: number | null
          location_meta: Json | null
          photo_url: string | null
          planned_qty: number
          receiver_name: string | null
          receiver_signature_url: string | null
          route_id: string
          status: string | null
          tenant_id: string
          total_amount: number | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          delivered_at?: string | null
          delivered_qty?: number | null
          delivery_order?: number | null
          id?: string
          incident_reason?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_meta?: Json | null
          photo_url?: string | null
          planned_qty: number
          receiver_name?: string | null
          receiver_signature_url?: string | null
          route_id: string
          status?: string | null
          tenant_id: string
          total_amount?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          delivered_at?: string | null
          delivered_qty?: number | null
          delivery_order?: number | null
          id?: string
          incident_reason?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_meta?: Json | null
          photo_url?: string | null
          planned_qty?: number
          receiver_name?: string | null
          receiver_signature_url?: string | null
          route_id?: string
          status?: string | null
          tenant_id?: string
          total_amount?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gas_deliveries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "gas_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gas_deliveries_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "gas_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gas_deliveries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      gas_inventory_ledger: {
        Row: {
          batch_code: string | null
          created_at: string | null
          created_by: string | null
          id: string
          movement_type: string
          notes: string | null
          plant_id: string | null
          qty: number
          reference_id: string | null
          reference_type: string | null
          tenant_id: string
          unit: string | null
          vehicle_id: string | null
        }
        Insert: {
          batch_code?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          plant_id?: string | null
          qty: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id: string
          unit?: string | null
          vehicle_id?: string | null
        }
        Update: {
          batch_code?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          plant_id?: string | null
          qty?: number
          reference_id?: string | null
          reference_type?: string | null
          tenant_id?: string
          unit?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gas_inventory_ledger_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "gas_plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gas_inventory_ledger_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gas_inventory_ledger_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "gas_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      gas_orders: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string | null
          delivery_id: string | null
          id: string
          notes: string | null
          order_number: string
          preferred_time: string | null
          requested_date: string | null
          requested_qty: number
          status: string | null
          tenant_id: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by?: string | null
          delivery_id?: string | null
          id?: string
          notes?: string | null
          order_number: string
          preferred_time?: string | null
          requested_date?: string | null
          requested_qty: number
          status?: string | null
          tenant_id: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          delivery_id?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          preferred_time?: string | null
          requested_date?: string | null
          requested_qty?: number
          status?: string | null
          tenant_id?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gas_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "gas_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gas_orders_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "gas_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gas_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      gas_payments_events: {
        Row: {
          collected_by_driver: boolean | null
          created_at: string | null
          created_by: string | null
          delivery_id: string
          id: string
          method: string
          notes: string | null
          proof_url: string | null
          tenant_id: string
        }
        Insert: {
          collected_by_driver?: boolean | null
          created_at?: string | null
          created_by?: string | null
          delivery_id: string
          id?: string
          method: string
          notes?: string | null
          proof_url?: string | null
          tenant_id: string
        }
        Update: {
          collected_by_driver?: boolean | null
          created_at?: string | null
          created_by?: string | null
          delivery_id?: string
          id?: string
          method?: string
          notes?: string | null
          proof_url?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gas_payments_events_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "gas_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gas_payments_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      gas_plants: {
        Row: {
          capacity_unit: string | null
          capacity_value: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          location_text: string | null
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          capacity_unit?: string | null
          capacity_value?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_text?: string | null
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          capacity_unit?: string | null
          capacity_value?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_text?: string | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gas_plants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      gas_price_rules: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          effective_from: string | null
          id: string
          is_active: boolean | null
          price_per_unit: number
          scope: string | null
          tenant_id: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          id?: string
          is_active?: boolean | null
          price_per_unit: number
          scope?: string | null
          tenant_id: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          id?: string
          is_active?: boolean | null
          price_per_unit?: number
          scope?: string | null
          tenant_id?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gas_price_rules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "gas_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gas_price_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      gas_routes: {
        Row: {
          actual_return_qty: number | null
          assigned_qty: number | null
          assigned_unit: string | null
          closed_at: string | null
          created_at: string | null
          created_by: string | null
          driver_user_id: string | null
          expected_return_qty: number | null
          id: string
          notes: string | null
          planned_date: string | null
          plant_id: string | null
          return_reviewed_at: string | null
          return_reviewed_by: string | null
          route_number: string
          started_at: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          actual_return_qty?: number | null
          assigned_qty?: number | null
          assigned_unit?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          driver_user_id?: string | null
          expected_return_qty?: number | null
          id?: string
          notes?: string | null
          planned_date?: string | null
          plant_id?: string | null
          return_reviewed_at?: string | null
          return_reviewed_by?: string | null
          route_number: string
          started_at?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          actual_return_qty?: number | null
          assigned_qty?: number | null
          assigned_unit?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          driver_user_id?: string | null
          expected_return_qty?: number | null
          id?: string
          notes?: string | null
          planned_date?: string | null
          plant_id?: string | null
          return_reviewed_at?: string | null
          return_reviewed_by?: string | null
          route_number?: string
          started_at?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gas_routes_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "gas_plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gas_routes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gas_routes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "gas_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      gas_vehicles: {
        Row: {
          capacity_unit: string | null
          capacity_value: number
          created_at: string | null
          docs_expiry_json: Json | null
          driver_name: string | null
          driver_phone: string | null
          id: string
          is_active: boolean | null
          last_maintenance_date: string | null
          plate: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          capacity_unit?: string | null
          capacity_value: number
          created_at?: string | null
          docs_expiry_json?: Json | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          is_active?: boolean | null
          last_maintenance_date?: string | null
          plate: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          capacity_unit?: string | null
          capacity_value?: number
          created_at?: string | null
          docs_expiry_json?: Json | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          is_active?: boolean | null
          last_maintenance_date?: string | null
          plate?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gas_vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
          inventory_type: string | null
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
          inventory_type?: string | null
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
          inventory_type?: string | null
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
      kitchen_order_events: {
        Row: {
          changed_by_name: string | null
          changed_by_user_id: string | null
          created_at: string
          id: string
          kitchen_order_id: string
          new_status: string
          order_id: string | null
          previous_status: string | null
          reason_comment: string | null
          reason_type: string | null
          restaurant_id: string
        }
        Insert: {
          changed_by_name?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          id?: string
          kitchen_order_id: string
          new_status: string
          order_id?: string | null
          previous_status?: string | null
          reason_comment?: string | null
          reason_type?: string | null
          restaurant_id: string
        }
        Update: {
          changed_by_name?: string | null
          changed_by_user_id?: string | null
          created_at?: string
          id?: string
          kitchen_order_id?: string
          new_status?: string
          order_id?: string | null
          previous_status?: string | null
          reason_comment?: string | null
          reason_type?: string | null
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_order_events_kitchen_order_id_fkey"
            columns: ["kitchen_order_id"]
            isOneToOne: false
            referencedRelation: "kitchen_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_order_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
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
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
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
          waiter_id: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
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
          waiter_id?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
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
          waiter_id?: string | null
        }
        Relationships: []
      }
      manual_receipts: {
        Row: {
          created_at: string
          document_date: string | null
          expense_id: string | null
          fallback_reason: string | null
          id: string
          items: Json
          notes: string | null
          payment_details: Json | null
          payment_method: string | null
          payment_status: string | null
          receipt_url: string | null
          restaurant_id: string | null
          status: string | null
          supplier_name: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_date?: string | null
          expense_id?: string | null
          fallback_reason?: string | null
          id?: string
          items?: Json
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          receipt_url?: string | null
          restaurant_id?: string | null
          status?: string | null
          supplier_name?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_date?: string | null
          expense_id?: string | null
          fallback_reason?: string | null
          id?: string
          items?: Json
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          payment_status?: string | null
          receipt_url?: string | null
          restaurant_id?: string | null
          status?: string | null
          supplier_name?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_receipts_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manual_receipts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
      owner_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          owner_id: string
          read_at: string | null
          related_record_id: string | null
          related_table: string | null
          restaurant_id: string
          severity: string
          title: string
          triggered_by: string | null
          triggered_by_name: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          owner_id: string
          read_at?: string | null
          related_record_id?: string | null
          related_table?: string | null
          restaurant_id: string
          severity?: string
          title: string
          triggered_by?: string | null
          triggered_by_name?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          owner_id?: string
          read_at?: string | null
          related_record_id?: string | null
          related_table?: string | null
          restaurant_id?: string
          severity?: string
          title?: string
          triggered_by?: string | null
          triggered_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_alerts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
      pos_suspicious_events: {
        Row: {
          created_at: string
          event_type: string
          has_items: boolean | null
          id: string
          items_count: number | null
          metadata: Json | null
          order_id: string | null
          order_total: number | null
          restaurant_id: string
          sale_id: string | null
          table_number: number | null
          user_id: string
          user_role: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          has_items?: boolean | null
          id?: string
          items_count?: number | null
          metadata?: Json | null
          order_id?: string | null
          order_total?: number | null
          restaurant_id: string
          sale_id?: string | null
          table_number?: number | null
          user_id: string
          user_role?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          has_items?: boolean | null
          id?: string
          items_count?: number | null
          metadata?: Json | null
          order_id?: string | null
          order_total?: number | null
          restaurant_id?: string
          sale_id?: string | null
          table_number?: number | null
          user_id?: string
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_suspicious_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_suspicious_events_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_suspicious_events_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales_with_masked_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      prelaunch_partial_registrations: {
        Row: {
          business_type: string | null
          converted_at: string | null
          created_at: string
          id: string
          is_converted: boolean | null
          name: string | null
          phone: string | null
          referrer: string | null
          session_id: string
          step_reached: number
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          business_type?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          is_converted?: boolean | null
          name?: string | null
          phone?: string | null
          referrer?: string | null
          session_id: string
          step_reached?: number
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          business_type?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          is_converted?: boolean | null
          name?: string | null
          phone?: string | null
          referrer?: string | null
          session_id?: string
          step_reached?: number
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
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
          base_salary: number | null
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
          onboarding_completed: boolean | null
          permissions: Json | null
          phone: string | null
          restaurant_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          salary_frequency: string | null
          updated_at: string
          work_address: string | null
          work_latitude: number | null
          work_longitude: number | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          base_salary?: number | null
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
          onboarding_completed?: boolean | null
          permissions?: Json | null
          phone?: string | null
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          salary_frequency?: string | null
          updated_at?: string
          work_address?: string | null
          work_latitude?: number | null
          work_longitude?: number | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          base_salary?: number | null
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
          onboarding_completed?: boolean | null
          permissions?: Json | null
          phone?: string | null
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          salary_frequency?: string | null
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
      receipt_audit_events: {
        Row: {
          change_percentage: number | null
          confidence_score: number | null
          created_at: string
          event_type: string
          expense_id: string | null
          id: string
          is_reviewed: boolean | null
          item_modified_name: string | null
          item_original_name: string | null
          modified_value: Json | null
          notes: string | null
          original_value: Json | null
          receipt_url: string | null
          restaurant_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          user_id: string
        }
        Insert: {
          change_percentage?: number | null
          confidence_score?: number | null
          created_at?: string
          event_type: string
          expense_id?: string | null
          id?: string
          is_reviewed?: boolean | null
          item_modified_name?: string | null
          item_original_name?: string | null
          modified_value?: Json | null
          notes?: string | null
          original_value?: Json | null
          receipt_url?: string | null
          restaurant_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          user_id: string
        }
        Update: {
          change_percentage?: number | null
          confidence_score?: number | null
          created_at?: string
          event_type?: string
          expense_id?: string | null
          id?: string
          is_reviewed?: boolean | null
          item_modified_name?: string | null
          item_original_name?: string | null
          modified_value?: Json | null
          notes?: string | null
          original_value?: Json | null
          receipt_url?: string | null
          restaurant_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_audit_events_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_audit_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
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
      resource_access: {
        Row: {
          allowed: boolean | null
          created_at: string | null
          employee_id: string | null
          id: string
          resource_id: string
          resource_type: string
          restaurant_id: string | null
        }
        Insert: {
          allowed?: boolean | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          resource_id: string
          resource_type: string
          restaurant_id?: string | null
        }
        Update: {
          allowed?: boolean | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          resource_id?: string
          resource_type?: string
          restaurant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_access_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_access_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
          allow_tip_edit: boolean | null
          created_at: string
          default_tip_percentage: number | null
          id: string
          latitude: number | null
          location_radius: number | null
          longitude: number | null
          name: string
          nit: string | null
          owner_id: string
          product_mode: string | null
          require_reason_if_decrease: boolean | null
          tip_auto_distribute: boolean | null
          tip_cashier_can_distribute: boolean | null
          tip_default_distribution_type: string | null
          tip_enabled: boolean | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allow_sales_without_stock?: boolean | null
          allow_tip_edit?: boolean | null
          created_at?: string
          default_tip_percentage?: number | null
          id?: string
          latitude?: number | null
          location_radius?: number | null
          longitude?: number | null
          name: string
          nit?: string | null
          owner_id: string
          product_mode?: string | null
          require_reason_if_decrease?: boolean | null
          tip_auto_distribute?: boolean | null
          tip_cashier_can_distribute?: boolean | null
          tip_default_distribution_type?: string | null
          tip_enabled?: boolean | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allow_sales_without_stock?: boolean | null
          allow_tip_edit?: boolean | null
          created_at?: string
          default_tip_percentage?: number | null
          id?: string
          latitude?: number | null
          location_radius?: number | null
          longitude?: number | null
          name?: string
          nit?: string | null
          owner_id?: string
          product_mode?: string | null
          require_reason_if_decrease?: boolean | null
          tip_auto_distribute?: boolean | null
          tip_cashier_can_distribute?: boolean | null
          tip_default_distribution_type?: string | null
          tip_enabled?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      role_presets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          permissions: Json
          preset_key: string
          restaurant_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          permissions?: Json
          preset_key: string
          restaurant_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          permissions?: Json
          preset_key?: string
          restaurant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_presets_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
      settings_audit_log: {
        Row: {
          action: string
          after_json: Json | null
          before_json: Json | null
          created_at: string
          id: string
          ip_address: string | null
          restaurant_id: string
          section: string
          user_agent: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          restaurant_id: string
          section: string
          user_agent?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          restaurant_id?: string
          section?: string
          user_agent?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_audit_log_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
          kitchen_order_sent: boolean | null
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
          kitchen_order_sent?: boolean | null
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
          kitchen_order_sent?: boolean | null
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
      tip_adjustments: {
        Row: {
          cashier_id: string | null
          created_at: string
          default_tip_percent: number
          final_tip_percent: number
          id: string
          new_tip_amount: number
          previous_tip_amount: number
          reason_comment: string | null
          reason_type: string
          restaurant_id: string
          sale_id: string | null
          suggested_tip_amount: number
          waiter_id: string | null
        }
        Insert: {
          cashier_id?: string | null
          created_at?: string
          default_tip_percent?: number
          final_tip_percent?: number
          id?: string
          new_tip_amount?: number
          previous_tip_amount?: number
          reason_comment?: string | null
          reason_type: string
          restaurant_id: string
          sale_id?: string | null
          suggested_tip_amount?: number
          waiter_id?: string | null
        }
        Update: {
          cashier_id?: string | null
          created_at?: string
          default_tip_percent?: number
          final_tip_percent?: number
          id?: string
          new_tip_amount?: number
          previous_tip_amount?: number
          reason_comment?: string | null
          reason_type?: string
          restaurant_id?: string
          sale_id?: string | null
          suggested_tip_amount?: number
          waiter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tip_adjustments_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_adjustments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_adjustments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales_with_masked_emails"
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
      user_onboarding: {
        Row: {
          created_at: string
          id: string
          tour_completed: boolean
          tour_completed_at: string | null
          tour_started_at: string | null
          tour_step: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tour_completed?: boolean
          tour_completed_at?: string | null
          tour_started_at?: string | null
          tour_step?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tour_completed?: boolean
          tour_completed_at?: string | null
          tour_started_at?: string | null
          tour_step?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_active: boolean | null
          restaurant_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_active?: boolean | null
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
      apply_role_preset: {
        Args: {
          p_employee_id: string
          p_preset_permissions: Json
          p_restaurant_id: string
        }
        Returns: undefined
      }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      calculate_gas_route_expected_return: {
        Args: { p_route_id: string }
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
      clear_table_order: {
        Args: {
          p_reason?: string
          p_restaurant_id: string
          p_table_number: number
          p_user_id: string
          p_user_name?: string
        }
        Returns: Json
      }
      generate_gas_order_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_gas_route_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_monthly_invoice_document: {
        Args: { p_month: number; p_restaurant_id: string; p_year: number }
        Returns: string
      }
      get_current_user_role: { Args: never; Returns: string }
      get_restaurant_owner: {
        Args: { _restaurant_id: string }
        Returns: string
      }
      has_permission: {
        Args: { p_module: string; p_permission: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _restaurant_id?: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner_or_admin: {
        Args: { target_restaurant_id: string; user_id: string }
        Returns: boolean
      }
      is_restaurant_owner: {
        Args: { _restaurant_id: string; _user_id: string }
        Returns: boolean
      }
      log_action_with_alert: {
        Args: {
          p_action: string
          p_is_sensitive?: boolean
          p_new_values?: Json
          p_old_values?: Json
          p_record_id: string
          p_restaurant_id: string
          p_table_name: string
          p_user_id: string
        }
        Returns: string
      }
      mask_customer_email: { Args: { email: string }; Returns: string }
      process_sale_atomic: {
        Args: {
          p_customer_email?: string
          p_idempotency_key?: string
          p_items: Json
          p_payment_method: string
          p_restaurant_id: string
          p_table_number?: number
          p_tip_amount?: number
          p_total_amount: number
          p_user_id: string
        }
        Returns: Json
      }
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
      app_role:
        | "owner"
        | "admin"
        | "manager"
        | "cashier"
        | "waiter"
        | "kitchen"
        | "employee"
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
      app_role: [
        "owner",
        "admin",
        "manager",
        "cashier",
        "waiter",
        "kitchen",
        "employee",
      ],
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
