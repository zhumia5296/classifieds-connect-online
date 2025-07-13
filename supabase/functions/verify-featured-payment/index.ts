import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const { session_id } = await req.json();
    
    if (!session_id) {
      throw new Error("Session ID is required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get order details
    const { data: order, error: orderError } = await supabaseService
      .from("featured_ad_orders")
      .select("*")
      .eq("stripe_session_id", session_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Calculate featured_until date
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + order.duration_days);

    // Update order status and featured_until
    await supabaseService
      .from("featured_ad_orders")
      .update({ 
        status: "paid", 
        featured_until: featuredUntil.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", order.id);

    // Update the ad to be featured
    await supabaseService
      .from("ads")
      .update({
        is_featured: true,
        featured_until: featuredUntil.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", order.ad_id);

    return new Response(JSON.stringify({ 
      success: true, 
      featured_until: featuredUntil.toISOString() 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in verify-featured-payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});