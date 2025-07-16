import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// USPS Address Validation API
const USPS_API_URL = 'https://production.shippingapis.com/ShippingAPI.dll';

interface AddressValidationRequest {
  street: string;
  city: string;
  state: string;
  zip: string;
  zip4?: string;
}

interface ValidatedAddress {
  isValid: boolean;
  street: string;
  city: string;
  state: string;
  zip: string;
  zip4?: string;
  suggestions?: string[];
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADDRESS-VALIDATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Address validation started");

    const uspsUserId = Deno.env.get("USPS_USER_ID");
    if (!uspsUserId) {
      throw new Error("USPS_USER_ID environment variable is not set");
    }

    const { street, city, state, zip, zip4 }: AddressValidationRequest = await req.json();
    logStep("Address received", { street, city, state, zip });

    // Build USPS XML request
    const xmlRequest = `
      <AddressValidateRequest USERID="${uspsUserId}">
        <Revision>1</Revision>
        <Address ID="0">
          <Address1></Address1>
          <Address2>${street}</Address2>
          <City>${city}</City>
          <State>${state}</State>
          <Zip5>${zip}</Zip5>
          <Zip4>${zip4 || ''}</Zip4>
        </Address>
      </AddressValidateRequest>
    `.trim();

    logStep("Sending request to USPS");

    const uspsResponse = await fetch(`${USPS_API_URL}?API=Verify&XML=${encodeURIComponent(xmlRequest)}`);
    const xmlResponse = await uspsResponse.text();
    
    logStep("USPS response received");

    // Parse XML response (basic parsing for demonstration)
    const isValid = !xmlResponse.includes('<Error>');
    const validatedAddress: ValidatedAddress = {
      isValid,
      street,
      city,
      state,
      zip,
      zip4
    };

    if (isValid) {
      // Extract validated address from XML if needed
      logStep("Address validation successful");
    } else {
      logStep("Address validation failed", { xmlResponse });
      validatedAddress.suggestions = ["Please check the address and try again"];
    }

    return new Response(JSON.stringify(validatedAddress), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    logStep("Error in address validation", { error: error.message });
    return new Response(JSON.stringify({ 
      error: error.message,
      isValid: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});