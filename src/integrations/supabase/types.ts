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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          category: string
          description: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          category: string
          description: string
          icon: string
          id: string
          name: string
        }
        Update: {
          category?: string
          description?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accepted_reports: number | null
          avatar_url: string | null
          created_at: string
          credibility_score: number | null
          email: string
          full_name: string | null
          id: string
          last_active_date: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          streak_days: number | null
          total_reports: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_reports?: number | null
          avatar_url?: string | null
          created_at?: string
          credibility_score?: number | null
          email: string
          full_name?: string | null
          id?: string
          last_active_date?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          streak_days?: number | null
          total_reports?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_reports?: number | null
          avatar_url?: string | null
          created_at?: string
          credibility_score?: number | null
          email?: string
          full_name?: string | null
          id?: string
          last_active_date?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          streak_days?: number | null
          total_reports?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_badges: {
        Row: {
          badge_id: string
          created_at: string
          id: string
          is_eligible: boolean | null
          level: string | null
          no_count: number | null
          percentage: number | null
          shop_id: string
          updated_at: string
          yes_count: number | null
        }
        Insert: {
          badge_id: string
          created_at?: string
          id?: string
          is_eligible?: boolean | null
          level?: string | null
          no_count?: number | null
          percentage?: number | null
          shop_id: string
          updated_at?: string
          yes_count?: number | null
        }
        Update: {
          badge_id?: string
          created_at?: string
          id?: string
          is_eligible?: boolean | null
          level?: string | null
          no_count?: number | null
          percentage?: number | null
          shop_id?: string
          updated_at?: string
          yes_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_badges_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_responses: {
        Row: {
          created_at: string
          id: string
          response_text: string
          shop_id: string
          updated_at: string
          vote_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          response_text: string
          shop_id: string
          updated_at?: string
          vote_id: string
        }
        Update: {
          created_at?: string
          id?: string
          response_text?: string
          shop_id?: string
          updated_at?: string
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_responses_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_responses_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string
          ai_verification_result: string | null
          ai_verification_status: string | null
          ai_verified_at: string | null
          certificate_url: string | null
          created_at: string
          description: string | null
          green_score: number | null
          gst_number: string | null
          id: string
          is_verified: boolean | null
          latitude: number
          license_url: string | null
          longitude: number
          name: string
          owner_id: string
          shop_image_url: string | null
          updated_at: string
          verification_status: string | null
        }
        Insert: {
          address: string
          ai_verification_result?: string | null
          ai_verification_status?: string | null
          ai_verified_at?: string | null
          certificate_url?: string | null
          created_at?: string
          description?: string | null
          green_score?: number | null
          gst_number?: string | null
          id?: string
          is_verified?: boolean | null
          latitude: number
          license_url?: string | null
          longitude: number
          name: string
          owner_id: string
          shop_image_url?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Update: {
          address?: string
          ai_verification_result?: string | null
          ai_verification_status?: string | null
          ai_verified_at?: string | null
          certificate_url?: string | null
          created_at?: string
          description?: string | null
          green_score?: number | null
          gst_number?: string | null
          id?: string
          is_verified?: boolean | null
          latitude?: number
          license_url?: string | null
          longitude?: number
          name?: string
          owner_id?: string
          shop_image_url?: string | null
          updated_at?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badge_definitions: {
        Row: {
          category: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          category?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          created_at: string
          id: string
          is_eligible: boolean | null
          level: string | null
          percentage: number | null
          progress_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string
          id?: string
          is_eligible?: boolean | null
          level?: string | null
          percentage?: number | null
          progress_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string
          id?: string
          is_eligible?: boolean | null
          level?: string | null
          percentage?: number | null
          progress_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          ai_confidence_score: number | null
          ai_verification_result: string | null
          ai_verified: boolean | null
          badge_id: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          proof_image_url: string | null
          shop_id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_verification_result?: string | null
          ai_verified?: boolean | null
          badge_id: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          proof_image_url?: string | null
          shop_id: string
          user_id: string
          vote_type: string
        }
        Update: {
          ai_confidence_score?: number | null
          ai_verification_result?: string | null
          ai_verified?: boolean | null
          badge_id?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          proof_image_url?: string | null
          shop_id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "customer" | "shop_owner"
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
      user_role: ["customer", "shop_owner"],
    },
  },
} as const
