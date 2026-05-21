// Shared CORS headers for all InRange Edge Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-signature',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Standard response helpers
export const ok = (data: unknown, message = 'Success') =>
  new Response(JSON.stringify({ success: true, message, data, timestamp: new Date().toISOString() }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

export const created = (data: unknown, message = 'Created') =>
  new Response(JSON.stringify({ success: true, message, data, timestamp: new Date().toISOString() }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

export const err = (message: string, status = 500, errors: unknown = null) =>
  new Response(JSON.stringify({ success: false, message, errors, status, timestamp: new Date().toISOString() }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

export const handleOptions = () =>
  new Response('ok', { headers: corsHeaders });
