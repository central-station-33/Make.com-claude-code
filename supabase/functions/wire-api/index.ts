// The Wire — Retool REST API
// Exposes Wire resources (contacts, conversations, opportunities, appointments,
// automations, campaigns) over HTTP so Retool can consume them.
//
// Authentication: pass the Supabase service_role key as
//   Authorization: Bearer <service_role_key>
// or set WIRE_API_KEY env var and pass it as X-Wire-Api-Key header.
//
// Routes:
//   GET  /wire-api/contacts
//   GET  /wire-api/contacts/:id
//   POST /wire-api/contacts
//   PATCH /wire-api/contacts/:id
//   DELETE /wire-api/contacts/:id
//
//   GET  /wire-api/conversations
//   GET  /wire-api/conversations/:id/messages
//   POST /wire-api/conversations/:id/messages
//
//   GET  /wire-api/opportunities
//   POST /wire-api/opportunities
//   PATCH /wire-api/opportunities/:id
//
//   GET  /wire-api/appointments
//   POST /wire-api/appointments
//   PATCH /wire-api/appointments/:id
//
//   GET  /wire-api/automations
//   GET  /wire-api/campaigns
//   GET  /wire-api/stats

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Authorization, X-Wire-Api-Key, Content-Type, apikey, x-client-info',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function error(message: string, status = 400) {
  return json({ error: message }, status);
}

