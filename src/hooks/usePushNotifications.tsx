import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  getPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  serializePushSubscription,
  type NotificationPreferences,
  type PushSubscriptionData
} from '@/lib/notifications';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check support and initialize
  useEffect(() => {
    const checkSupport = () => {
      const supported = isPushSupported();
      setIsSupported(supported);
      
      if (supported) {
        setPermission(getNotificationPermission());
        initializeServiceWorker();
      }
    };

    checkSupport();
  }, []);

  // Check subscription status when user changes
  useEffect(() => {
    if (user && registration) {
      checkSubscriptionStatus();
    }
  }, [user, registration]);

  const initializeServiceWorker = async () => {
    try {
      const reg = await registerServiceWorker();
      setRegistration(reg);
    } catch (error) {
      console.error('Failed to register service worker:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    if (!registration || !user) return;

    try {
      const subscription = await getPushSubscription(registration);
      setIsSubscribed(!!subscription);

      // Sync with database
      if (subscription) {
        await syncSubscriptionWithDatabase(subscription);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const enableNotifications = async (): Promise<boolean> => {
    if (!isSupported || !registration || !user) {
      toast({
        title: "Not supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);

    try {
      // Request permission
      const permissionResult = await requestNotificationPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive"
        });
        return false;
      }

      // Subscribe to push
      const subscription = await subscribeToPush(registration);
      await syncSubscriptionWithDatabase(subscription);
      
      setIsSubscribed(true);
      
      toast({
        title: "Notifications enabled",
        description: "You'll now receive push notifications for important updates",
      });

      return true;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast({
        title: "Error",
        description: "Failed to enable push notifications",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disableNotifications = async (): Promise<boolean> => {
    if (!registration || !user) return false;

    setIsLoading(true);

    try {
      const subscription = await getPushSubscription(registration);
      
      if (subscription) {
        await unsubscribeFromPush(subscription);
        await removeSubscriptionFromDatabase(subscription.endpoint);
      }

      setIsSubscribed(false);
      
      toast({
        title: "Notifications disabled",
        description: "You will no longer receive push notifications",
      });

      return true;
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast({
        title: "Error",
        description: "Failed to disable push notifications",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const syncSubscriptionWithDatabase = async (subscription: PushSubscription) => {
    if (!user) return;

    try {
      const subscriptionData = serializePushSubscription(subscription);
      
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh_key: subscriptionData.keys.p256dh,
          auth_key: subscriptionData.keys.auth,
          user_agent: navigator.userAgent,
          is_active: true
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error syncing subscription with database:', error);
    }
  };

  const removeSubscriptionFromDatabase = async (endpoint: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('endpoint', endpoint);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing subscription from database:', error);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    enableNotifications,
    disableNotifications,
    canEnable: isSupported && permission !== 'denied' && !isSubscribed,
    canDisable: isSupported && isSubscribed
  };
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch preferences when user changes
  useEffect(() => {
    if (user) {
      fetchPreferences();
    } else {
      setPreferences(null);
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, create default ones
          await createDefaultPreferences();
        } else {
          throw error;
        }
      } else {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          new_messages: true,
          ad_responses: true,
          featured_ad_updates: true,
          price_changes: false,
          ad_expiring: true,
          marketing: false
        })
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user || !preferences) return;

    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved",
      });
    } catch (error) {
      console.error('Error updating preference:', error);
      // Revert on error
      setPreferences(preferences);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive"
      });
    }
  };

  return {
    preferences,
    loading,
    updatePreference,
    refetch: fetchPreferences
  };
};