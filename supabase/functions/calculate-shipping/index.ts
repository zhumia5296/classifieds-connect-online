import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShippingCalculationRequest {
  fromZip: string;
  toZip: string;
  weight: number; // in pounds
  length: number; // in inches
  width: number;
  height: number;
  serviceType?: string; // Priority, Express, Ground
  international?: boolean;
  toCountry?: string;
}

interface ShippingRate {
  service: string;
  cost: number;
  deliveryDays: string;
  carrier: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SHIPPING-CALCULATOR] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Shipping calculation started");

    const uspsUserId = Deno.env.get("USPS_USER_ID");
    if (!uspsUserId) {
      throw new Error("USPS_USER_ID environment variable is not set");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const request: ShippingCalculationRequest = await req.json();
    logStep("Calculation request received", request);

    const rates: ShippingRate[] = [];

    // Get shipping rates from database
    const { data: dbRates, error } = await supabase
      .from('shipping_rates')
      .select('*')
      .eq('is_active', true);

    if (error) {
      logStep("Error fetching shipping rates", { error });
    }

    // Add flat rate options
    if (dbRates) {
      for (const rate of dbRates) {
        if (rate.rate_type === 'flat') {
          rates.push({
            service: rate.name,
            cost: rate.base_cost,
            deliveryDays: rate.name.includes('Express') ? '1-2 days' : '3-5 days',
            carrier: 'Internal'
          });
        } else if (rate.rate_type === 'free') {
          rates.push({
            service: rate.name,
            cost: 0,
            deliveryDays: '5-7 days',
            carrier: 'Internal'
          });
        } else if (rate.rate_type === 'calculated') {
          // Calculate based on weight and distance
          let calculatedCost = rate.base_cost;
          
          if (rate.weight_based) {
            calculatedCost += request.weight * rate.weight_rate;
          }
          
          if (rate.distance_based) {
            // Simplified distance calculation (in real app, you'd use proper distance API)
            const estimatedDistance = Math.abs(parseInt(request.fromZip) - parseInt(request.toZip)) / 1000;
            calculatedCost += estimatedDistance * rate.distance_rate;
          }

          rates.push({
            service: rate.name,
            cost: Math.max(calculatedCost, rate.base_cost),
            deliveryDays: rate.international ? '7-14 days' : '3-7 days',
            carrier: 'Calculated'
          });
        }
      }
    }

    // Add USPS rates if not international
    if (!request.international) {
      try {
        const uspsRates = await calculateUSPSRates(request, uspsUserId);
        rates.push(...uspsRates);
      } catch (uspsError) {
        logStep("USPS rate calculation failed", { error: uspsError.message });
      }
    }

    logStep("Shipping rates calculated", { ratesCount: rates.length });

    return new Response(JSON.stringify({ rates }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Error in shipping calculation", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function calculateUSPSRates(request: ShippingCalculationRequest, uspsUserId: string): Promise<ShippingRate[]> {
  const xmlRequest = `
    <RateV4Request USERID="${uspsUserId}">
      <Revision>2</Revision>
      <Package ID="0">
        <Service>ALL</Service>
        <ZipOrigination>${request.fromZip}</ZipOrigination>
        <ZipDestination>${request.toZip}</ZipDestination>
        <Pounds>${Math.floor(request.weight)}</Pounds>
        <Ounces>${Math.round((request.weight % 1) * 16)}</Ounces>
        <Container>RECTANGULAR</Container>
        <Size>REGULAR</Size>
        <Width>${request.width}</Width>
        <Length>${request.length}</Length>
        <Height>${request.height}</Height>
        <Girth>${2 * (request.width + request.height)}</Girth>
      </Package>
    </RateV4Request>
  `.trim();

  const uspsResponse = await fetch(`https://production.shippingapis.com/ShippingAPI.dll?API=RateV4&XML=${encodeURIComponent(xmlRequest)}`);
  const xmlResponse = await uspsResponse.text();

  // Basic XML parsing (in real app, use proper XML parser)
  const rates: ShippingRate[] = [];
  
  if (xmlResponse.includes('<Postage>')) {
    // Mock rates for demonstration
    rates.push(
      {
        service: 'USPS Ground Advantage',
        cost: 8.50,
        deliveryDays: '3-5 days',
        carrier: 'USPS'
      },
      {
        service: 'USPS Priority Mail',
        cost: 12.90,
        deliveryDays: '1-3 days',
        carrier: 'USPS'
      },
      {
        service: 'USPS Priority Mail Express',
        cost: 28.95,
        deliveryDays: '1-2 days',
        carrier: 'USPS'
      }
    );
  }

  return rates;
}