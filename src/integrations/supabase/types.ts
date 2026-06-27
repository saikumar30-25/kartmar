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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      deal_messages: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          message: string
          offer_price_paise: number | null
          sender_id: string
          sender_role: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          message: string
          offer_price_paise?: number | null
          sender_id: string
          sender_role: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          message?: string
          offer_price_paise?: number | null
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_messages_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          agreed_price_paise: number
          buyer_id: string
          created_at: string
          drop_district: string | null
          farmer_id: string
          id: string
          listing_id: string | null
          photo_url: string | null
          pickup_district: string | null
          product_name: string
          quantity: number
          requirement_id: string | null
          status: Database["public"]["Enums"]["deal_status"]
          total_paise: number
          unit: string
          updated_at: string
        }
        Insert: {
          agreed_price_paise: number
          buyer_id: string
          created_at?: string
          drop_district?: string | null
          farmer_id: string
          id?: string
          listing_id?: string | null
          photo_url?: string | null
          pickup_district?: string | null
          product_name: string
          quantity: number
          requirement_id?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          total_paise: number
          unit?: string
          updated_at?: string
        }
        Update: {
          agreed_price_paise?: number
          buyer_id?: string
          created_at?: string
          drop_district?: string | null
          farmer_id?: string
          id?: string
          listing_id?: string | null
          photo_url?: string | null
          pickup_district?: string | null
          product_name?: string
          quantity?: number
          requirement_id?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          total_paise?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          available_until: string | null
          category: string
          created_at: string
          description: string | null
          district: string
          farmer_id: string
          harvest_date: string | null
          id: string
          lat: number | null
          lng: number | null
          min_price_paise: number | null
          photo_url: string | null
          price_paise: number
          product_name: string
          quality_grade: Database["public"]["Enums"]["quality_grade"]
          quantity: number
          state: string
          status: Database["public"]["Enums"]["listing_status"]
          unit: string
          updated_at: string
        }
        Insert: {
          available_until?: string | null
          category: string
          created_at?: string
          description?: string | null
          district: string
          farmer_id: string
          harvest_date?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          min_price_paise?: number | null
          photo_url?: string | null
          price_paise: number
          product_name: string
          quality_grade?: Database["public"]["Enums"]["quality_grade"]
          quantity: number
          state: string
          status?: Database["public"]["Enums"]["listing_status"]
          unit?: string
          updated_at?: string
        }
        Update: {
          available_until?: string | null
          category?: string
          created_at?: string
          description?: string | null
          district?: string
          farmer_id?: string
          harvest_date?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          min_price_paise?: number | null
          photo_url?: string | null
          price_paise?: number
          product_name?: string
          quality_grade?: Database["public"]["Enums"]["quality_grade"]
          quantity?: number
          state?: string
          status?: Database["public"]["Enums"]["listing_status"]
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_profiles: {
        Row: {
          capacity_kg: number
          created_at: string
          district: string | null
          earnings_paise: number
          id: string
          is_online: boolean
          license_doc_url: string | null
          rating: number
          state: string | null
          total_trips: number
          updated_at: string
          vehicle_number: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Insert: {
          capacity_kg?: number
          created_at?: string
          district?: string | null
          earnings_paise?: number
          id: string
          is_online?: boolean
          license_doc_url?: string | null
          rating?: number
          state?: string | null
          total_trips?: number
          updated_at?: string
          vehicle_number: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
        }
        Update: {
          capacity_kg?: number
          created_at?: string
          district?: string | null
          earnings_paise?: number
          id?: string
          is_online?: boolean
          license_doc_url?: string | null
          rating?: number
          state?: string | null
          total_trips?: number
          updated_at?: string
          vehicle_number?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          district: string | null
          id: string
          is_verified: boolean
          languages: string[]
          name: string
          phone: string | null
          rating: number
          state: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          district?: string | null
          id: string
          is_verified?: boolean
          languages?: string[]
          name?: string
          phone?: string | null
          rating?: number
          state?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          district?: string | null
          id?: string
          is_verified?: boolean
          languages?: string[]
          name?: string
          phone?: string | null
          rating?: number
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      requirements: {
        Row: {
          buyer_id: string
          created_at: string
          district: string
          id: string
          needed_by: string | null
          notes: string | null
          product_name: string
          quantity: number
          state: string
          status: Database["public"]["Enums"]["requirement_status"]
          target_price_paise: number | null
          unit: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          district: string
          id?: string
          needed_by?: string | null
          notes?: string | null
          product_name: string
          quantity: number
          state: string
          status?: Database["public"]["Enums"]["requirement_status"]
          target_price_paise?: number | null
          unit?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          district?: string
          id?: string
          needed_by?: string | null
          notes?: string | null
          product_name?: string
          quantity?: number
          state?: string
          status?: Database["public"]["Enums"]["requirement_status"]
          target_price_paise?: number | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          created_at: string
          deal_id: string
          delivered_at: string | null
          distance_km: number | null
          drop_district: string
          fare_paise: number
          id: string
          notes: string | null
          partner_id: string | null
          pickup_at: string | null
          pickup_district: string
          status: Database["public"]["Enums"]["trip_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          delivered_at?: string | null
          distance_km?: number | null
          drop_district: string
          fare_paise: number
          id?: string
          notes?: string | null
          partner_id?: string | null
          pickup_at?: string | null
          pickup_district: string
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          delivered_at?: string | null
          distance_km?: number | null
          drop_district?: string
          fare_paise?: number
          id?: string
          notes?: string | null
          partner_id?: string | null
          pickup_at?: string | null
          pickup_district?: string
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_partner: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "farmer" | "owner" | "partner" | "admin"
      deal_status:
        | "pending_payment"
        | "paid"
        | "in_transit"
        | "delivered"
        | "completed"
        | "disputed"
        | "cancelled"
      listing_status: "active" | "reserved" | "sold" | "expired"
      quality_grade: "A" | "B" | "C"
      requirement_status: "open" | "matched" | "fulfilled" | "cancelled"
      trip_status:
        | "offered"
        | "accepted"
        | "picked_up"
        | "in_transit"
        | "delivered"
        | "cancelled"
      vehicle_type: "mini_truck" | "tempo" | "pickup" | "tractor" | "bike"
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
      app_role: ["farmer", "owner", "partner", "admin"],
      deal_status: [
        "pending_payment",
        "paid",
        "in_transit",
        "delivered",
        "completed",
        "disputed",
        "cancelled",
      ],
      listing_status: ["active", "reserved", "sold", "expired"],
      quality_grade: ["A", "B", "C"],
      requirement_status: ["open", "matched", "fulfilled", "cancelled"],
      trip_status: [
        "offered",
        "accepted",
        "picked_up",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      vehicle_type: ["mini_truck", "tempo", "pickup", "tractor", "bike"],
    },
  },
} as const
