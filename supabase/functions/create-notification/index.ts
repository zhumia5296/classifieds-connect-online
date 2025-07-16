import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  user_id: string;
  type?: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
  action_label?: string;
  expires_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, type = 'general', title, message, data = {}, action_url, action_label, expires_at }: NotificationRequest = await req.json();

    if (!user_id || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, message' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create the notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        message,
        data,
        action_url,
        action_label,
        expires_at
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create notification' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check user's notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    let shouldSendPush = false;

    // Determine if we should send push notification based on type and preferences
    if (preferences) {
      switch (type) {
        case 'message':
          shouldSendPush = preferences.new_messages;
          break;
        case 'watchlist':
        case 'ad_response':
          shouldSendPush = preferences.ad_responses;
          break;
        case 'payment':
          shouldSendPush = preferences.featured_ad_updates;
          break;
        case 'price_change':
          shouldSendPush = preferences.price_changes;
          break;
        case 'ad_expiring':
          shouldSendPush = preferences.ad_expiring;
          break;
        case 'system':
          shouldSendPush = preferences.marketing;
          break;
        default:
          shouldSendPush = true; // Default to true for unknown types
      }
    } else {
      shouldSendPush = true; // Default to true if no preferences set
    }

    // Send push notification if enabled
    if (shouldSendPush) {
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            user_id,
            title,
            body: message,
            notification_type: type,
            data: {
              notification_id: notification.id,
              action_url,
              ...data
            }
          }
        });
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
        // Don't fail the entire request if push notification fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notification,
        push_sent: shouldSendPush 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-notification function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});