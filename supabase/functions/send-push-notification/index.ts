import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  user_id?: string;
  user_ids?: string[];
  title: string;
  body: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  image?: string;
  tag?: string;
  notification_type: 'new_messages' | 'ad_responses' | 'featured_ad_updates' | 'price_changes' | 'ad_expiring' | 'marketing';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      user_id, 
      user_ids, 
      title, 
      body, 
      data = {}, 
      actions = [], 
      image, 
      tag, 
      notification_type 
    }: PushNotificationRequest = await req.json();

    console.log('Sending push notification:', { title, body, notification_type });

    // Determine target users
    const targetUserIds = user_ids || (user_id ? [user_id] : []);
    
    if (targetUserIds.length === 0) {
      throw new Error('No target users specified');
    }

    // Get active push subscriptions for target users
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .select(`
        *,
        notification_preferences!inner(*)
      `)
      .in('user_id', targetUserIds)
      .eq('is_active', true);

    if (subscriptionsError) {
      throw subscriptionsError;
    }

    console.log(`Found ${subscriptions?.length || 0} active subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active push subscriptions found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter subscriptions based on user preferences
    const filteredSubscriptions = subscriptions.filter(sub => {
      const prefs = sub.notification_preferences;
      return prefs && prefs[notification_type] === true;
    });

    console.log(`${filteredSubscriptions.length} users have opted in for ${notification_type} notifications`);

    // Prepare notification payload
    const notificationPayload = {
      title,
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      image,
      data: {
        ...data,
        timestamp: Date.now(),
        type: notification_type
      },
      actions,
      tag: tag || notification_type,
      requireInteraction: ['new_messages', 'ad_responses'].includes(notification_type),
      vibrate: [200, 100, 200]
    };

    // Send push notifications
    const pushPromises = filteredSubscriptions.map(async (subscription) => {
      try {
        // Note: In a real implementation, you would use a service like 
        // web-push library or a push service provider
        // For now, we'll simulate the push notification
        console.log(`Sending push to user ${subscription.user_id}`);
        
        // You would implement actual push sending here using:
        // - Web Push Protocol
        // - FCM (Firebase Cloud Messaging)
        // - Or another push service provider
        
        return {
          success: true,
          user_id: subscription.user_id,
          endpoint: subscription.endpoint
        };
      } catch (error) {
        console.error(`Failed to send push to user ${subscription.user_id}:`, error);
        return {
          success: false,
          user_id: subscription.user_id,
          error: error.message
        };
      }
    });

    const results = await Promise.all(pushPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Push notification results: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        message: 'Push notifications processed',
        total_subscriptions: filteredSubscriptions.length,
        successful: successCount,
        failed: failureCount,
        results: results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error sending push notifications:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send push notifications',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});