function isAuthenticated(req: Request): boolean {
  const apiKey = req.headers.get('X-Wire-Api-Key');
  const expectedKey = Deno.env.get('WIRE_API_KEY');
  if (apiKey && expectedKey && apiKey === expectedKey) return true;

  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return !!token && token === serviceKey;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!isAuthenticated(req)) {
    return error('Unauthorized', 401);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const url = new URL(req.url);
  // Strip function prefix so path starts after /wire-api
  const segments = url.pathname.replace(/^\/wire-api\/?/, '').split('/').filter(Boolean);
  const [resource, idOrSub, sub] = segments;
  const method = req.method;

  // ── /stats ─────────────────────────────────────────────────────────────────
  if (resource === 'stats' && method === 'GET') {
    const [contacts, conversations, opportunities, automations] = await Promise.all([
      supabase.from('wire_contacts').select('id', { count: 'exact', head: true }),
      supabase.from('wire_conversations').select('id, unread_count, status'),
      supabase.from('wire_opportunities').select('value, status'),
      supabase.from('wire_automations').select('status'),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const { count: newToday } = await supabase
      .from('wire_contacts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today);

    const convRows = conversations.data ?? [];
    const oppRows = opportunities.data ?? [];
    const autoRows = automations.data ?? [];

    return json({
      total_contacts: contacts.count ?? 0,
      new_contacts_today: newToday ?? 0,
      open_conversations: convRows.filter((c) => c.status === 'open').length,
      unread_messages: convRows.reduce((s: number, c: { unread_count: number }) => s + (c.unread_count ?? 0), 0),
      open_opportunities: oppRows.filter((o) => o.status === 'open').length,
      pipeline_value: oppRows
        .filter((o) => o.status === 'open')
        .reduce((s: number, o: { value: number }) => s + (o.value ?? 0), 0),
      active_automations: autoRows.filter((a) => a.status === 'active').length,
    });
  }

  // ── /contacts ───────────────────────────────────────────────────────────────
  if (resource === 'contacts') {
    if (!idOrSub) {
      if (method === 'GET') {
        const search = url.searchParams.get('search');
        const tag = url.searchParams.get('tag');
        const limit = Number(url.searchParams.get('limit') ?? 50);
        const offset = Number(url.searchParams.get('offset') ?? 0);

        let q = supabase
          .from('wire_contacts')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (search) {
          q = q.or(
            `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
          );
        }
        if (tag) {
          q = q.contains('tags', [tag]);
        }
        const { data, error: err, count } = await q;
        if (err) return error(err.message);
        return json({ data, count });
      }
      if (method === 'POST') {
        const body = await req.json();
        const { data, error: err } = await supabase
          .from('wire_contacts')
          .insert(body)
          .select()
          .single();
        if (err) return error(err.message);
        return json(data, 201);
      }
    } else {
      const id = idOrSub;
      if (method === 'GET') {
        const { data, error: err } = await supabase
          .from('wire_contacts')
          .select('*')
          .eq('id', id)
          .single();
        if (err) return error(err.message, 404);
        return json(data);
      }
      if (method === 'PATCH') {
        const body = await req.json();
        const { data, error: err } = await supabase
          .from('wire_contacts')
          .update({ ...body, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (err) return error(err.message);
        return json(data);
      }
      if (method === 'DELETE') {
        const { error: err } = await supabase.from('wire_contacts').delete().eq('id', id);
        if (err) return error(err.message);
        return json({ deleted: true });
      }
    }
  }

  // ── /conversations ──────────────────────────────────────────────────────────
  if (resource === 'conversations') {
    if (!idOrSub) {
      if (method === 'GET') {
        const status = url.searchParams.get('status');
        const channel = url.searchParams.get('channel');
        const limit = Number(url.searchParams.get('limit') ?? 50);
        const offset = Number(url.searchParams.get('offset') ?? 0);

        let q = supabase
          .from('wire_conversations')
          .select('*, contact:wire_contacts(*)')
          .order('last_message_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) q = q.eq('status', status);
        if (channel) q = q.eq('channel', channel);

        const { data, error: err } = await q;
        if (err) return error(err.message);
        return json({ data });
      }
    } else if (sub === 'messages' || (!sub && idOrSub)) {
      const convId = idOrSub;
      if (method === 'GET') {
        const { data, error: err } = await supabase
          .from('wire_messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });
        if (err) return error(err.message);
        return json({ data });
      }
      if (method === 'POST') {
        const body = await req.json();
        const { data, error: err } = await supabase
          .from('wire_messages')
          .insert({ ...body, conversation_id: convId, direction: 'outbound' })
          .select()
          .single();
        if (err) return error(err.message);
        // Update conversation last_message
        await supabase
          .from('wire_conversations')
          .update({
            last_message: body.body,
            last_message_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', convId);
        return json(data, 201);
      }
    }
  }

  // ── /opportunities ──────────────────────────────────────────────────────────
  if (resource === 'opportunities') {
    if (!idOrSub) {
      if (method === 'GET') {
        const pipelineId = url.searchParams.get('pipeline_id');
        const stageId = url.searchParams.get('stage_id');
        const status = url.searchParams.get('status') ?? 'open';

        let q = supabase
          .from('wire_opportunities')
          .select('*, contact:wire_contacts(*)')
          .eq('status', status)
          .order('created_at', { ascending: false });

        if (pipelineId) q = q.eq('pipeline_id', pipelineId);
        if (stageId) q = q.eq('stage_id', stageId);

        const { data, error: err } = await q;
        if (err) return error(err.message);
        return json({ data });
      }
      if (method === 'POST') {
        const body = await req.json();
        const { data, error: err } = await supabase
          .from('wire_opportunities')
          .insert(body)
          .select()
          .single();
        if (err) return error(err.message);
        return json(data, 201);
      }
    } else {
      const id = idOrSub;
      if (method === 'PATCH') {
        const body = await req.json();
        const { data, error: err } = await supabase
          .from('wire_opportunities')
          .update({ ...body, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        if (err) return error(err.message);
        return json(data);
      }
    }
  }

  // ── /appointments ───────────────────────────────────────────────────────────
  if (resource === 'appointments') {
    if (!idOrSub) {
      if (method === 'GET') {
        const status = url.searchParams.get('status');
        const from = url.searchParams.get('from');
        const to = url.searchParams.get('to');

        let q = supabase
          .from('wire_appointments')
          .select('*, contact:wire_contacts(*)')
          .order('start_time', { ascending: true });

        if (status) q = q.eq('status', status);
        if (from) q = q.gte('start_time', from);
        if (to) q = q.lte('start_time', to);

        const { data, error: err } = await q;
        if (err) return error(err.message);
        return json({ data });
      }
      if (method === 'POST') {
        const body = await req.json();
        const { data, error: err } = await supabase
          .from('wire_appointments')
          .insert(body)
          .select()
          .single();
        if (err) return error(err.message);
        return json(data, 201);
      }
    } else {
      const id = idOrSub;
      if (method === 'PATCH') {
        const body = await req.json();
        const { data, error: err } = await supabase
          .from('wire_appointments')
          .update(body)
          .eq('id', id)
          .select()
          .single();
        if (err) return error(err.message);
        return json(data);
      }
    }
  }

  // ── /automations ────────────────────────────────────────────────────────────
  if (resource === 'automations' && method === 'GET') {
    const { data, error: err } = await supabase
      .from('wire_automations')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) return error(err.message);
    return json({ data });
  }

  // ── /campaigns ──────────────────────────────────────────────────────────────
  if (resource === 'campaigns' && method === 'GET') {
    const { data, error: err } = await supabase
      .from('wire_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) return error(err.message);
    return json({ data });
  }

  return error('Not found', 404);
});
