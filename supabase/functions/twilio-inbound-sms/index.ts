// Twilio inbound SMS webhook for The Wire inbox
// Set this URL in Twilio Console → Phone Numbers → Messaging webhook (HTTP POST)
// URL: https://<project>.supabase.co/functions/v1/twilio-inbound-sms

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function twimlResponse(message?: string): Response {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/xml', ...corsHeaders },
  });
}

function normalizePhone(phone: string): string {
  // Strip everything except digits and leading +
  const digits = phone.replace(/[^\d+]/g, '');
  // Ensure E.164 format
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Parse Twilio's application/x-www-form-urlencoded POST body
    const text = await req.text();
    const params = new URLSearchParams(text);

    const from = params.get('From') ?? '';
    const to = params.get('To') ?? '';
    const body = params.get('Body') ?? '';
    const fromCity = params.get('FromCity') ?? '';
    const fromState = params.get('FromState') ?? '';

    if (!from || !body) {
      return twimlResponse();
    }

    const normalizedFrom = normalizePhone(from);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── 1. Find or create contact by phone ──────────────────────────────
    let { data: contact } = await supabase
      .from('wire_contacts')
      .select('id, first_name, last_name, do_not_contact')
      .eq('phone', normalizedFrom)
      .maybeSingle();

    if (!contact) {
      // Try without country code normalization (stored format may differ)
      const { data: alt } = await supabase
        .from('wire_contacts')
        .select('id, first_name, last_name, do_not_contact')
        .ilike('phone', `%${normalizedFrom.replace('+1', '')}`)
        .maybeSingle();
      contact = alt;
    }

    if (!contact) {
      // Auto-create contact from inbound SMS
      const { data: newContact } = await supabase
        .from('wire_contacts')
        .insert({
          first_name: 'Unknown',
          last_name: normalizedFrom,
          phone: normalizedFrom,
          city: fromCity || null,
          state: fromState || null,
          source: 'inbound_sms',
          tags: ['inbound'],
          last_activity: new Date().toISOString(),
        })
        .select('id, first_name, last_name, do_not_contact')
        .single();
      contact = newContact;
    }

    if (!contact) {
      console.error('Failed to find or create contact for', normalizedFrom);
      return twimlResponse();
    }

    // Respect DNC flag — store message but don't reply
    const isDNC = contact.do_not_contact;

    // ── 2. Find or create open SMS conversation ──────────────────────────
    let { data: conversation } = await supabase
      .from('wire_conversations')
      .select('id, unread_count')
      .eq('contact_id', contact.id)
      .eq('channel', 'sms')
      .neq('status', 'closed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const now = new Date().toISOString();

    if (!conversation) {
      const { data: newConv } = await supabase
        .from('wire_conversations')
        .insert({
          contact_id: contact.id,
          channel: 'sms',
          status: 'unread',
          unread_count: 1,
          last_message: body.trim(),
          last_message_at: now,
        })
        .select('id, unread_count')
        .single();
      conversation = newConv;
    } else {
      // Update existing conversation
      await supabase
        .from('wire_conversations')
        .update({
          status: 'unread',
          unread_count: (conversation.unread_count ?? 0) + 1,
          last_message: body.trim(),
          last_message_at: now,
          updated_at: now,
        })
        .eq('id', conversation.id);
    }

    if (!conversation) {
      console.error('Failed to find or create conversation');
      return twimlResponse();
    }

    // ── 3. Insert inbound message ────────────────────────────────────────
    await supabase.from('wire_messages').insert({
      conversation_id: conversation.id,
      direction: 'inbound',
      channel: 'sms',
      body: body.trim(),
      from_address: normalizedFrom,
      to_address: to,
      status: 'received',
    });

    // ── 4. Update contact last_activity ─────────────────────────────────
    await supabase
      .from('wire_contacts')
      .update({ last_activity: now })
      .eq('id', contact.id);

    // Return empty TwiML (no auto-reply — agents respond manually in The Wire)
    return twimlResponse(isDNC ? undefined : undefined);
  } catch (err) {
    console.error('twilio-inbound-sms error:', err);
    return twimlResponse();
  }
});
