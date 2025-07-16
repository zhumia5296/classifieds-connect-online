import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ShippingRate {
  id?: string;
  name: string;
  description?: string;
  rate_type: 'flat' | 'calculated' | 'free';
  base_cost: number;
  weight_based: boolean;
  weight_rate: number;
  distance_based: boolean;
  distance_rate: number;
  international: boolean;
  min_order_for_free?: number;
  is_active: boolean;
}

export interface CalculatedShippingRate {
  service: string;
  cost: number;
  deliveryDays: string;
  carrier: string;
}

export interface AddressValidation {
  isValid: boolean;
  street: string;
  city: string;
  state: string;
  zip: string;
  zip4?: string;
  suggestions?: string[];
}

export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

export interface PackageInfo {
  weight: number;
  length: number;
  width: number;
  height: number;
}

export interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  events: TrackingEvent[];
}

export const useShipping = () => {
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchShippingRates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipping_rates')
        .select('*')
        .eq('is_active', true)
        .order('base_cost');

      if (error) throw error;
      setShippingRates((data || []) as ShippingRate[]);
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shipping rates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = async (address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    zip4?: string;
  }): Promise<AddressValidation | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-address', {
        body: address
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error validating address:', error);
      toast({
        title: "Error",
        description: "Failed to validate address.",
        variant: "destructive",
      });
      return null;
    }
  };

  const calculateShippingRates = async (params: {
    fromZip: string;
    toZip: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    serviceType?: string;
    international?: boolean;
    toCountry?: string;
  }): Promise<CalculatedShippingRate[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('calculate-shipping', {
        body: params
      });

      if (error) throw error;
      return data.rates || [];
    } catch (error) {
      console.error('Error calculating shipping rates:', error);
      toast({
        title: "Error",
        description: "Failed to calculate shipping rates.",
        variant: "destructive",
      });
      return [];
    }
  };

  const createShipment = async (params: {
    orderId: string;
    service: string;
    fromAddress: ShippingAddress;
    toAddress: ShippingAddress;
    package: PackageInfo;
    customsInfo?: {
      contents: string;
      value: number;
      items: Array<{
        description: string;
        quantity: number;
        value: number;
        weight: number;
      }>;
    };
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-shipment', {
        body: params
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Shipment created successfully!",
      });
      
      return data.shipment;
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast({
        title: "Error",
        description: "Failed to create shipment.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const trackShipment = async (trackingNumber: string): Promise<TrackingInfo | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('track-shipment', {
        body: { trackingNumber }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error tracking shipment:', error);
      toast({
        title: "Error",
        description: "Failed to track shipment.",
        variant: "destructive",
      });
      return null;
    }
  };

  const getShipmentsByOrder = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          customs_items (*)
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shipments.",
        variant: "destructive",
      });
      return [];
    }
  };

  useEffect(() => {
    fetchShippingRates();
  }, []);

  return {
    shippingRates,
    loading,
    fetchShippingRates,
    validateAddress,
    calculateShippingRates,
    createShipment,
    trackShipment,
    getShipmentsByOrder,
  };
};