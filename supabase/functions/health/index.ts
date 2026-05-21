import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ok, err, handleOptions } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();

  const start = Date.now();
  const checks: Record<string, unknown> = {};

  // DB check
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { count, error } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });
    checks.database = error
      ? { status: 'error', message: error.message }
      : { status: 'ok', property_count: count ?? 0 };
  } catch (e) {
    checks.database = { status: 'error', message: (e as Error).message };
  }

  // Claude API check
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  checks.claude_api = anthropicKey
    ? { status: 'ok', key_present: true }
    : { status: 'warning', message: 'ANTHROPIC_API_KEY not set' };

  const allOk = Object.values(checks).every(
    (c) => (c as Record<string, string>).status === 'ok'
  );

  const payload = {
    status: allOk ? 'healthy' : 'degraded',
    checks,
    latency_ms: Date.now() - start,
    version: '1.0.0',
  };

  if (!allOk) {
    return new Response(JSON.stringify({ success: true, message: 'Degraded', data: payload, timestamp: new Date().toISOString() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  return ok(payload, 'Healthy');
});
