import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackingEvent {
  timestamp: string;
  status: string;
  location: string;
  description: string;
}

interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  status: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  events: TrackingEvent[];
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRACK-SHIPMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Shipment tracking started");

    const uspsUserId = Deno.env.get("USPS_USER_ID");
    if (!uspsUserId) {
      throw new Error("USPS_USER_ID environment variable is not set");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { trackingNumber } = await req.json();
    logStep("Tracking request received", { trackingNumber });

    // Get tracking info from USPS API
    const trackingInfo = await getUSPSTracking(trackingNumber, uspsUserId);

    // Update shipment in database
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('*')
      .eq('tracking_number', trackingNumber)
      .single();

    if (shipment && !shipmentError) {
      const updates: any = {
        status: trackingInfo.status,
        tracking_events: trackingInfo.events,
        updated_at: new Date().toISOString()
      };

      if (trackingInfo.actualDelivery) {
        updates.delivered_at = trackingInfo.actualDelivery;
      }

      if (trackingInfo.estimatedDelivery) {
        updates.estimated_delivery = trackingInfo.estimatedDelivery;
      }

      const { error: updateError } = await supabase
        .from('shipments')
        .update(updates)
        .eq('tracking_number', trackingNumber);

      if (updateError) {
        logStep("Error updating shipment", { error: updateError });
      }

      // Update order status if delivered
      if (trackingInfo.status === 'delivered') {
        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update({ 
            status: 'delivered',
            actual_delivery_date: trackingInfo.actualDelivery 
          })
          .eq('tracking_number', trackingNumber);

        if (orderUpdateError) {
          logStep("Error updating order status", { error: orderUpdateError });
        }
      }
    }

    logStep("Tracking info retrieved", { status: trackingInfo.status });

    return new Response(JSON.stringify(trackingInfo), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Error in shipment tracking", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function getUSPSTracking(trackingNumber: string, uspsUserId: string): Promise<TrackingInfo> {
  const xmlRequest = `
    <TrackFieldRequest USERID="${uspsUserId}">
      <Revision>1</Revision>
      <ClientIp>127.0.0.1</ClientIp>
      <SourceId>Lovable</SourceId>
      <TrackID ID="${trackingNumber}"></TrackID>
    </TrackFieldRequest>
  `.trim();

  try {
    const uspsResponse = await fetch(
      `https://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=${encodeURIComponent(xmlRequest)}`
    );
    const xmlResponse = await uspsResponse.text();

    // Basic XML parsing (in real app, use proper XML parser)
    // For demonstration, return mock data
    const mockEvents: TrackingEvent[] = [
      {
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'shipped',
        location: 'Origin Facility',
        description: 'Package picked up by carrier'
      },
      {
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_transit',
        location: 'Distribution Center',
        description: 'Package in transit'
      },
      {
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'out_for_delivery',
        location: 'Local Facility',
        description: 'Out for delivery'
      }
    ];

    const trackingInfo: TrackingInfo = {
      trackingNumber,
      carrier: 'USPS',
      status: 'out_for_delivery',
      estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      events: mockEvents
    };

    // Check if package is delivered (mock logic)
    if (Math.random() > 0.7) {
      trackingInfo.status = 'delivered';
      trackingInfo.actualDelivery = new Date().toISOString();
      trackingInfo.events.push({
        timestamp: new Date().toISOString(),
        status: 'delivered',
        location: 'Delivery Address',
        description: 'Package delivered'
      });
    }

    return trackingInfo;

  } catch (error) {
    throw new Error(`USPS tracking failed: ${error.message}`);
  }
}