import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  criteria: {
    keywords?: string;
    category_id?: string;
    min_price?: number;
    max_price?: number;
    location?: string;
    radius?: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WatchlistNotification {
  id: string;
  watchlist_id: string;
  ad_id: string;
  user_id: string;
  is_read: boolean;
  created_at: string;
  watchlist?: {
    name: string;
  };
  ad?: {
    title: string;
    price: number;
    currency: string;
    location: string;
  };
}

export const useWatchlists = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [notifications, setNotifications] = useState<WatchlistNotification[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user's watchlists
  useEffect(() => {
    if (user) {
      loadWatchlists();
      loadNotifications();
    }
  }, [user]);

  const loadWatchlists = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWatchlists((data || []) as Watchlist[]);
    } catch (error) {
      console.error('Error loading watchlists:', error);
      toast({
        title: "Error loading watchlists",
        description: "Failed to load your saved searches.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('watchlist_notifications')
        .select(`
          *,
          watchlist:watchlists(name),
          ad:ads(title, price, currency, location)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const createWatchlist = async (watchlistData: {
    name: string;
    criteria: Watchlist['criteria'];
  }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a watchlist.",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('watchlists')
        .insert({
          user_id: user.id,
          name: watchlistData.name,
          criteria: watchlistData.criteria
        });

      if (error) throw error;

      toast({
        title: "Watchlist created",
        description: `"${watchlistData.name}" has been saved. You'll be notified when matching ads are posted.`,
      });

      await loadWatchlists();
      return true;
    } catch (error: any) {
      console.error('Error creating watchlist:', error);
      toast({
        title: "Failed to create watchlist",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateWatchlist = async (id: string, updates: Partial<Watchlist>) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('watchlists')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Watchlist updated",
        description: "Your saved search has been updated.",
      });

      await loadWatchlists();
      return true;
    } catch (error: any) {
      console.error('Error updating watchlist:', error);
      toast({
        title: "Failed to update watchlist",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteWatchlist = async (id: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Watchlist deleted",
        description: "Your saved search has been removed.",
      });

      await loadWatchlists();
      return true;
    } catch (error: any) {
      console.error('Error deleting watchlist:', error);
      toast({
        title: "Failed to delete watchlist",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('watchlist_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getUnreadNotificationCount = () => {
    return notifications.filter(n => !n.is_read).length;
  };

  return {
    watchlists,
    notifications,
    loading,
    createWatchlist,
    updateWatchlist,
    deleteWatchlist,
    markNotificationAsRead,
    getUnreadNotificationCount,
    loadWatchlists,
    loadNotifications
  };
};

export default useWatchlists;