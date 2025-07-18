import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SearchAlert {
  id: string;
  name: string;
  search_query: string;
  filters: any;
  is_active: boolean;
  notification_enabled: boolean;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
}

export interface SearchAlertMatch {
  id: string;
  search_alert_id: string;
  ad_id: string;
  created_at: string;
  ads?: {
    title: string;
    price: number;
    currency: string;
    location: string;
  };
}

export const useSearchAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<SearchAlert[]>([]);
  const [matches, setMatches] = useState<SearchAlertMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch search alerts
  const fetchSearchAlerts = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('search_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching search alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recent matches
  const fetchRecentMatches = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('search_alert_matches')
        .select(`
          *,
          ads (
            title,
            price,
            currency,
            location
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching search alert matches:', error);
    }
  };

  // Create search alert
  const createSearchAlert = async (alertData: {
    name: string;
    search_query: string;
    filters: any;
    notification_enabled: boolean;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('search_alerts')
      .insert({
        user_id: user.id,
        ...alertData
      })
      .select()
      .single();

    if (error) throw error;
    
    await fetchSearchAlerts();
    return data;
  };

  // Update search alert
  const updateSearchAlert = async (alertId: string, updates: Partial<SearchAlert>) => {
    const { error } = await supabase
      .from('search_alerts')
      .update(updates)
      .eq('id', alertId);

    if (error) throw error;
    
    await fetchSearchAlerts();
  };

  // Delete search alert
  const deleteSearchAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('search_alerts')
      .delete()
      .eq('id', alertId);

    if (error) throw error;
    
    await fetchSearchAlerts();
  };

  // Toggle alert active status
  const toggleSearchAlert = async (alertId: string, isActive: boolean) => {
    await updateSearchAlert(alertId, { is_active: isActive });
  };

  // Toggle notification status
  const toggleNotifications = async (alertId: string, notificationEnabled: boolean) => {
    await updateSearchAlert(alertId, { notification_enabled: notificationEnabled });
  };

  // Get active alerts count
  const getActiveAlertsCount = () => {
    return alerts.filter(alert => alert.is_active).length;
  };

  // Get alerts with notifications enabled
  const getNotificationAlertsCount = () => {
    return alerts.filter(alert => alert.is_active && alert.notification_enabled).length;
  };

  // Initialize data
  useEffect(() => {
    if (user) {
      fetchSearchAlerts();
      fetchRecentMatches();
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to search alert matches
    const matchesChannel = supabase
      .channel('search-alert-matches')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'search_alert_matches',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchRecentMatches();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(matchesChannel);
    };
  }, [user]);

  return {
    alerts,
    matches,
    isLoading,
    createSearchAlert,
    updateSearchAlert,
    deleteSearchAlert,
    toggleSearchAlert,
    toggleNotifications,
    getActiveAlertsCount,
    getNotificationAlertsCount,
    fetchSearchAlerts,
    fetchRecentMatches
  };
};