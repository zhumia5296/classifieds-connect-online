import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DeliveryProvider {
  id: string;
  user_id: string;
  business_name: string;
  provider_type: string;
  vehicle_types: string[];
  service_areas: any;
  base_rate: number;
  per_km_rate: number;
  per_minute_rate: number;
  minimum_order_value?: number;
  maximum_distance_km?: number;
  maximum_weight_kg?: number;
  is_active: boolean;
  is_available: boolean;
  current_latitude?: number;
  current_longitude?: number;
  last_location_update?: string;
  rating: number;
  total_deliveries: number;
  phone_number?: string;
  emergency_contact?: string;
  license_plate?: string;
  insurance_expiry?: string;
  background_check_status?: string;
  verification_documents?: any;
  availability_schedule?: any;
  created_at: string;
  updated_at: string;
}

export interface NearbyProvider {
  provider_id: string;
  business_name: string;
  provider_type: string;
  distance_km: number;
  rating: number;
  base_rate: number;
  per_km_rate: number;
  vehicle_types: string[];
}

export interface DeliveryRequest {
  id: string;
  user_id: string;
  order_id?: string;
  ad_id?: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  pickup_instructions?: string;
  pickup_time_window_start?: string;
  pickup_time_window_end?: string;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  delivery_contact_name: string;
  delivery_contact_phone: string;
  delivery_instructions?: string;
  delivery_time_window_start?: string;
  delivery_time_window_end?: string;
  package_description: string;
  package_weight_kg?: number;
  package_dimensions?: any;
  package_value?: number;
  special_handling?: string[];
  delivery_type: string;
  urgency_level: string;
  signature_required: boolean;
  photo_confirmation_required: boolean;
  estimated_distance_km?: number;
  estimated_duration_minutes?: number;
  customer_budget?: number;
  estimated_cost?: number;
  final_cost?: number;
  assigned_provider_id?: string;
  status: string;
  requested_at: string;
  accepted_at?: string;
  quoted_at?: string;
  pickup_scheduled_at?: string;
  pickup_started_at?: string;
  picked_up_at?: string;
  delivery_started_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  assigned_provider?: DeliveryProvider;
}

export interface DeliveryQuote {
  id: string;
  delivery_request_id: string;
  provider_id: string;
  quoted_price: number;
  estimated_pickup_time?: string;
  estimated_delivery_time?: string;
  message?: string;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  provider?: DeliveryProvider;
}

export interface DeliveryTracking {
  id: string;
  delivery_request_id: string;
  provider_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  heading_degrees?: number;
  speed_kmh?: number;
  status: string;
  activity_type?: string;
  notes?: string;
  photo_urls?: string[];
  battery_level?: number;
  device_info?: any;
  tracked_at: string;
  created_at: string;
}

export const useDeliveryNetwork = () => {
  const { user } = useAuth();
  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>([]);
  const [nearbyProviders, setNearbyProviders] = useState<NearbyProvider[]>([]);
  const [quotes, setQuotes] = useState<DeliveryQuote[]>([]);
  const [tracking, setTracking] = useState<DeliveryTracking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's delivery requests
  const fetchDeliveryRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_requests')
        .select(`
          *,
          assigned_provider:delivery_providers(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeliveryRequests(data || []);
    } catch (err) {
      console.error('Error fetching delivery requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch delivery requests');
    } finally {
      setLoading(false);
    }
  };

  // Find nearby providers
  const findNearbyProviders = async (
    latitude: number, 
    longitude: number, 
    maxDistance = 25,
    vehicleTypes?: string[]
  ) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('find_nearby_providers', {
        p_latitude: latitude,
        p_longitude: longitude,
        p_max_distance_km: maxDistance,
        p_vehicle_types: vehicleTypes
      });

      if (error) throw error;
      setNearbyProviders(data || []);
      return data || [];
    } catch (err) {
      console.error('Error finding nearby providers:', err);
      setError(err instanceof Error ? err.message : 'Failed to find nearby providers');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create delivery request
  const createDeliveryRequest = async (requestData: any) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_requests')
        .insert({
          ...requestData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setDeliveryRequests(prev => [data as DeliveryRequest, ...prev]);
      toast.success('Delivery request created successfully');
      return data;
    } catch (err) {
      console.error('Error creating delivery request:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create delivery request';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update delivery status
  const updateDeliveryStatus = async (requestId: string, newStatus: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('update_delivery_status', {
        p_request_id: requestId,
        p_new_status: newStatus
      });

      if (error) throw error;

      // Update local state
      setDeliveryRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: newStatus, updated_at: new Date().toISOString() }
            : req
        )
      );

      toast.success('Delivery status updated');
    } catch (err) {
      console.error('Error updating delivery status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update delivery status';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch quotes for a delivery request
  const fetchQuotes = async (requestId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_quotes')
        .select(`
          *,
          provider:delivery_providers(*)
        `)
        .eq('delivery_request_id', requestId)
        .eq('is_active', true)
        .order('quoted_price', { ascending: true });

      if (error) throw error;
      setQuotes(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Accept a quote
  const acceptQuote = async (quoteId: string, requestId: string) => {
    try {
      setLoading(true);
      
      // Get the quote details
      const { data: quote, error: quoteError } = await supabase
        .from('delivery_quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      // Update the delivery request with the accepted provider
      const { error: updateError } = await supabase
        .from('delivery_requests')
        .update({
          assigned_provider_id: quote.provider_id,
          final_cost: quote.quoted_price,
          status: 'accepted'
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Deactivate all quotes for this request
      const { error: deactivateError } = await supabase
        .from('delivery_quotes')
        .update({ is_active: false })
        .eq('delivery_request_id', requestId);

      if (deactivateError) throw deactivateError;

      toast.success('Quote accepted successfully');
      await fetchDeliveryRequests();
    } catch (err) {
      console.error('Error accepting quote:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept quote';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch real-time tracking data
  const fetchTracking = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('delivery_tracking')
        .select('*')
        .eq('delivery_request_id', requestId)
        .order('tracked_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTracking(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tracking data');
      return [];
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to delivery request changes
    const requestsChannel = supabase
      .channel('delivery-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_requests',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Delivery request change:', payload);
          fetchDeliveryRequests();
        }
      )
      .subscribe();

    // Subscribe to quotes changes
    const quotesChannel = supabase
      .channel('delivery-quotes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_quotes'
        },
        (payload) => {
          console.log('Quote change:', payload);
          // Refresh quotes if we're tracking them
          if (quotes.length > 0) {
            const requestId = (payload.new as any)?.delivery_request_id || (payload.old as any)?.delivery_request_id;
            if (requestId) {
              fetchQuotes(requestId);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to tracking updates
    const trackingChannel = supabase
      .channel('delivery-tracking-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_tracking'
        },
        (payload) => {
          console.log('New tracking update:', payload);
          if (payload.new) {
            setTracking(prev => [payload.new as DeliveryTracking, ...prev.slice(0, 49)]);
          }
        }
      )
      .subscribe();

    return () => {
      requestsChannel.unsubscribe();
      quotesChannel.unsubscribe();
      trackingChannel.unsubscribe();
    };
  }, [user, quotes.length]);

  // Fetch initial data
  useEffect(() => {
    if (user) {
      fetchDeliveryRequests();
    }
  }, [user]);

  return {
    deliveryRequests,
    nearbyProviders,
    quotes,
    tracking,
    loading,
    error,
    fetchDeliveryRequests,
    findNearbyProviders,
    createDeliveryRequest,
    updateDeliveryStatus,
    fetchQuotes,
    acceptQuote,
    fetchTracking,
    clearError: () => setError(null)
  };
};