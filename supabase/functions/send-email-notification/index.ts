import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailNotificationRequest {
  user_id: string;
  notification_type: 'new_messages' | 'ad_responses' | 'price_changes' | 'ad_expiring' | 'featured_ad_updates' | 'watchlist_match' | 'similar_ads';
  subject: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
  action_label?: string;
}

const getEmailTemplate = (title: string, message: string, actionUrl?: string, actionLabel?: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f6f9fc; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #3b82f6, #10b981); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
            .content { padding: 30px; }
            .message { font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 30px; }
            .action-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
            .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
            .logo { color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">📋 ClassifiedList</div>
                <h1>${title}</h1>
            </div>
            <div class="content">
                <div class="message">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                ${actionUrl && actionLabel ? `
                    <div style="text-align: center;">
                        <a href="${actionUrl}" class="action-button">${actionLabel}</a>
                    </div>
                ` : ''}
            </div>
            <div class="footer">
                <p>This email was sent because you have email notifications enabled for this type of alert.</p>
                <p>You can manage your notification preferences in your account settings.</p>
                <p>&copy; 2024 ClassifiedList. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      user_id,
      notification_type,
      subject,
      title,
      message,
      data,
      action_url,
      action_label
    }: EmailNotificationRequest = await req.json();

    console.log('Processing email notification for user:', user_id, 'type:', notification_type);

    // Get user profile and email preferences
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        notification_preferences (*)
      `)
      .eq('user_id', user_id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw new Error('User not found');
    }

    // Get user email from auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError || !userData.user?.email) {
      console.error('Error fetching user email:', userError);
      throw new Error('User email not found');
    }

    const userEmail = userData.user.email;
    const preferences = profileData.notification_preferences;

    // Check if user has email notifications enabled for this type
    if (!preferences || !preferences[notification_type]) {
      console.log('User has disabled email notifications for type:', notification_type);
      return new Response(
        JSON.stringify({ success: true, message: 'Email notifications disabled for this type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Resend
    const emailData = {
      from: 'ClassifiedList <noreply@classifiedlist.com>',
      to: [userEmail],
      subject: subject,
      html: getEmailTemplate(title, message, action_url, action_label),
    };

    console.log('Sending email to:', userEmail);
    const emailResponse = await resend.emails.send(emailData);

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error}`);
    }

    // Store notification in database
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type: notification_type,
        title,
        message,
        data: { ...data, email_sent: true, email_id: emailResponse.data?.id },
        action_url,
        action_label
      });

    if (notificationError) {
      console.error('Error storing notification:', notificationError);
      // Don't throw here as email was sent successfully
    }

    console.log('Email sent successfully:', emailResponse.data?.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification sent successfully',
        email_id: emailResponse.data?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-email-notification function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);