import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface EmailNotificationData {
  notification_type: 'new_messages' | 'ad_responses' | 'price_changes' | 'ad_expiring' | 'featured_ad_updates' | 'watchlist_match' | 'similar_ads';
  subject: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
  action_label?: string;
}

export const useEmailNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const sendEmailNotification = useCallback(async (notificationData: EmailNotificationData) => {
    if (!user) {
      throw new Error('User must be authenticated');
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-email-notification', {
        body: {
          user_id: user.id,
          ...notificationData
        }
      });

      if (error) {
        console.error('Error sending email notification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      throw error;
    }
  }, [user]);

  // Send new message notification
  const sendNewMessageNotification = useCallback(async (adTitle: string, senderName: string, adId: string) => {
    return sendEmailNotification({
      notification_type: 'new_messages',
      subject: `New message about: ${adTitle}`,
      title: 'New Message Received',
      message: `You have received a new message from ${senderName} about your listing "${adTitle}".`,
      action_url: `/messages?ad=${adId}`,
      action_label: 'View Message',
      data: { ad_id: adId, sender_name: senderName }
    });
  }, [sendEmailNotification]);

  // Send price change notification
  const sendPriceChangeNotification = useCallback(async (adTitle: string, oldPrice: number, newPrice: number, currency: string, adId: string) => {
    return sendEmailNotification({
      notification_type: 'price_changes',
      subject: `Price Drop Alert: ${adTitle}`,
      title: 'Price Drop Alert!',
      message: `Great news! The price for "${adTitle}" has dropped from ${currency}${oldPrice} to ${currency}${newPrice}.`,
      action_url: `/ad/${adId}`,
      action_label: 'View Listing',
      data: { ad_id: adId, old_price: oldPrice, new_price: newPrice, currency }
    });
  }, [sendEmailNotification]);

  // Send ad expiring notification
  const sendAdExpiringNotification = useCallback(async (adTitle: string, expiresAt: string, adId: string) => {
    const daysLeft = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return sendEmailNotification({
      notification_type: 'ad_expiring',
      subject: `Your listing expires in ${daysLeft} days`,
      title: 'Listing Expiring Soon',
      message: `Your listing "${adTitle}" will expire in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Consider renewing it to keep it active.`,
      action_url: `/dashboard?highlight=${adId}`,
      action_label: 'Manage Listing',
      data: { ad_id: adId, expires_at: expiresAt, days_left: daysLeft }
    });
  }, [sendEmailNotification]);

  // Send watchlist match notification
  const sendWatchlistMatchNotification = useCallback(async (adTitle: string, watchlistName: string, adId: string, watchlistId: string) => {
    return sendEmailNotification({
      notification_type: 'watchlist_match',
      subject: `Watchlist Match: ${adTitle}`,
      title: 'Watchlist Match Found!',
      message: `A new listing "${adTitle}" matches your watchlist "${watchlistName}". Check it out before it's gone!`,
      action_url: `/ad/${adId}`,
      action_label: 'View Listing',
      data: { ad_id: adId, watchlist_id: watchlistId, watchlist_name: watchlistName }
    });
  }, [sendEmailNotification]);

  // Send featured ad confirmation
  const sendFeaturedAdNotification = useCallback(async (adTitle: string, duration: number, adId: string) => {
    return sendEmailNotification({
      notification_type: 'featured_ad_updates',
      subject: `Your listing is now featured!`,
      title: 'Listing Featured Successfully',
      message: `Your listing "${adTitle}" is now featured for ${duration} days and will get priority placement in search results.`,
      action_url: `/ad/${adId}`,
      action_label: 'View Featured Listing',
      data: { ad_id: adId, duration }
    });
  }, [sendEmailNotification]);

  // Send similar ads notification
  const sendSimilarAdsNotification = useCallback(async (adTitle: string, categoryName: string, adId: string) => {
    return sendEmailNotification({
      notification_type: 'similar_ads',
      subject: `New listing in ${categoryName}`,
      title: 'Similar Listing Available',
      message: `A new listing "${adTitle}" has been posted in ${categoryName}, similar to items you've saved.`,
      action_url: `/ad/${adId}`,
      action_label: 'View Listing',
      data: { ad_id: adId, category_name: categoryName }
    });
  }, [sendEmailNotification]);

  return {
    sendEmailNotification,
    sendNewMessageNotification,
    sendPriceChangeNotification,
    sendAdExpiringNotification,
    sendWatchlistMatchNotification,
    sendFeaturedAdNotification,
    sendSimilarAdsNotification
  };
};