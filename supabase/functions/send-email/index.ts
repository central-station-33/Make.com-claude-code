// SendGrid email sender for The Wire inbox and campaigns
// Called by useWireInbox.sendMessage() for email channel conversations

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendEmailRequest {
  conversation_id: string;
  to: string;
  subject?: string;
  body: string;
  // For campaign sends (no conversation):
  from_name?: string;
  reply_to?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const payload: SendEmailRequest = await req.json();
    const { conversation_id, to, body, subject, from_name, reply_to } = payload;

    if (!to || !body) {
      return json({ error: 'Missing required fields: to, body' }, 400);
    }

    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL');

    if (!sendgridApiKey || !fromEmail) {
      return json({ error: 'SendGrid not configured — set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL secrets' }, 500);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // ── Send via SendGrid ────────────────────────────────────────────────
    const sgPayload = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: from_name ?? 'The Wire' },
      reply_to: reply_to ? { email: reply_to } : undefined,
      subject: subject ?? '(No subject)',
      content: [
        { type: 'text/plain', value: body },
        { type: 'text/html', value: body.replace(/\n/g, '<br>') },
      ],
    };

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sgPayload),
    });

    if (!sgRes.ok) {
      const errText = await sgRes.text();
      console.error('SendGrid error:', errText);
      // Update message status to failed if we have a conversation
      if (conversation_id) {
        await supabase
          .from('wire_messages')
          .update({ status: 'failed' })
          .eq('conversation_id', conversation_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);
      }
      return json({ error: `SendGrid error: ${errText}` }, 502);
    }

    // ── Write to wire_messages if this is an inbox send ──────────────────
    if (conversation_id) {
      const now = new Date().toISOString();

      await supabase.from('wire_messages').update({ status: 'sent' })
        .eq('conversation_id', conversation_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      await supabase
        .from('wire_conversations')
        .update({
          last_message: body.trim().slice(0, 200),
          last_message_at: now,
          updated_at: now,
          status: 'open',
        })
        .eq('id', conversation_id);
    }

    return json({ success: true });
  } catch (err) {
    console.error('send-email error:', err);
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
