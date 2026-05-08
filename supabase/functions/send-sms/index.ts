// Twilio outbound SMS sender for The Wire inbox
// Called by useWireInbox.sendMessage() for sms channel conversations

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  id: string;            // wire_messages row id to update on delivery
  message: string;
  recipient_phone: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const { id, message, recipient_phone }: SMSRequest = await req.json();

    if (!id || !message || !recipient_phone) {
      return json({ error: 'Missing required fields: id, message, recipient_phone' }, 400);
    }

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      return json({ error: 'Twilio not configured — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER secrets' }, 500);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── Send via Twilio ──────────────────────────────────────────────────
    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        },
        body: new URLSearchParams({
          To: recipient_phone,
          From: twilioPhoneNumber,
          Body: message,
        }).toString(),
      }
    );

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok) {
      console.error('Twilio error:', twilioData);
      await supabase.from('wire_messages').update({ status: 'failed' }).eq('id', id);
      return json({ error: twilioData.message ?? 'Twilio send failed' }, 502);
    }

    // Mark message delivered in wire_messages
    await supabase
      .from('wire_messages')
      .update({ status: 'delivered' })
      .eq('id', id);

    return json({ success: true, sid: twilioData.sid });
  } catch (err) {
    console.error('send-sms error:', err);
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
