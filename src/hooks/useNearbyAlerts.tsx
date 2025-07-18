import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/hooks/useLocation';

export interface NearbyAlertPreference {
  id: string;
  user_id: string;
  is_enabled: boolean;
  radius_km: number;
  max_price?: number;
  min_price?: number;
  categories: string[];
  conditions: string[];
  keywords?: string;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNearbyAlertData {
  radius_km: number;
  max_price?: number;
  min_price?: number;
  categories?: string[];
  conditions?: string[];
  keywords?: string;
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
}

export const useNearbyAlerts = () => {
  const [preferences, setPreferences] = useState<NearbyAlertPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { location } = useLocation();

  const fetchPreferences = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('nearby_alert_preferences')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPreferences(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch nearby alert preferences';
      setError(message);
      console.error('Error fetching nearby alert preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const createPreference = async (data: CreateNearbyAlertData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('nearby_alert_preferences')
        .insert([{
          ...data,
          user_id: user.id,
          is_enabled: true
        }])
        .select()
        .single();

      if (error) throw error;

      setPreferences(prev => [result, ...prev]);
      
      toast({
        title: "Nearby alerts enabled",
        description: "You'll be notified when new items appear in your area",
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create nearby alert preference';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const updatePreference = async (id: string, updates: Partial<CreateNearbyAlertData & { is_enabled: boolean }>) => {
    try {
      const { data: result, error } = await supabase
        .from('nearby_alert_preferences')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPreferences(prev => 
        prev.map(pref => pref.id === id ? result : pref)
      );

      toast({
        title: "Preferences updated",
        description: "Your nearby alert settings have been saved",
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update nearby alert preference';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const deletePreference = async (id: string) => {
    try {
      const { error } = await supabase
        .from('nearby_alert_preferences')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPreferences(prev => prev.filter(pref => pref.id !== id));
      
      toast({
        title: "Alert deleted",
        description: "Nearby alert preference removed",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete nearby alert preference';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
      throw err;
    }
  };

  const togglePreference = async (id: string, enabled: boolean) => {
    return updatePreference(id, { is_enabled: enabled });
  };

  const hasActiveAlerts = preferences.some(pref => pref.is_enabled);

  const createQuickAlert = async () => {
    if (!location?.coords) {
      toast({
        title: "Location required",
        description: "Please enable location access to set up nearby alerts",
        variant: "destructive"
      });
      return;
    }

    const alertData: CreateNearbyAlertData = {
      radius_km: 25,
      location_lat: location.coords.latitude,
      location_lng: location.coords.longitude,
      location_name: location.address?.split(',')[0] || 'Current location',
      categories: [],
      conditions: []
    };

    return createPreference(alertData);
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  return {
    preferences,
    loading,
    error,
    hasActiveAlerts,
    fetchPreferences,
    createPreference,
    updatePreference,
    deletePreference,
    togglePreference,
    createQuickAlert
  };
};