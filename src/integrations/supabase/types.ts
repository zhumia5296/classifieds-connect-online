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
      activities: {
        Row: {
          activity_type: string
          ad_id: string | null
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type: string
          ad_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          ad_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_embeddings: {
        Row: {
          ad_id: string
          content_hash: string
          created_at: string
          embedding: string | null
          id: string
          updated_at: string
        }
        Insert: {
          ad_id: string
          content_hash: string
          created_at?: string
          embedding?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          ad_id?: string
          content_hash?: string
          created_at?: string
          embedding?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_embeddings_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: true
            referencedRelation: "ads"
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
          max_quantity_per_order: number | null
          price: number | null
          quantity_available: number | null
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
          max_quantity_per_order?: number | null
          price?: number | null
          quantity_available?: number | null
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
          max_quantity_per_order?: number | null
          price?: number | null
          quantity_available?: number | null
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
      checkin_notifications: {
        Row: {
          checkin_id: string
          contact_id: string
          created_at: string
          id: string
          is_sent: boolean | null
          message: string
          notification_type: string
          sent_at: string | null
        }
        Insert: {
          checkin_id: string
          contact_id: string
          created_at?: string
          id?: string
          is_sent?: boolean | null
          message: string
          notification_type: string
          sent_at?: string | null
        }
        Update: {
          checkin_id?: string
          contact_id?: string
          created_at?: string
          id?: string
          is_sent?: boolean | null
          message?: string
          notification_type?: string
          sent_at?: string | null
        }
        Relationships: []
      }
      checkin_updates: {
        Row: {
          checkin_id: string
          created_at: string
          id: string
          is_automatic: boolean | null
          location_latitude: number | null
          location_longitude: number | null
          message: string | null
          status: string
        }
        Insert: {
          checkin_id: string
          created_at?: string
          id?: string
          is_automatic?: boolean | null
          location_latitude?: number | null
          location_longitude?: number | null
          message?: string | null
          status: string
        }
        Update: {
          checkin_id?: string
          created_at?: string
          id?: string
          is_automatic?: boolean | null
          location_latitude?: number | null
          location_longitude?: number | null
          message?: string | null
          status?: string
        }
        Relationships: []
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
      customs_items: {
        Row: {
          created_at: string | null
          description: string
          hs_tariff_number: string | null
          id: string
          origin_country: string | null
          quantity: number
          shipment_id: string | null
          value: number
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          hs_tariff_number?: string | null
          id?: string
          origin_country?: string | null
          quantity: number
          shipment_id?: string | null
          value: number
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          hs_tariff_number?: string | null
          id?: string
          origin_country?: string | null
          quantity?: number
          shipment_id?: string | null
          value?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customs_items_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_providers: {
        Row: {
          availability_schedule: Json | null
          background_check_status: string | null
          base_rate: number
          business_name: string
          created_at: string
          current_latitude: number | null
          current_longitude: number | null
          emergency_contact: string | null
          id: string
          insurance_expiry: string | null
          is_active: boolean
          is_available: boolean
          last_location_update: string | null
          license_plate: string | null
          maximum_distance_km: number | null
          maximum_weight_kg: number | null
          minimum_order_value: number | null
          per_km_rate: number
          per_minute_rate: number
          phone_number: string | null
          provider_type: string
          rating: number | null
          service_areas: Json
          total_deliveries: number | null
          updated_at: string
          user_id: string
          vehicle_types: string[]
          verification_documents: Json | null
        }
        Insert: {
          availability_schedule?: Json | null
          background_check_status?: string | null
          base_rate?: number
          business_name: string
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          emergency_contact?: string | null
          id?: string
          insurance_expiry?: string | null
          is_active?: boolean
          is_available?: boolean
          last_location_update?: string | null
          license_plate?: string | null
          maximum_distance_km?: number | null
          maximum_weight_kg?: number | null
          minimum_order_value?: number | null
          per_km_rate?: number
          per_minute_rate?: number
          phone_number?: string | null
          provider_type: string
          rating?: number | null
          service_areas?: Json
          total_deliveries?: number | null
          updated_at?: string
          user_id: string
          vehicle_types?: string[]
          verification_documents?: Json | null
        }
        Update: {
          availability_schedule?: Json | null
          background_check_status?: string | null
          base_rate?: number
          business_name?: string
          created_at?: string
          current_latitude?: number | null
          current_longitude?: number | null
          emergency_contact?: string | null
          id?: string
          insurance_expiry?: string | null
          is_active?: boolean
          is_available?: boolean
          last_location_update?: string | null
          license_plate?: string | null
          maximum_distance_km?: number | null
          maximum_weight_kg?: number | null
          minimum_order_value?: number | null
          per_km_rate?: number
          per_minute_rate?: number
          phone_number?: string | null
          provider_type?: string
          rating?: number | null
          service_areas?: Json
          total_deliveries?: number | null
          updated_at?: string
          user_id?: string
          vehicle_types?: string[]
          verification_documents?: Json | null
        }
        Relationships: []
      }
      delivery_quotes: {
        Row: {
          created_at: string
          delivery_request_id: string
          estimated_delivery_time: string | null
          estimated_pickup_time: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string | null
          provider_id: string
          quoted_price: number
        }
        Insert: {
          created_at?: string
          delivery_request_id: string
          estimated_delivery_time?: string | null
          estimated_pickup_time?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          provider_id: string
          quoted_price: number
        }
        Update: {
          created_at?: string
          delivery_request_id?: string
          estimated_delivery_time?: string | null
          estimated_pickup_time?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string | null
          provider_id?: string
          quoted_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_quotes_delivery_request_id_fkey"
            columns: ["delivery_request_id"]
            isOneToOne: false
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_quotes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "delivery_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_requests: {
        Row: {
          accepted_at: string | null
          ad_id: string | null
          assigned_provider_id: string | null
          cancelled_at: string | null
          created_at: string
          customer_budget: number | null
          delivered_at: string | null
          delivery_address: string
          delivery_contact_name: string
          delivery_contact_phone: string
          delivery_instructions: string | null
          delivery_latitude: number
          delivery_longitude: number
          delivery_started_at: string | null
          delivery_time_window_end: string | null
          delivery_time_window_start: string | null
          delivery_type: string
          estimated_cost: number | null
          estimated_distance_km: number | null
          estimated_duration_minutes: number | null
          final_cost: number | null
          id: string
          order_id: string | null
          package_description: string
          package_dimensions: Json | null
          package_value: number | null
          package_weight_kg: number | null
          photo_confirmation_required: boolean | null
          picked_up_at: string | null
          pickup_address: string
          pickup_contact_name: string
          pickup_contact_phone: string
          pickup_instructions: string | null
          pickup_latitude: number
          pickup_longitude: number
          pickup_scheduled_at: string | null
          pickup_started_at: string | null
          pickup_time_window_end: string | null
          pickup_time_window_start: string | null
          quoted_at: string | null
          requested_at: string
          signature_required: boolean | null
          special_handling: string[] | null
          status: string
          updated_at: string
          urgency_level: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          ad_id?: string | null
          assigned_provider_id?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_budget?: number | null
          delivered_at?: string | null
          delivery_address: string
          delivery_contact_name: string
          delivery_contact_phone: string
          delivery_instructions?: string | null
          delivery_latitude: number
          delivery_longitude: number
          delivery_started_at?: string | null
          delivery_time_window_end?: string | null
          delivery_time_window_start?: string | null
          delivery_type?: string
          estimated_cost?: number | null
          estimated_distance_km?: number | null
          estimated_duration_minutes?: number | null
          final_cost?: number | null
          id?: string
          order_id?: string | null
          package_description: string
          package_dimensions?: Json | null
          package_value?: number | null
          package_weight_kg?: number | null
          photo_confirmation_required?: boolean | null
          picked_up_at?: string | null
          pickup_address: string
          pickup_contact_name: string
          pickup_contact_phone: string
          pickup_instructions?: string | null
          pickup_latitude: number
          pickup_longitude: number
          pickup_scheduled_at?: string | null
          pickup_started_at?: string | null
          pickup_time_window_end?: string | null
          pickup_time_window_start?: string | null
          quoted_at?: string | null
          requested_at?: string
          signature_required?: boolean | null
          special_handling?: string[] | null
          status?: string
          updated_at?: string
          urgency_level?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          ad_id?: string | null
          assigned_provider_id?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_budget?: number | null
          delivered_at?: string | null
          delivery_address?: string
          delivery_contact_name?: string
          delivery_contact_phone?: string
          delivery_instructions?: string | null
          delivery_latitude?: number
          delivery_longitude?: number
          delivery_started_at?: string | null
          delivery_time_window_end?: string | null
          delivery_time_window_start?: string | null
          delivery_type?: string
          estimated_cost?: number | null
          estimated_distance_km?: number | null
          estimated_duration_minutes?: number | null
          final_cost?: number | null
          id?: string
          order_id?: string | null
          package_description?: string
          package_dimensions?: Json | null
          package_value?: number | null
          package_weight_kg?: number | null
          photo_confirmation_required?: boolean | null
          picked_up_at?: string | null
          pickup_address?: string
          pickup_contact_name?: string
          pickup_contact_phone?: string
          pickup_instructions?: string | null
          pickup_latitude?: number
          pickup_longitude?: number
          pickup_scheduled_at?: string | null
          pickup_started_at?: string | null
          pickup_time_window_end?: string | null
          pickup_time_window_start?: string | null
          quoted_at?: string | null
          requested_at?: string
          signature_required?: boolean | null
          special_handling?: string[] | null
          status?: string
          updated_at?: string
          urgency_level?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_requests_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_assigned_provider_id_fkey"
            columns: ["assigned_provider_id"]
            isOneToOne: false
            referencedRelation: "delivery_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_reviews: {
        Row: {
          care_rating: number | null
          comment: string | null
          communication_rating: number | null
          created_at: string
          delivery_request_id: string
          id: string
          provider_id: string
          punctuality_rating: number | null
          rating: number
          reviewer_id: string
          title: string
          updated_at: string
          would_recommend: boolean | null
        }
        Insert: {
          care_rating?: number | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          delivery_request_id: string
          id?: string
          provider_id: string
          punctuality_rating?: number | null
          rating: number
          reviewer_id: string
          title: string
          updated_at?: string
          would_recommend?: boolean | null
        }
        Update: {
          care_rating?: number | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          delivery_request_id?: string
          id?: string
          provider_id?: string
          punctuality_rating?: number | null
          rating?: number
          reviewer_id?: string
          title?: string
          updated_at?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_reviews_delivery_request_id_fkey"
            columns: ["delivery_request_id"]
            isOneToOne: false
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "delivery_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_tracking: {
        Row: {
          accuracy_meters: number | null
          activity_type: string | null
          battery_level: number | null
          created_at: string
          delivery_request_id: string
          device_info: Json | null
          heading_degrees: number | null
          id: string
          latitude: number
          longitude: number
          notes: string | null
          photo_urls: string[] | null
          provider_id: string
          speed_kmh: number | null
          status: string
          tracked_at: string
        }
        Insert: {
          accuracy_meters?: number | null
          activity_type?: string | null
          battery_level?: number | null
          created_at?: string
          delivery_request_id: string
          device_info?: Json | null
          heading_degrees?: number | null
          id?: string
          latitude: number
          longitude: number
          notes?: string | null
          photo_urls?: string[] | null
          provider_id: string
          speed_kmh?: number | null
          status: string
          tracked_at?: string
        }
        Update: {
          accuracy_meters?: number | null
          activity_type?: string | null
          battery_level?: number | null
          created_at?: string
          delivery_request_id?: string
          device_info?: Json | null
          heading_degrees?: number | null
          id?: string
          latitude?: number
          longitude?: number
          notes?: string | null
          photo_urls?: string[] | null
          provider_id?: string
          speed_kmh?: number | null
          status?: string
          tracked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_delivery_request_id_fkey"
            columns: ["delivery_request_id"]
            isOneToOne: false
            referencedRelation: "delivery_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_tracking_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "delivery_providers"
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
      nearby_alert_preferences: {
        Row: {
          categories: string[] | null
          conditions: string[] | null
          created_at: string
          id: string
          is_enabled: boolean
          keywords: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          max_price: number | null
          min_price: number | null
          radius_km: number
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: string[] | null
          conditions?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          keywords?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_price?: number | null
          min_price?: number | null
          radius_km?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: string[] | null
          conditions?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          keywords?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_price?: number | null
          min_price?: number | null
          radius_km?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery_date: string | null
          carrier: string | null
          created_at: string
          currency: string | null
          estimated_delivery_date: string | null
          id: string
          seller_id: string
          shipping_address: Json | null
          shipping_cost: number | null
          shipping_method: string | null
          status: string | null
          stripe_session_id: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_delivery_date?: string | null
          carrier?: string | null
          created_at?: string
          currency?: string | null
          estimated_delivery_date?: string | null
          id?: string
          seller_id: string
          shipping_address?: Json | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string | null
          stripe_session_id?: string | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_delivery_date?: string | null
          carrier?: string | null
          created_at?: string
          currency?: string | null
          estimated_delivery_date?: string | null
          id?: string
          seller_id?: string
          shipping_address?: Json | null
          shipping_cost?: number | null
          shipping_method?: string | null
          status?: string | null
          stripe_session_id?: string | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          bio: string | null
          business_address: string | null
          business_description: string | null
          business_email: string | null
          business_hours: Json | null
          business_license_url: string | null
          business_name: string | null
          business_phone: string | null
          business_registration: string | null
          business_type: string | null
          business_website: string | null
          created_at: string
          display_name: string | null
          id: string
          is_verified: boolean
          latitude: number | null
          location: string | null
          longitude: number | null
          phone: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_address?: string | null
          business_description?: string | null
          business_email?: string | null
          business_hours?: Json | null
          business_license_url?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_registration?: string | null
          business_type?: string | null
          business_website?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_verified?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_address?: string | null
          business_description?: string | null
          business_email?: string | null
          business_hours?: Json | null
          business_license_url?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_registration?: string | null
          business_type?: string | null
          business_website?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_verified?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          phone?: string | null
          tax_id?: string | null
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
      review_votes: {
        Row: {
          created_at: string
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          ad_id: string | null
          comment: string | null
          communication_rating: number | null
          created_at: string
          helpful_count: number | null
          id: string
          is_verified: boolean | null
          payment_safety_rating: number | null
          rating: number
          reliability_rating: number | null
          reviewed_user_id: string
          reviewer_id: string
          reviewer_latitude: number | null
          reviewer_location: string | null
          reviewer_longitude: number | null
          safety_rating: number | null
          title: string
          transaction_latitude: number | null
          transaction_location: string | null
          transaction_longitude: number | null
          transaction_type: string | null
          updated_at: string
        }
        Insert: {
          ad_id?: string | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_verified?: boolean | null
          payment_safety_rating?: number | null
          rating: number
          reliability_rating?: number | null
          reviewed_user_id: string
          reviewer_id: string
          reviewer_latitude?: number | null
          reviewer_location?: string | null
          reviewer_longitude?: number | null
          safety_rating?: number | null
          title: string
          transaction_latitude?: number | null
          transaction_location?: string | null
          transaction_longitude?: number | null
          transaction_type?: string | null
          updated_at?: string
        }
        Update: {
          ad_id?: string | null
          comment?: string | null
          communication_rating?: number | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_verified?: boolean | null
          payment_safety_rating?: number | null
          rating?: number
          reliability_rating?: number | null
          reviewed_user_id?: string
          reviewer_id?: string
          reviewer_latitude?: number | null
          reviewer_location?: string | null
          reviewer_longitude?: number | null
          safety_rating?: number | null
          title?: string
          transaction_latitude?: number | null
          transaction_location?: string | null
          transaction_longitude?: number | null
          transaction_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      safe_meetup_spots: {
        Row: {
          address: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          has_cameras: boolean | null
          has_security: boolean | null
          id: string
          is_24_7: boolean | null
          is_active: boolean | null
          latitude: number
          longitude: number
          name: string
          operating_hours: Json | null
          type: string
          updated_at: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
          website_url: string | null
        }
        Insert: {
          address: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          has_cameras?: boolean | null
          has_security?: boolean | null
          id?: string
          is_24_7?: boolean | null
          is_active?: boolean | null
          latitude: number
          longitude: number
          name: string
          operating_hours?: Json | null
          type: string
          updated_at?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          has_cameras?: boolean | null
          has_security?: boolean | null
          id?: string
          is_24_7?: boolean | null
          is_active?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          operating_hours?: Json | null
          type?: string
          updated_at?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      safety_checkins: {
        Row: {
          ad_id: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          created_at: string
          emergency_contacts: string[] | null
          expected_duration_minutes: number | null
          expected_return_time: string | null
          id: string
          last_checkin_time: string | null
          meetup_address: string | null
          meetup_latitude: number | null
          meetup_location: string
          meetup_longitude: number | null
          notes: string | null
          scheduled_time: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_id?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          created_at?: string
          emergency_contacts?: string[] | null
          expected_duration_minutes?: number | null
          expected_return_time?: string | null
          id?: string
          last_checkin_time?: string | null
          meetup_address?: string | null
          meetup_latitude?: number | null
          meetup_location: string
          meetup_longitude?: number | null
          notes?: string | null
          scheduled_time: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_id?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          created_at?: string
          emergency_contacts?: string[] | null
          expected_duration_minutes?: number | null
          expected_return_time?: string | null
          id?: string
          last_checkin_time?: string | null
          meetup_address?: string | null
          meetup_latitude?: number | null
          meetup_location?: string
          meetup_longitude?: number | null
          notes?: string | null
          scheduled_time?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      saved_comparisons: {
        Row: {
          ad_ids: Json
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_ids?: Json
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_ids?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          category_ids: string[] | null
          created_at: string
          filters: Json
          id: string
          name: string
          notification_enabled: boolean
          search_query: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_ids?: string[] | null
          created_at?: string
          filters?: Json
          id?: string
          name: string
          notification_enabled?: boolean
          search_query?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_ids?: string[] | null
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          notification_enabled?: boolean
          search_query?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      search_alert_matches: {
        Row: {
          ad_id: string
          created_at: string | null
          id: string
          search_alert_id: string
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string | null
          id?: string
          search_alert_id: string
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string | null
          id?: string
          search_alert_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_alert_matches_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_alert_matches_search_alert_id_fkey"
            columns: ["search_alert_id"]
            isOneToOne: false
            referencedRelation: "search_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      search_alerts: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          is_active: boolean | null
          last_checked_at: string | null
          name: string
          notification_enabled: boolean | null
          search_query: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          name: string
          notification_enabled?: boolean | null
          search_query?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          last_checked_at?: string | null
          name?: string
          notification_enabled?: boolean | null
          search_query?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          carrier: string | null
          created_at: string | null
          customs_info: Json | null
          delivered_at: string | null
          dimensions: Json | null
          estimated_delivery: string | null
          from_address: Json | null
          id: string
          insurance_value: number | null
          order_id: string | null
          service_type: string | null
          shipped_at: string | null
          shipping_address: Json
          signature_required: boolean | null
          status: string | null
          tracking_events: Json | null
          tracking_number: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          customs_info?: Json | null
          delivered_at?: string | null
          dimensions?: Json | null
          estimated_delivery?: string | null
          from_address?: Json | null
          id?: string
          insurance_value?: number | null
          order_id?: string | null
          service_type?: string | null
          shipped_at?: string | null
          shipping_address: Json
          signature_required?: boolean | null
          status?: string | null
          tracking_events?: Json | null
          tracking_number?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          customs_info?: Json | null
          delivered_at?: string | null
          dimensions?: Json | null
          estimated_delivery?: string | null
          from_address?: Json | null
          id?: string
          insurance_value?: number | null
          order_id?: string | null
          service_type?: string | null
          shipped_at?: string | null
          shipping_address?: Json
          signature_required?: boolean | null
          status?: string | null
          tracking_events?: Json | null
          tracking_number?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          base_cost: number | null
          created_at: string | null
          description: string | null
          distance_based: boolean | null
          distance_rate: number | null
          id: string
          international: boolean | null
          is_active: boolean | null
          min_order_for_free: number | null
          name: string
          rate_type: string
          updated_at: string | null
          weight_based: boolean | null
          weight_rate: number | null
        }
        Insert: {
          base_cost?: number | null
          created_at?: string | null
          description?: string | null
          distance_based?: boolean | null
          distance_rate?: number | null
          id?: string
          international?: boolean | null
          is_active?: boolean | null
          min_order_for_free?: number | null
          name: string
          rate_type: string
          updated_at?: string | null
          weight_based?: boolean | null
          weight_rate?: number | null
        }
        Update: {
          base_cost?: number | null
          created_at?: string | null
          description?: string | null
          distance_based?: boolean | null
          distance_rate?: number | null
          id?: string
          international?: boolean | null
          is_active?: boolean | null
          min_order_for_free?: number | null
          name?: string
          rate_type?: string
          updated_at?: string | null
          weight_based?: boolean | null
          weight_rate?: number | null
        }
        Relationships: []
      }
      shipping_zones: {
        Row: {
          countries: string[] | null
          created_at: string | null
          id: string
          name: string
          postal_codes: string[] | null
          rate_id: string | null
          states: string[] | null
        }
        Insert: {
          countries?: string[] | null
          created_at?: string | null
          id?: string
          name: string
          postal_codes?: string[] | null
          rate_id?: string | null
          states?: string[] | null
        }
        Update: {
          countries?: string[] | null
          created_at?: string | null
          id?: string
          name?: string
          postal_codes?: string[] | null
          rate_id?: string | null
          states?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_zones_rate_id_fkey"
            columns: ["rate_id"]
            isOneToOne: false
            referencedRelation: "shipping_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_cart: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_cart_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
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
          stripe_customer_id?: string | null
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
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trending_items: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          item_id: string | null
          item_type: string
          last_activity_at: string
          location_area: string
          search_count: number | null
          search_term: string | null
          trend_score: number | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          item_type: string
          last_activity_at?: string
          location_area: string
          search_count?: number | null
          search_term?: string | null
          trend_score?: number | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          item_type?: string
          last_activity_at?: string
          location_area?: string
          search_count?: number | null
          search_term?: string | null
          trend_score?: number | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      trusted_contacts: {
        Row: {
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          contact_user_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          relationship: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          contact_user_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          relationship?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          contact_user_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          relationship?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          interaction_type: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          interaction_type: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          interaction_type?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reputation: {
        Row: {
          average_communication_rating: number | null
          average_payment_safety_rating: number | null
          average_rating: number | null
          average_reliability_rating: number | null
          average_safety_rating: number | null
          five_star_count: number | null
          four_star_count: number | null
          id: string
          last_updated: string
          one_star_count: number | null
          overall_safety_score: number | null
          reputation_score: number | null
          three_star_count: number | null
          total_purchases: number | null
          total_reviews: number | null
          total_sales: number | null
          two_star_count: number | null
          user_id: string
        }
        Insert: {
          average_communication_rating?: number | null
          average_payment_safety_rating?: number | null
          average_rating?: number | null
          average_reliability_rating?: number | null
          average_safety_rating?: number | null
          five_star_count?: number | null
          four_star_count?: number | null
          id?: string
          last_updated?: string
          one_star_count?: number | null
          overall_safety_score?: number | null
          reputation_score?: number | null
          three_star_count?: number | null
          total_purchases?: number | null
          total_reviews?: number | null
          total_sales?: number | null
          two_star_count?: number | null
          user_id: string
        }
        Update: {
          average_communication_rating?: number | null
          average_payment_safety_rating?: number | null
          average_rating?: number | null
          average_reliability_rating?: number | null
          average_safety_rating?: number | null
          five_star_count?: number | null
          four_star_count?: number | null
          id?: string
          last_updated?: string
          one_star_count?: number | null
          overall_safety_score?: number | null
          reputation_score?: number | null
          three_star_count?: number | null
          total_purchases?: number | null
          total_reviews?: number | null
          total_sales?: number | null
          two_star_count?: number | null
          user_id?: string
        }
        Relationships: []
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
      verification_badges: {
        Row: {
          badge_type: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          issued_at: string
          issued_by: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          badge_type: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          issued_at?: string
          issued_by?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          badge_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          issued_at?: string
          issued_by?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          additional_info: string | null
          admin_notes: string | null
          area_code: string | null
          business_document_url: string | null
          business_name: string | null
          business_registration: string | null
          created_at: string
          id: string
          identity_document_url: string | null
          location_coordinates: unknown | null
          phone_number: string | null
          rejection_reason: string | null
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          social_media_urls: Json | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
          verified_location: string | null
          website_url: string | null
        }
        Insert: {
          additional_info?: string | null
          admin_notes?: string | null
          area_code?: string | null
          business_document_url?: string | null
          business_name?: string | null
          business_registration?: string | null
          created_at?: string
          id?: string
          identity_document_url?: string | null
          location_coordinates?: unknown | null
          phone_number?: string | null
          rejection_reason?: string | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_media_urls?: Json | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
          verified_location?: string | null
          website_url?: string | null
        }
        Update: {
          additional_info?: string | null
          admin_notes?: string | null
          area_code?: string | null
          business_document_url?: string | null
          business_name?: string | null
          business_registration?: string | null
          created_at?: string
          id?: string
          identity_document_url?: string | null
          location_coordinates?: unknown | null
          phone_number?: string | null
          rejection_reason?: string | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_media_urls?: Json | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
          verified_location?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      watchlist_notifications: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          is_read: boolean
          user_id: string
          watchlist_id: string
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          user_id: string
          watchlist_id: string
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          user_id?: string
          watchlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_notifications_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watchlist_notifications_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          created_at: string
          criteria: Json
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          criteria?: Json
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          criteria?: Json
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_location_verification: {
        Args: { request_id: string; reviewer_id: string; admin_notes?: string }
        Returns: undefined
      }
      approve_verification: {
        Args: { request_id: string; reviewer_id: string; admin_notes?: string }
        Returns: undefined
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_delivery_distance: {
        Args: { lat1: number; lng1: number; lat2: number; lng2: number }
        Returns: number
      }
      calculate_distance: {
        Args: { lat1: number; lng1: number; lat2: number; lng2: number }
        Returns: number
      }
      cleanup_old_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_typing_indicators: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_message: string
          p_type?: string
          p_data?: Json
          p_action_url?: string
          p_action_label?: string
          p_expires_at?: string
        }
        Returns: string
      }
      expire_featured_ads: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      find_nearby_providers: {
        Args: {
          p_latitude: number
          p_longitude: number
          p_max_distance_km?: number
          p_vehicle_types?: string[]
        }
        Returns: {
          provider_id: string
          business_name: string
          provider_type: string
          distance_km: number
          rating: number
          base_rate: number
          per_km_rate: number
          vehicle_types: string[]
        }[]
      }
      find_similar_ads: {
        Args: {
          target_ad_id: string
          similarity_threshold?: number
          max_results?: number
        }
        Returns: {
          ad_id: string
          similarity_score: number
          title: string
          price: number
          location: string
          image_url: string
          category_name: string
          is_featured: boolean
        }[]
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_analytics_overview: {
        Args: { start_date: string; end_date: string }
        Returns: Json
      }
      get_followers_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_following_count: {
        Args: { target_user_id: string }
        Returns: number
      }
      get_local_reputation: {
        Args: {
          target_user_id: string
          user_lat: number
          user_lng: number
          radius_km?: number
        }
        Returns: {
          user_id: string
          local_reviews_count: number
          local_average_rating: number
          local_average_safety: number
          local_average_communication: number
          local_average_reliability: number
          local_average_payment_safety: number
          local_five_star_count: number
          local_four_star_count: number
          local_three_star_count: number
          local_two_star_count: number
          local_one_star_count: number
          search_radius_km: number
        }[]
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
      get_trending_items: {
        Args: {
          p_location_area: string
          p_item_type?: string
          p_limit?: number
        }
        Returns: {
          item_type: string
          item_id: string
          search_term: string
          category_id: string
          trend_score: number
          view_count: number
          search_count: number
          last_activity_at: string
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
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_ad_views: {
        Args: { ad_id: string }
        Returns: undefined
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      reject_verification: {
        Args: {
          request_id: string
          reviewer_id: string
          rejection_reason: string
          admin_notes?: string
        }
        Returns: undefined
      }
      send_ad_expiring_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      track_trending_activity: {
        Args: {
          p_item_type: string
          p_item_id?: string
          p_search_term?: string
          p_category_id?: string
          p_location_area?: string
          p_activity_type?: string
        }
        Returns: undefined
      }
      update_delivery_status: {
        Args: { p_request_id: string; p_new_status: string }
        Returns: undefined
      }
      update_provider_location: {
        Args: { p_provider_id: string; p_latitude: number; p_longitude: number }
        Returns: undefined
      }
      update_user_reputation: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
