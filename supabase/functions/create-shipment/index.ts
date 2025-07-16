import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateShipmentRequest {
  orderId: string;
  service: string;
  fromAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  toAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  package: {
    weight: number;
    length: number;
    width: number;
    height: number;
  };
  customsInfo?: {
    contents: string;
    value: number;
    items: Array<{
      description: string;
      quantity: number;
      value: number;
      weight: number;
    }>;
  };
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SHIPMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Shipment creation started");

    const uspsUserId = Deno.env.get("USPS_USER_ID");
    if (!uspsUserId) {
      throw new Error("USPS_USER_ID environment variable is not set");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const shipmentRequest: CreateShipmentRequest = await req.json();
    logStep("Shipment request received", { orderId: shipmentRequest.orderId });

    // Verify user owns the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', shipmentRequest.orderId)
      .eq('seller_id', user.id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found or you don't have permission to create shipment");
    }

    // Generate tracking number (in real app, this would come from USPS API)
    const trackingNumber = `9400100000000000${Date.now().toString().slice(-6)}`;

    // Create shipment in database
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .insert({
        order_id: shipmentRequest.orderId,
        tracking_number: trackingNumber,
        carrier: 'USPS',
        service_type: shipmentRequest.service,
        status: 'pending',
        shipping_address: shipmentRequest.toAddress,
        from_address: shipmentRequest.fromAddress,
        weight: shipmentRequest.package.weight,
        dimensions: shipmentRequest.package,
        customs_info: shipmentRequest.customsInfo || null
      })
      .select()
      .single();

    if (shipmentError) {
      logStep("Error creating shipment", { error: shipmentError });
      throw new Error("Failed to create shipment");
    }

    // Update order with shipping info
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        tracking_number: trackingNumber,
        carrier: 'USPS',
        status: 'shipped',
        shipping_address: shipmentRequest.toAddress
      })
      .eq('id', shipmentRequest.orderId);

    if (updateError) {
      logStep("Error updating order", { error: updateError });
    }

    // Create customs items if international
    if (shipmentRequest.customsInfo?.items) {
      const customsItems = shipmentRequest.customsInfo.items.map(item => ({
        shipment_id: shipment.id,
        description: item.description,
        quantity: item.quantity,
        value: item.value,
        weight: item.weight
      }));

      const { error: customsError } = await supabase
        .from('customs_items')
        .insert(customsItems);

      if (customsError) {
        logStep("Error creating customs items", { error: customsError });
      }
    }

    // In a real implementation, you would:
    // 1. Call USPS API to create actual shipping label
    // 2. Store the label URL
    // 3. Set up tracking webhooks

    logStep("Shipment created successfully", { trackingNumber });

    return new Response(JSON.stringify({
      shipment: {
        id: shipment.id,
        trackingNumber,
        carrier: 'USPS',
        service: shipmentRequest.service,
        status: 'pending',
        labelUrl: null // Would contain actual label URL from USPS
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Error in shipment creation", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});