import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

export type Notification = Tables<'notifications'>;

export interface NotificationCreate {
  type?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  expires_at?: string;
  action_url?: string;
  action_label?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byType: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications with pagination
  const fetchNotifications = useCallback(async (page = 0, limit = 20) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (fetchError) throw fetchError;

      if (page === 0) {
        setNotifications(data || []);
      } else {
        setNotifications(prev => [...prev, ...(data || [])]);
      }

      // Update stats
      const unreadCount = (data || []).filter(n => !n.is_read).length;
      const typeCount: Record<string, number> = {};
      (data || []).forEach(n => {
        typeCount[n.type] = (typeCount[n.type] || 0) + 1;
      });

      setStats({
        total: data?.length || 0,
        unread: unreadCount,
        byType: typeCount
      });

    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );

      setStats(prev => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1)
      }));

    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );

      setStats(prev => ({
        ...prev,
        unread: 0
      }));

      toast({
        title: "Success",
        description: "All notifications marked as read"
      });

    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      const notification = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      setStats(prev => ({
        total: prev.total - 1,
        unread: notification && !notification.is_read ? prev.unread - 1 : prev.unread,
        byType: {
          ...prev.byType,
          [notification?.type || 'general']: Math.max(0, (prev.byType[notification?.type || 'general'] || 0) - 1)
        }
      }));

      toast({
        title: "Success",
        description: "Notification deleted"
      });

    } catch (err) {
      console.error('Error deleting notification:', err);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      });
    }
  }, [user, notifications, toast]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
      setStats({
        total: 0,
        unread: 0,
        byType: {}
      });

      toast({
        title: "Success",
        description: "All notifications cleared"
      });

    } catch (err) {
      console.error('Error clearing notifications:', err);
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive"
      });
    }
  }, [user, toast]);

  // Create notification (for system use)
  const createNotification = useCallback(async (notificationData: NotificationCreate) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notificationData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setNotifications(prev => [data, ...prev]);
      setStats(prev => ({
        total: prev.total + 1,
        unread: prev.unread + 1,
        byType: {
          ...prev.byType,
          [data.type]: (prev.byType[data.type] || 0) + 1
        }
      }));

      return data;
    } catch (err) {
      console.error('Error creating notification:', err);
      throw err;
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = payload.new as Notification;
        
        setNotifications(prev => [newNotification, ...prev]);
        setStats(prev => ({
          total: prev.total + 1,
          unread: prev.unread + 1,
          byType: {
            ...prev.byType,
            [newNotification.type]: (prev.byType[newNotification.type] || 0) + 1
          }
        }));

        // Show toast for new notification
        toast({
          title: newNotification.title,
          description: newNotification.message.substring(0, 100) + (newNotification.message.length > 100 ? '...' : ''),
          action: newNotification.action_label && newNotification.action_url ? (
            <button className="text-sm font-medium">
              {newNotification.action_label}
            </button>
          ) : undefined
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  return {
    notifications,
    stats,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    createNotification
  };
};