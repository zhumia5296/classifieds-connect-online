import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting featured ads expiration cleanup...');

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const currentTime = new Date().toISOString();
    
    // Find all expired featured ads
    const { data: expiredAds, error: fetchError } = await supabaseService
      .from('ads')
      .select('id, title, user_id, featured_until')
      .eq('is_featured', true)
      .lt('featured_until', currentTime);

    if (fetchError) {
      console.error('Error fetching expired featured ads:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredAds?.length || 0} expired featured ads`);

    if (expiredAds && expiredAds.length > 0) {
      // Update expired featured ads
      const { error: updateError } = await supabaseService
        .from('ads')
        .update({ 
          is_featured: false,
          featured_until: null,
          updated_at: currentTime
        })
        .in('id', expiredAds.map(ad => ad.id));

      if (updateError) {
        console.error('Error updating expired featured ads:', updateError);
        throw updateError;
      }

      // Update featured ad orders status
      const { error: orderUpdateError } = await supabaseService
        .from('featured_ad_orders')
        .update({ 
          status: 'expired',
          updated_at: currentTime
        })
        .in('ad_id', expiredAds.map(ad => ad.id))
        .eq('status', 'paid');

      if (orderUpdateError) {
        console.error('Error updating featured ad orders:', orderUpdateError);
        throw orderUpdateError;
      }

      console.log(`Successfully expired ${expiredAds.length} featured ads`);

      // Log the expired ads for monitoring
      expiredAds.forEach(ad => {
        console.log(`Expired featured ad: ${ad.title} (ID: ${ad.id}) - was featured until ${ad.featured_until}`);
      });
    }

    // Also clean up old typing indicators while we're at it
    const { error: typingCleanupError } = await supabaseService
      .from('typing_indicators')
      .delete()
      .lt('expires_at', currentTime);

    if (typingCleanupError) {
      console.warn('Error cleaning up typing indicators:', typingCleanupError);
    }

    const response = {
      success: true,
      expired_count: expiredAds?.length || 0,
      timestamp: currentTime,
      message: `Cleanup completed. Expired ${expiredAds?.length || 0} featured ads.`
    };

    console.log('Cleanup completed successfully:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in cleanup-expired-featured function:', error);
    
    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});