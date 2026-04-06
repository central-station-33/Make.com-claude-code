import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const mockProperties = [
      {
        id: '1',
        address: '123 Main St, New York, NY 10001',
        price: 750000,
        bedrooms: 2,
        bathrooms: 2,
        square_feet: 1200,
        property_type: 'Condo'
      },
      {
        id: '2',
        address: '456 Park Ave, New York, NY 10022',
        price: 1500000,
        bedrooms: 3,
        bathrooms: 2.5,
        square_feet: 2000,
        property_type: 'Co-op'
      },
      {
        id: '3',
        address: '789 Broadway, New York, NY 10003',
        price: 2500000,
        bedrooms: 4,
        bathrooms: 3,
        square_feet: 3000,
        property_type: 'Townhouse'
      }
    ];

    console.log('Returning mock properties. Count:', mockProperties.length);
    
    return new Response(
      JSON.stringify(mockProperties),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in fetch-properties function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the function logs for more information'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})