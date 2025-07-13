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
      ab_test_experiments: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string
          traffic_allocation: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string
          traffic_allocation?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string
          traffic_allocation?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ab_test_variants: {
        Row: {
          created_at: string
          description: string | null
          experiment_id: string
          id: string
          is_control: boolean | null
          name: string
          traffic_allocation: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          experiment_id: string
          id?: string
          is_control?: boolean | null
          name: string
          traffic_allocation?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          experiment_id?: string
          id?: string
          is_control?: boolean | null
          name?: string
          traffic_allocation?: number
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_variants_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "ab_test_experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_images: {
        Row: {
          ad_id: string
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          sort_order: number | null
        }
        Insert: {
          ad_id: string
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          sort_order?: number | null
        }
        Update: {
          ad_id?: string
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_images_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          category_id: string
          condition: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          description: string
          expires_at: string | null
          featured_until: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          latitude: number | null
          location: string | null
          longitude: number | null
          price: number | null
          status: string
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          category_id: string
          condition?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          description: string
          expires_at?: string | null
          featured_until?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          price?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          category_id?: string
          condition?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          description?: string
          expires_at?: string | null
          featured_until?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          price?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "ads_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string
          event_type: string
          id: string
          ip_address: unknown | null
          page_url: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          page_url?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_page_views: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          page_url: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          viewport_height: number | null
          viewport_width: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          page_url: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          page_url?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewport_height?: number | null
          viewport_width?: number | null
        }
        Relationships: []
      }
      analytics_user_actions: {
        Row: {
          action_type: string
          coordinates: Json | null
          element_class: string | null
          element_id: string | null
          element_text: string | null
          id: string
          page_url: string | null
          session_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          coordinates?: Json | null
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          id?: string
          page_url?: string | null
          session_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          coordinates?: Json | null
          element_class?: string | null
          element_id?: string | null
          element_text?: string | null
          id?: string
          page_url?: string | null
          session_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_events: {
        Row: {
          created_at: string
          currency: string | null
          event_type: string
          event_value: number | null
          experiment_id: string | null
          id: string
          session_id: string | null
          user_id: string | null
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          event_type: string
          event_value?: number | null
          experiment_id?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          event_type?: string
          event_value?: number | null
          experiment_id?: string | null
          id?: string
          session_id?: string | null
          user_id?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "ab_test_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "ab_test_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_ad_orders: {
        Row: {
          ad_id: string
          amount: number
          created_at: string
          currency: string | null
          duration_days: number
          featured_until: string | null
          id: string
          status: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_id: string
          amount: number
          created_at?: string
          currency?: string | null
          duration_days: number
          featured_until?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          amount?: number
          created_at?: string
          currency?: string | null
          duration_days?: number
          featured_until?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_ad_orders_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          ad_id: string
          content: string
          created_at: string
          edited_at: string | null
          id: string
          is_read: boolean
          message_type: string | null
          recipient_id: string
          reply_to_message_id: string | null
          sender_id: string
        }
        Insert: {
          ad_id: string
          content: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_read?: boolean
          message_type?: string | null
          recipient_id: string
          reply_to_message_id?: string | null
          sender_id: string
        }
        Update: {
          ad_id?: string
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_read?: boolean
          message_type?: string | null
          recipient_id?: string
          reply_to_message_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          ad_expiring: boolean | null
          ad_responses: boolean | null
          created_at: string | null
          featured_ad_updates: boolean | null
          id: string
          marketing: boolean | null
          new_messages: boolean | null
          price_changes: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ad_expiring?: boolean | null
          ad_responses?: boolean | null
          created_at?: string | null
          featured_ad_updates?: boolean | null
          id?: string
          marketing?: boolean | null
          new_messages?: boolean | null
          price_changes?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ad_expiring?: boolean | null
          ad_responses?: boolean | null
          created_at?: string | null
          featured_ad_updates?: boolean | null
          id?: string
          marketing?: boolean | null
          new_messages?: boolean | null
          price_changes?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_verified: boolean
          latitude: number | null
          location: string | null
          longitude: number | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_verified?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_verified?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh_key: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh_key: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh_key?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          ad_id: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_ads: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_ads_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      typing_indicators: {
        Row: {
          ad_id: string
          created_at: string
          expires_at: string
          id: string
          recipient_id: string
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          expires_at?: string
          id?: string
          recipient_id: string
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          recipient_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_experiment_assignments: {
        Row: {
          assigned_at: string
          experiment_id: string
          id: string
          user_id: string | null
          variant_id: string
        }
        Insert: {
          assigned_at?: string
          experiment_id: string
          id?: string
          user_id?: string | null
          variant_id: string
        }
        Update: {
          assigned_at?: string
          experiment_id?: string
          id?: string
          user_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_experiment_assignments_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "ab_test_experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_experiment_assignments_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "ab_test_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
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
      calculate_distance: {
        Args: { lat1: number; lng1: number; lat2: number; lng2: number }
        Returns: number
      }
      cleanup_typing_indicators: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      expire_featured_ads: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_analytics_overview: {
        Args: { start_date: string; end_date: string }
        Returns: Json
      }
      get_nearby_ads: {
        Args: {
          user_lat: number
          user_lng: number
          radius_km?: number
          limit_count?: number
        }
        Returns: {
          id: string
          title: string
          description: string
          price: number
          currency: string
          location: string
          latitude: number
          longitude: number
          distance_km: number
          created_at: string
          is_featured: boolean
          category_name: string
          image_url: string
        }[]
      }
      get_unread_message_count: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
