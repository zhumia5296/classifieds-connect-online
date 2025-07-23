import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface TrustedContact {
  id: string;
  contact_name: string;
  contact_phone?: string;
  contact_email?: string;
  contact_user_id?: string;
  relationship?: string;
  is_active: boolean;
  created_at: string;
}

export interface SafetyCheckin {
  id: string;
  user_id: string;
  ad_id?: string;
  meetup_location: string;
  meetup_address?: string;
  meetup_latitude?: number;
  meetup_longitude?: number;
  scheduled_time: string;
  expected_duration_minutes: number;
  expected_return_time?: string;
  status: 'scheduled' | 'started' | 'completed' | 'overdue' | 'emergency';
  last_checkin_time?: string;
  emergency_contacts: string[];
  notes?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface CheckinUpdate {
  id: string;
  checkin_id: string;
  status: 'en_route' | 'arrived' | 'safe' | 'completed' | 'help_needed' | 'emergency';
  location_latitude?: number;
  location_longitude?: number;
  message?: string;
  is_automatic: boolean;
  created_at: string;
}

export const useSafetyCheckins = () => {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState<SafetyCheckin[]>([]);
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's safety check-ins
  const fetchCheckins = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('safety_checkins')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_time', { ascending: false });

      if (fetchError) throw fetchError;
      setCheckins((data || []) as SafetyCheckin[]);
    } catch (err) {
      console.error('Error fetching safety check-ins:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch safety check-ins');
    } finally {
      setLoading(false);
    }
  };

  // Fetch trusted contacts
  const fetchTrustedContacts = async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('trusted_contacts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTrustedContacts(data || []);
    } catch (err) {
      console.error('Error fetching trusted contacts:', err);
    }
  };

  // Create a new safety check-in
  const createCheckin = async (checkinData: Omit<SafetyCheckin, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('safety_checkins')
      .insert({
        ...checkinData,
        user_id: user.id,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) throw error;
    
    await fetchCheckins();
    toast.success('Safety check-in created and contacts notified!');
    return data;
  };

  // Update check-in status
  const updateCheckinStatus = async (checkinId: string, status: SafetyCheckin['status'], message?: string) => {
    const { error } = await supabase
      .from('safety_checkins')
      .update({ 
        status,
        last_checkin_time: new Date().toISOString()
      })
      .eq('id', checkinId);

    if (error) throw error;

    // Create a check-in update entry
    if (message) {
      await supabase
        .from('checkin_updates')
        .insert({
          checkin_id: checkinId,
          status: status === 'started' ? 'arrived' : status === 'completed' ? 'completed' : 'safe',
          message,
          is_automatic: false
        });
    }

    await fetchCheckins();
    toast.success('Check-in status updated!');
  };

  // Add trusted contact
  const addTrustedContact = async (contactData: Omit<TrustedContact, 'id' | 'created_at' | 'is_active'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('trusted_contacts')
      .insert({
        ...contactData,
        user_id: user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    
    await fetchTrustedContacts();
    toast.success('Trusted contact added successfully!');
    return data;
  };

  // Remove trusted contact
  const removeTrustedContact = async (contactId: string) => {
    const { error } = await supabase
      .from('trusted_contacts')
      .update({ is_active: false })
      .eq('id', contactId);

    if (error) throw error;
    
    await fetchTrustedContacts();
    toast.success('Trusted contact removed');
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    fetchCheckins();
    fetchTrustedContacts();

    // Subscribe to check-in updates
    const checkinSubscription = supabase
      .channel('safety-checkins-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'safety_checkins',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Check-in update:', payload);
        fetchCheckins();
      })
      .subscribe();

    // Subscribe to trusted contacts updates
    const contactsSubscription = supabase
      .channel('trusted-contacts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trusted_contacts',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Trusted contacts update:', payload);
        fetchTrustedContacts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(checkinSubscription);
      supabase.removeChannel(contactsSubscription);
    };
  }, [user]);

  return {
    checkins,
    trustedContacts,
    loading,
    error,
    createCheckin,
    updateCheckinStatus,
    addTrustedContact,
    removeTrustedContact,
    refetch: fetchCheckins
  };
};