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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      fraud_alerts: {
        Row: {
          alert_sent: boolean
          alert_settings: Json | null
          amount: number
          created_at: string
          email_sent: boolean
          fraud_probability: number
          id: string
          location: string | null
          risk_level: string
          sms_sent: boolean
          timestamp: string
          transaction_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string | null
          whatsapp_sent: boolean
        }
        Insert: {
          alert_sent?: boolean
          alert_settings?: Json | null
          amount: number
          created_at?: string
          email_sent?: boolean
          fraud_probability: number
          id?: string
          location?: string | null
          risk_level: string
          sms_sent?: boolean
          timestamp: string
          transaction_id?: string | null
          transaction_type: string
          updated_at?: string
          user_id?: string | null
          whatsapp_sent?: boolean
        }
        Update: {
          alert_sent?: boolean
          alert_settings?: Json | null
          amount?: number
          created_at?: string
          email_sent?: boolean
          fraud_probability?: number
          id?: string
          location?: string | null
          risk_level?: string
          sms_sent?: boolean
          timestamp?: string
          transaction_id?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string | null
          whatsapp_sent?: boolean
        }
        Relationships: []
      }
      qr_codes_whitelist: {
        Row: {
          batch_number: string | null
          created_at: string
          digital_signature: string
          expiry_date: string | null
          id: string
          is_active: boolean
          manufacturer: string
          manufacturing_date: string | null
          product_id: string
          product_name: string
          qr_code_hash: string
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          digital_signature: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          manufacturer: string
          manufacturing_date?: string | null
          product_id: string
          product_name: string
          qr_code_hash: string
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          digital_signature?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean
          manufacturer?: string
          manufacturing_date?: string | null
          product_id?: string
          product_name?: string
          qr_code_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      qr_scan_history: {
        Row: {
          alert_sent: boolean
          created_at: string
          id: string
          is_authentic: boolean
          is_duplicate: boolean
          is_suspicious_velocity: boolean
          qr_code_hash: string
          scan_device: string | null
          scan_location: string | null
          scan_timestamp: string
          user_contact: string | null
        }
        Insert: {
          alert_sent?: boolean
          created_at?: string
          id?: string
          is_authentic: boolean
          is_duplicate?: boolean
          is_suspicious_velocity?: boolean
          qr_code_hash: string
          scan_device?: string | null
          scan_location?: string | null
          scan_timestamp?: string
          user_contact?: string | null
        }
        Update: {
          alert_sent?: boolean
          created_at?: string
          id?: string
          is_authentic?: boolean
          is_duplicate?: boolean
          is_suspicious_velocity?: boolean
          qr_code_hash?: string
          scan_device?: string | null
          scan_location?: string | null
          scan_timestamp?: string
          user_contact?: string | null
        }
        Relationships: []
      }
      verified_phone_numbers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          phone_number: string
          updated_at: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          phone_number: string
          updated_at?: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          phone_number?: string
          updated_at?: string
          user_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
