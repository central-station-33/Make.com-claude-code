import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import { useCurrentTeamAgent } from '@/hooks/useCurrentTeamAgent';
import InviteAgentDialog from '@/components/agents/InviteAgentDialog';
import { ArrowLeft, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TeamAgentRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'agent' | 'broker';
  market: 'nyc' | 'nj' | 'both';
  brokerage: 'highline' | 'jet_realty';
  status: 'active' | 'inactive' | 'probation';
  ytd_volume: number | null;
}

const STATUS_COLORS: Record<TeamAgentRow['status'], string> = {
  active: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  probation: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  inactive: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

export default function InRangeTeam() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isBroker, isLoading: agentLoading } = useCurrentTeamAgent();
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ['team-agents-all'],
    queryFn: async (): Promise<TeamAgentRow[]> => {
      const { data, error } = await inrange
        .from('team_agents')
        .select('id, full_name, email, phone, role, market, brokerage, status, ytd_volume')
        .order('full_name');
      if (error) throw error;
      return (data as TeamAgentRow[]) ?? [];
    },
    enabled: isBroker,
    staleTime: 60 * 1000,
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TeamAgentRow['status'] }) => {
      const { error } = await inrange.from('team_agents').update({ status } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-agents-all'] }),
  });

  if (agentLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isBroker) {
    return (
      <div className="p-6 text-center min-h-screen flex flex-col items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
        <p className="text-sm text-gray-700 dark:text-gray-300">Team management is available to brokers/admins only.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-sm text-blue-600 dark:text-blue-400 font-medium">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 dark:text-gray-400 p-1 -ml-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1">Team</h1>
        <InviteAgentDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onInvited={() => queryClient.invalidateQueries({ queryKey: ['team-agents-all'] })}
        />
      </div>

      <div className="px-4 py-4">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">Could not load team</p>
          </div>
        )}

        <div className="space-y-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{agent.full_name}</p>
                  {agent.role === 'broker' && (
                    <span className="flex items-center gap-1 text-[10px] font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full px-2 py-0.5">
                      <ShieldCheck className="h-2.5 w-2.5" /> Broker/Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{agent.email}{agent.phone ? ` · ${agent.phone}` : ''}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {agent.market.toUpperCase()} · {agent.brokerage === 'jet_realty' ? 'Jet Realty Advisors' : 'Highline'}
                  {agent.ytd_volume ? ` · $${Number(agent.ytd_volume).toLocaleString()} YTD` : ''}
                </p>
              </div>

              <select
                value={agent.status}
                onChange={(e) => toggleStatus.mutate({ id: agent.id, status: e.target.value as TeamAgentRow['status'] })}
                disabled={toggleStatus.isPending}
                className={`text-xs font-medium rounded-full border px-3 py-1 cursor-pointer ${STATUS_COLORS[agent.status]}`}
              >
                <option value="active">Active</option>
                <option value="probation">Probation</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          ))}
        </div>

        {!isLoading && agents.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-16">No team members yet — invite one above.</p>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
