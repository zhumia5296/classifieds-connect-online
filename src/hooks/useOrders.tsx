import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface OrderItem {
  id: string;
  ad_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  ad: {
    title: string;
    description: string;
    user_id: string;
    ad_images: Array<{
      image_url: string;
      is_primary: boolean;
    }>;
  };
}

export interface Order {
  id: string;
  user_id: string;
  seller_id: string;
  total_amount: number;
  currency: string;
  status: string;
  stripe_session_id: string | null;
  shipping_method?: string;
  shipping_cost?: number;
  shipping_address?: any;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
}

interface OrderFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchOrders = async (viewType: 'buyer' | 'seller' = 'buyer', filters: OrderFilters = {}) => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            ad:ads (
              title,
              description,
              user_id,
              ad_images (
                image_url,
                is_primary
              )
            )
          )
        `);

      // Filter by user role (buyer or seller)
      if (viewType === 'buyer') {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('seller_id', user.id);
      }

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.minAmount) {
        query = query.gte('total_amount', filters.minAmount);
      }
      if (filters.maxAmount) {
        query = query.lte('total_amount', filters.maxAmount);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Apply search filter (client-side for flexibility)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredData = filteredData.filter(order =>
          order.order_items.some(item =>
            item.ad.title.toLowerCase().includes(searchTerm) ||
            item.ad.description.toLowerCase().includes(searchTerm)
          )
        );
      }

      setOrders(filteredData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            ad:ads (
              title,
              description,
              user_id,
              ad_images (
                image_url,
                is_primary
              )
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order details. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated successfully.",
      });

      // Refresh orders
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getOrderStats = async (viewType: 'buyer' | 'seller' = 'buyer') => {
    if (!user) return null;

    try {
      let query = supabase
        .from('orders')
        .select('total_amount, status');

      if (viewType === 'buyer') {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('seller_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        totalOrders: data.length,
        totalSpent: data.reduce((sum, order) => sum + order.total_amount, 0),
        pendingOrders: data.filter(order => order.status === 'pending').length,
        paidOrders: data.filter(order => order.status === 'paid').length,
      };

      return stats;
    } catch (error) {
      console.error('Error fetching order stats:', error);
      return null;
    }
  };

  return {
    orders,
    loading,
    fetchOrders,
    getOrderById,
    updateOrderStatus,
    getOrderStats,
  };
};