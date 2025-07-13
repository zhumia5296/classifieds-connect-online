import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailNotificationData {
  to: string;
  subject?: string;
  template: 'new_message' | 'ad_featured' | 'payment_confirmed' | 'ad_expired' | 'report_received';
  data: Record<string, any>;
}

export const useEmailNotifications = () => {
  const { toast } = useToast();

  const sendEmailNotification = async (notificationData: EmailNotificationData) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-email-notification', {
        body: notificationData
      });

      if (error) {
        console.error('Error sending email notification:', error);
        throw error;
      }

      console.log('Email notification sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      toast({
        title: "Email notification failed",
        description: "Failed to send email notification. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const sendNewMessageNotification = async (recipientEmail: string, senderName: string, adTitle: string, message: string, messageUrl: string) => {
    return sendEmailNotification({
      to: recipientEmail,
      template: 'new_message',
      data: {
        senderName,
        adTitle,
        message: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
        messageUrl
      }
    });
  };

  const sendAdFeaturedNotification = async (userEmail: string, adTitle: string, featuredUntil: string, durationDays: number, adUrl: string) => {
    return sendEmailNotification({
      to: userEmail,
      template: 'ad_featured',
      data: {
        adTitle,
        featuredUntil,
        durationDays,
        adUrl
      }
    });
  };

  const sendPaymentConfirmedNotification = async (userEmail: string, adTitle: string, amount: number, durationDays: number) => {
    return sendEmailNotification({
      to: userEmail,
      template: 'payment_confirmed',
      data: {
        adTitle,
        amount,
        durationDays
      }
    });
  };

  const sendAdExpiredNotification = async (userEmail: string, adTitle: string, featureUrl: string) => {
    return sendEmailNotification({
      to: userEmail,
      template: 'ad_expired',
      data: {
        adTitle,
        featureUrl
      }
    });
  };

  const sendReportReceivedNotification = async (userEmail: string, reportId: string, reason: string) => {
    return sendEmailNotification({
      to: userEmail,
      template: 'report_received',
      data: {
        reportId,
        reason
      }
    });
  };

  return {
    sendEmailNotification,
    sendNewMessageNotification,
    sendAdFeaturedNotification,
    sendPaymentConfirmedNotification,
    sendAdExpiredNotification,
    sendReportReceivedNotification
  };
};