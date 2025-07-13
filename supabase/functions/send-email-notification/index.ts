import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  to: string;
  subject: string;
  template: 'new_message' | 'ad_featured' | 'payment_confirmed' | 'ad_expired' | 'report_received';
  data: Record<string, any>;
}

const getEmailTemplate = (template: string, data: Record<string, any>) => {
  switch (template) {
    case 'new_message':
      return {
        subject: `New message about "${data.adTitle}"`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">You have a new message!</h2>
            <p>Someone sent you a message about your ad: <strong>${data.adTitle}</strong></p>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0;"><strong>From:</strong> ${data.senderName}</p>
              <p style="margin: 8px 0 0 0;"><strong>Message:</strong> ${data.message}</p>
            </div>
            <p>
              <a href="${data.messageUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Message
              </a>
            </p>
          </div>
        `
      };
    
    case 'ad_featured':
      return {
        subject: `Your ad "${data.adTitle}" is now featured!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Your ad is now featured! 🌟</h2>
            <p>Great news! Your ad <strong>"${data.adTitle}"</strong> is now featured and will get more visibility.</p>
            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #059669;">
              <p style="margin: 0;"><strong>Featured until:</strong> ${new Date(data.featuredUntil).toLocaleDateString()}</p>
              <p style="margin: 8px 0 0 0;"><strong>Duration:</strong> ${data.durationDays} days</p>
            </div>
            <p>
              <a href="${data.adUrl}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Your Ad
              </a>
            </p>
          </div>
        `
      };
    
    case 'payment_confirmed':
      return {
        subject: 'Payment confirmed - Your ad will be featured soon',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Payment Confirmed! ✅</h2>
            <p>Your payment has been successfully processed. Your ad will be featured shortly.</p>
            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0;"><strong>Ad:</strong> ${data.adTitle}</p>
              <p style="margin: 8px 0 0 0;"><strong>Amount:</strong> $${(data.amount / 100).toFixed(2)}</p>
              <p style="margin: 8px 0 0 0;"><strong>Duration:</strong> ${data.durationDays} days</p>
            </div>
          </div>
        `
      };
    
    case 'ad_expired':
      return {
        subject: `Your featured ad "${data.adTitle}" has expired`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Featured Period Ended</h2>
            <p>Your featured ad <strong>"${data.adTitle}"</strong> has reached the end of its featured period.</p>
            <p>Want to feature it again for better visibility?</p>
            <p>
              <a href="${data.featureUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Feature Again
              </a>
            </p>
          </div>
        `
      };
    
    case 'report_received':
      return {
        subject: 'Report received - We\'re reviewing your submission',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Report Received</h2>
            <p>Thank you for reporting this issue. We take all reports seriously and will review it promptly.</p>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0;"><strong>Report ID:</strong> ${data.reportId}</p>
              <p style="margin: 8px 0 0 0;"><strong>Reason:</strong> ${data.reason}</p>
            </div>
            <p>We'll update you on any actions taken. Thank you for helping keep our platform safe.</p>
          </div>
        `
      };
    
    default:
      return {
        subject: data.subject || 'Notification',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Notification</h2>
            <p>${data.message || 'You have a new notification.'}</p>
          </div>
        `
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, template, data }: EmailNotificationRequest = await req.json();

    if (!to || !template) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, template' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailContent = getEmailTemplate(template, data);
    const finalSubject = subject || emailContent.subject;

    console.log(`Sending ${template} email to ${to}`);

    const emailResponse = await resend.emails.send({
      from: "ClassifiedAds <noreply@resend.dev>",
      to: [to],
      subject: finalSubject,
      html: emailContent.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);