export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string
          biz_address: string | null
          biz_name: string | null
          biz_phone: string | null
          biz_start_date: string | null
          created_at: string
          credit_permission: boolean | null
          customer_name: string
          dob: string | null
          ein: string | null
          email: string | null
          id: string
          phone: string
          ssn: string | null
          updated_at: string
        }
        Insert: {
          address: string
          biz_address?: string | null
          biz_name?: string | null
          biz_phone?: string | null
          biz_start_date?: string | null
          created_at?: string
          credit_permission?: boolean | null
          customer_name: string
          dob?: string | null
          ein?: string | null
          email?: string | null
          id?: string
          phone: string
          ssn?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          biz_address?: string | null
          biz_name?: string | null
          biz_phone?: string | null
          biz_start_date?: string | null
          created_at?: string
          credit_permission?: boolean | null
          customer_name?: string
          dob?: string | null
          ein?: string | null
          email?: string | null
          id?: string
          phone?: string
          ssn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      demo_leads: {
        Row: {
          company: string
          created_at: string
          demo_completed_at: string | null
          demo_credentials: Json | null
          demo_started_at: string | null
          email: string
          employees: string | null
          engagement_score: number | null
          follow_up_status: string | null
          id: string
          last_activity_at: string | null
          name: string
          notes: string | null
          phone: string | null
          role: string
          session_id: string | null
          updated_at: string
          use_case: string | null
        }
        Insert: {
          company: string
          created_at?: string
          demo_completed_at?: string | null
          demo_credentials?: Json | null
          demo_started_at?: string | null
          email: string
          employees?: string | null
          engagement_score?: number | null
          follow_up_status?: string | null
          id?: string
          last_activity_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          role: string
          session_id?: string | null
          updated_at?: string
          use_case?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          demo_completed_at?: string | null
          demo_credentials?: Json | null
          demo_started_at?: string | null
          email?: string
          employees?: string | null
          engagement_score?: number | null
          follow_up_status?: string | null
          id?: string
          last_activity_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string
          session_id?: string | null
          updated_at?: string
          use_case?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          contact_email: string
          contact_phone: string | null
          created_at: string
          id: string
          name: string
          storage_limit: number | null
          storage_used: number | null
          updated_at: string
        }
        Insert: {
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          name: string
          storage_limit?: number | null
          storage_used?: number | null
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          name?: string
          storage_limit?: number | null
          storage_used?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string | null
          content: string
          created_at: string
          file_size: number | null
          file_url: string | null
          id: string
          is_published: boolean | null
          mime_type: string | null
          partner_admin_id: string
          publication_date: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          mime_type?: string | null
          partner_admin_id: string
          publication_date?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          mime_type?: string | null
          partner_admin_id?: string
          publication_date?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_partner_admin_id_fkey"
            columns: ["partner_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_audit_log: {
        Row: {
          action: string
          created_at: string | null
          file_name: string
          file_size: number | null
          id: string
          ip_address: unknown | null
          partner_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          ip_address?: unknown | null
          partner_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          ip_address?: unknown | null
          partner_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_audit_log_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          approval_terms: string | null
          created_at: string
          customer_id: string
          drivers_license_url: string | null
          id: string
          misc_documents_url: string[] | null
          partner_admin_id: string
          sales_invoice_url: string | null
          status: string
          submission_date: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          approval_terms?: string | null
          created_at?: string
          customer_id: string
          drivers_license_url?: string | null
          id?: string
          misc_documents_url?: string[] | null
          partner_admin_id: string
          sales_invoice_url?: string | null
          status?: string
          submission_date?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          approval_terms?: string | null
          created_at?: string
          customer_id?: string
          drivers_license_url?: string | null
          id?: string
          misc_documents_url?: string[] | null
          partner_admin_id?: string
          sales_invoice_url?: string | null
          status?: string
          submission_date?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_partner_admin_id_fkey"
            columns: ["partner_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          price_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          price_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          price_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          partner_id: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          partner_id?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          partner_id?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          contact_address: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string
          id: string
          partner_admin_id: string
          storage_limit: number | null
          storage_used: number | null
          updated_at: string
          user_id: string | null
          vendor_name: string
        }
        Insert: {
          contact_address?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          partner_admin_id: string
          storage_limit?: number | null
          storage_used?: number | null
          updated_at?: string
          user_id?: string | null
          vendor_name: string
        }
        Update: {
          contact_address?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          partner_admin_id?: string
          storage_limit?: number | null
          storage_used?: number | null
          updated_at?: string
          user_id?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_partner_admin_id_fkey"
            columns: ["partner_admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_hybrid_storage_limit: {
        Args: { vendor_id: string; file_size: number }
        Returns: Json
      }
      generate_file_path: {
        Args: { broker_id: string; vendor_id: string; filename: string }
        Returns: string
      }
      get_user_partner_id: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      get_vendor_partner_admin_id: {
        Args: { user_id: string }
        Returns: string
      }
      is_current_user_vendor_for_submission: {
        Args: { submission_vendor_id: string }
        Returns: boolean
      }
      set_storage_limits_by_plan: {
        Args: { partner_id: string; plan_name: string }
        Returns: undefined
      }
      update_hybrid_storage_usage: {
        Args: { vendor_id: string; file_size: number; is_delete?: boolean }
        Returns: undefined
      }
      update_partner_storage: {
        Args: { partner_id: string; size_change: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
