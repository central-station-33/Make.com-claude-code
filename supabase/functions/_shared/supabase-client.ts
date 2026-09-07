import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

export function verifyMakeSecret(req: Request): void {
  const secret = Deno.env.get('MAKE_WEBHOOK_SECRET');
  if (!secret) return;
  const provided = req.headers.get('x-make-secret');
  if (provided !== secret) throw new Error('Unauthorized: invalid Make.com secret');
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
