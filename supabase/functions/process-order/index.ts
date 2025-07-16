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

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    // Use service role to update database
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Update order status
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .update({ status: 'paid' })
      .eq('stripe_session_id', session_id)
      .select(`
        *,
        order_items!inner(
          ad_id,
          quantity
        )
      `)
      .single();

    if (orderError) throw orderError;

    // Update inventory for each item
    for (const item of order.order_items) {
      const { error } = await supabaseService
        .from('ads')
        .update({
          quantity_available: `quantity_available - ${item.quantity}`
        })
        .eq('id', item.ad_id);

      if (error) throw error;
    }

    // Clear cart items for this user
    const userId = session.metadata?.user_id;
    if (userId) {
      const adIds = order.order_items.map(item => item.ad_id);
      await supabaseService
        .from('shopping_cart')
        .delete()
        .eq('user_id', userId)
        .in('ad_id', adIds);
    }

    // Send notification to seller
    const sellerId = order.seller_id;
    await supabaseService.functions.invoke('create-notification', {
      body: {
        user_id: sellerId,
        title: 'New Order Received!',
        message: `You have received a new order for ${order.order_items.length} item(s).`,
        type: 'order',
        data: {
          order_id: order.id,
          total_amount: order.total_amount
        }
      }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      order: order 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Process order error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});