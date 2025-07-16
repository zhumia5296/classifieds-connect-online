import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutItem {
  ad_id: string;
  quantity: number;
  unit_price: number;
}

interface CheckoutRequest {
  items?: CheckoutItem[];
  seller_id?: string;
  total_amount?: number;
  tier?: string; // For subscription checkout
}

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Create a Supabase client using the anon key for authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const body: CheckoutRequest = await req.json();
    const { tier, items, seller_id, total_amount } = body;

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found, will create new one");
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";

    let session;

    if (tier) {
      // Subscription checkout
      logStep("Creating subscription checkout", { tier });

      const plans = {
        basic: {
          name: "Basic Plan",
          price: 999,
          description: "Enhanced ad posting and basic features"
        },
        premium: {
          name: "Premium Plan", 
          price: 1999,
          description: "Priority listings and advanced features"
        },
        enterprise: {
          name: "Enterprise Plan",
          price: 4999,
          description: "Full access to all premium features"
        }
      };

      const selectedPlan = plans[tier as keyof typeof plans];
      if (!selectedPlan) throw new Error("Invalid subscription tier");

      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { 
                name: selectedPlan.name,
                description: selectedPlan.description
              },
              unit_amount: selectedPlan.price,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing`,
        metadata: {
          user_id: user.id,
          tier: tier
        }
      });
    } else if (items && seller_id) {
      // Product checkout
      logStep("Creating product checkout", { itemCount: items.length, sellerId: seller_id });

      // Validate items and check inventory
      for (const item of items) {
        const { data: ad, error } = await supabaseClient
          .from('ads')
          .select('quantity_available, max_quantity_per_order, is_active, status, title')
          .eq('id', item.ad_id)
          .single();

        if (error || !ad) {
          throw new Error(`Ad ${item.ad_id} not found`);
        }

        if (!ad.is_active || ad.status !== 'active') {
          throw new Error(`Ad "${ad.title}" is not available`);
        }

        if (item.quantity > ad.quantity_available) {
          throw new Error(`Not enough inventory for "${ad.title}"`);
        }

        if (item.quantity > ad.max_quantity_per_order) {
          throw new Error(`Quantity exceeds maximum allowed for "${ad.title}"`);
        }
      }

      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: items.map(item => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Product ${item.ad_id}`,
            },
            unit_amount: Math.round(item.unit_price * 100),
          },
          quantity: item.quantity,
        })),
        mode: "payment",
        success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart`,
        metadata: {
          user_id: user.id,
          seller_id: seller_id,
          items: JSON.stringify(items),
          checkout_type: 'product'
        }
      });

      // Create order record using service role
      const supabaseService = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const { data: order, error: orderError } = await supabaseService
        .from('orders')
        .insert({
          user_id: user.id,
          seller_id: seller_id,
          total_amount: total_amount,
          stripe_session_id: session.id,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        ad_id: item.ad_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity
      }));

      const { error: itemsError } = await supabaseService
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;
    } else {
      throw new Error("Invalid checkout request - missing required parameters");
    }

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});