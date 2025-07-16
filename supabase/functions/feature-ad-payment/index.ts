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
    const { ad_id, duration_days, package_type, amount } = await req.json();
    
    if (!ad_id || !duration_days || duration_days < 1) {
      throw new Error("Invalid ad_id or duration_days.");
    }
    
    // Define package pricing
    const packagePricing: { [key: string]: number } = {
      'quick-boost': 299,    // $2.99
      'featured': 699,       // $6.99
      'premium': 1299,       // $12.99
      'super-boost': 2499    // $24.99
    };
    
    // Calculate amount based on package or duration
    let calculatedAmount: number;
    if (package_type && packagePricing[package_type]) {
      calculatedAmount = packagePricing[package_type];
    } else if (amount) {
      calculatedAmount = amount;
    } else {
      // Fallback to old pricing model
      calculatedAmount = duration_days === 7 ? 700 : 3000;
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    // Verify user owns the ad
    const { data: ad, error: adError } = await supabaseClient
      .from("ads")
      .select("id, user_id, title")
      .eq("id", ad_id)
      .eq("user_id", user.id)
      .single();

    if (adError || !ad) {
      throw new Error("Ad not found or you don't have permission to feature it");
    }

    // Use calculated amount
    const finalAmount = calculatedAmount;

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: `${package_type ? package_type.charAt(0).toUpperCase() + package_type.slice(1).replace('-', ' ') : 'Feature'} Ad: ${ad.title}`,
              description: `${package_type ? package_type.charAt(0).toUpperCase() + package_type.slice(1).replace('-', ' ') + ' promotion' : 'Feature your ad'} for ${duration_days} days`
            },
            unit_amount: finalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/dashboard?featured=success`,
      cancel_url: `${req.headers.get("origin")}/dashboard?featured=canceled`,
      metadata: {
        ad_id: ad_id,
        duration_days: duration_days.toString(),
        user_id: user.id,
        package_type: package_type || 'standard',
      },
    });

    // Create order record using service role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabaseService.from("featured_ad_orders").insert({
      user_id: user.id,
      ad_id: ad_id,
      stripe_session_id: session.id,
      duration_days: duration_days,
      amount: finalAmount,
      status: "pending",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in feature-ad-payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});