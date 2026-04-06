import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InboundEmail {
  from: string;
  subject: string;
  text: string;
  to: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: InboundEmail = await req.json();
    console.log('Received email:', payload);

    // Extract name and email from the "from" field
    const fromMatch = payload.from.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/);
    const name = fromMatch?.[1] || 'Unknown';
    const email = fromMatch?.[2] || payload.from;

    // Create a new lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        type: 'Email Lead',
        status: 'New',
        source: 'Email',
        email_source: payload.to,
        email_metadata: {
          subject: payload.subject,
          content: payload.text,
          received_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (leadError) {
      throw leadError;
    }

    // Create a CRM contact for the lead
    const { error: contactError } = await supabase
      .from('crm_contacts')
      .insert({
        lead_id: lead.id,
        status: 'active',
        source: 'Email',
        lifecycle_stage: 'new',
      });

    if (contactError) {
      throw contactError;
    }

    console.log('Successfully created lead and contact from email');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing inbound email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});