import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { inrange } from '@/integrations/supabase/inrange';

export interface CurrentTeamAgent {
  id: string;
  full_name: string;
  role: 'agent' | 'broker';
  status: string;
}

/**
 * The signed-in user's own `team_agents` row (id + role), used to:
 * - self-assign a manually-created property lead (InRangeAddLead)
 * - decide whether to show broker-only controls (assignment, bulk enrich,
 *   team management) vs. an agent's own-leads-only view
 *
 * `userRole` from `useAuth()` already carries the role string; this adds
 * the `id` needed for `assigned_agent_id` comparisons/writes.
 */
export function useCurrentTeamAgent() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['current-team-agent', user?.id],
    queryFn: async (): Promise<CurrentTeamAgent | null> => {
      if (!user?.id) return null;
      const { data, error } = await inrange
        .from('team_agents')
        .select('id, full_name, role, status')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return (data as CurrentTeamAgent) ?? null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    teamAgent: query.data ?? null,
    isBroker: query.data?.role === 'broker',
    isLoading: query.isLoading,
  };
}
