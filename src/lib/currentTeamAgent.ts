import { supabase } from '@/integrations/supabase/client';

/**
 * Resolve the signed-in user to their team_agents profile id.
 *
 * Uses the database resolver `current_team_agent_id()`, which accepts the
 * primary login (team_agents.auth_user_id) OR an active backup login
 * (team_agent_logins). Never look agents up by `auth_user_id` directly in the
 * app, or backup logins will look like strangers.
 */
export async function fetchCurrentTeamAgentId(): Promise<string | null> {
  // The RPC isn't in the generated types (they're stale), so cast.
  const { data, error } = await (supabase as unknown as {
    rpc: (fn: string) => Promise<{ data: unknown; error: { message: string } | null }>;
  }).rpc('current_team_agent_id');
  if (error) throw new Error(error.message);
  return (data as string | null) ?? null;
}

/** Role of the signed-in user's team agent profile ('broker' | 'agent'), or null. */
export async function fetchCurrentTeamAgentRole(): Promise<string | null> {
  const id = await fetchCurrentTeamAgentId();
  if (!id) return null;
  const { data, error } = await supabase
    .from('team_agents' as never)
    .select('role')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { role?: string }).role ?? null;
}

/**
 * Turn a supabase.functions.invoke error into the function's own message.
 * On non-2xx, supabase-js only says "Edge Function returned a non-2xx status
 * code"; the real `{ error }` JSON is on `error.context` (a Response).
 */
export async function functionErrorMessage(error: unknown, fallback = 'Something went wrong'): Promise<string> {
  const ctx = (error as { context?: unknown })?.context;
  if (ctx && typeof (ctx as Response).clone === 'function') {
    try {
      const body = await (ctx as Response).clone().json();
      const raw = String(body?.error ?? body?.message ?? '');
      if (raw) return friendlyEmailError(raw);
    } catch { /* not JSON */ }
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

function friendlyEmailError(raw: string): string {
  if (/domain is not verified/i.test(raw)) {
    return 'Email could not be sent: the sending domain is not verified in Resend yet. Verify it at resend.com/domains, then try again.';
  }
  if (/rate limit/i.test(raw)) return 'Too many emails sent in the last hour. Please try again later.';
  return raw;
}
