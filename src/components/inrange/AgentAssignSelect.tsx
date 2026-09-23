import { useQuery } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';

interface TeamAgentOption {
  id: string;
  full_name: string;
  role: 'agent' | 'broker';
  status: string;
}

interface AgentAssignSelectProps {
  value: string | null;
  onChange: (agentId: string | null) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Dropdown of active team_agents for assigning a property lead. Brokers see
 * every active agent/broker; the option list includes an explicit
 * "Unassigned" choice so a lead can be handed back to the open pool.
 *
 * Only meant to be rendered for brokers/admins — under RLS an agent's own
 * list view never contains a lead assigned to someone else, so there is
 * nothing for a non-broker to reassign.
 */
export default function AgentAssignSelect({ value, onChange, disabled, className }: AgentAssignSelectProps) {
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['team-agents-active'],
    queryFn: async (): Promise<TeamAgentOption[]> => {
      const { data, error } = await inrange
        .from('team_agents')
        .select('id, full_name, role, status')
        .eq('status', 'active')
        .order('full_name');
      if (error) throw error;
      return (data as TeamAgentOption[]) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <select
      value={value ?? ''}
      disabled={disabled || isLoading}
      onChange={(e) => onChange(e.target.value || null)}
      className={
        className ??
        'text-xs font-medium rounded-full border px-3 py-1 cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50'
      }
    >
      <option value="">Unassigned</option>
      {agents.map((a) => (
        <option key={a.id} value={a.id}>
          {a.full_name} {a.role === 'broker' ? '(broker)' : ''}
        </option>
      ))}
    </select>
  );
}
