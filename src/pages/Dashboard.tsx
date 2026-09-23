import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { inrange } from '@/integrations/supabase/inrange';
import { useCurrentTeamAgent } from '@/hooks/useCurrentTeamAgent';
import { Loader2, MapPin, ChevronRight, AlertTriangle, TrendingUp, Building2, Clock, Sparkles } from 'lucide-react';

type TierCount = { tier: string; count: number };
type StateCount = { state: string; count: number };

const TIER_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'Tier 1': { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  'Tier 2': { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  'Tier 3': { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  'Tier 4': { bg: 'bg-gray-50 dark:bg-gray-900', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
};

// NY and NJ are structurally very different pipelines right now (free-source
// mix, MLS comps coverage, owner mix) -- a single combined count obscures
// that, so the dashboard breaks it out explicitly rather than lumping every
// property into one number.
const STATE_LABELS: Record<string, string> = { NY: 'New York', NJ: 'New Jersey' };
const STATE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  NY: { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  NJ: { bg: 'bg-teal-50 dark:bg-teal-950', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
};

type BulkEnrichResult = { success: boolean; enriched?: number; failed?: number; skipped_reason?: string; error?: string };

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isBroker } = useCurrentTeamAgent();
  const [enrichMsg, setEnrichMsg] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await inrange
        .from('properties')
        .select('priority_tier, enrichment_status, composite_score, state');
      if (error) throw error;

      const rows = data ?? [];
      const total = rows.length;
      const enriched = rows.filter((r) => r.enrichment_status === 'complete').length;
      const pending = rows.filter((r) => r.enrichment_status === 'pending').length;

      const tierMap: Record<string, number> = {};
      const stateMap: Record<string, number> = {};
      for (const r of rows) {
        if (r.priority_tier) tierMap[r.priority_tier] = (tierMap[r.priority_tier] ?? 0) + 1;
        const st = (r.state ?? '').trim().toUpperCase();
        if (st) stateMap[st] = (stateMap[st] ?? 0) + 1;
      }
      const tiers: TierCount[] = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4']
        .map((t) => ({ tier: t, count: tierMap[t] ?? 0 }));

      // NY/NJ first and always shown (even at 0), since those are this
      // pipeline's two target markets; anything else found is appended so a
      // stray/bad state value is visible rather than silently dropped.
      const knownStates = ['NY', 'NJ'];
      const states: StateCount[] = [
        ...knownStates.map((s) => ({ state: s, count: stateMap[s] ?? 0 })),
        ...Object.entries(stateMap)
          .filter(([s]) => !knownStates.includes(s))
          .map(([state, count]) => ({ state, count })),
      ];

      return { total, enriched, pending, tiers, states };
    },
    staleTime: 2 * 60 * 1000,
  });

  const { data: tier1Leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['dashboard-tier1'],
    queryFn: async () => {
      const { data, error } = await inrange
        .from('properties')
        .select('id, address, city, state, composite_score, deal_type, distress_indicators')
        .eq('priority_tier', 'Tier 1')
        .eq('enrichment_status', 'complete')
        .order('composite_score', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = statsLoading || leadsLoading;

  const bulkEnrich = useMutation({
    mutationFn: async () => {
      setEnrichMsg(null);
      const { data, error } = await inrange.functions.invoke('enrich-properties-batch', { body: { limit: 10 } });
      if (error) throw error;
      return data as BulkEnrichResult;
    },
    onSuccess: (data) => {
      if (data.skipped_reason === 'budget_paused') setEnrichMsg('AI budget for this month is paused — no properties enriched.');
      else if (data.skipped_reason === 'none_pending') setEnrichMsg('No pending properties to enrich.');
      else setEnrichMsg(`Enriched ${data.enriched ?? 0} propert${(data.enriched ?? 0) === 1 ? 'y' : 'ies'}${data.failed ? `, ${data.failed} failed` : ''}.`);
    },
    onError: (err: any) => setEnrichMsg(err?.message ?? 'Bulk enrichment failed.'),
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">InRange Pipeline</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Property distress dashboard</p>
        </div>
        {isBroker && (
          <button
            onClick={() => bulkEnrich.mutate()}
            disabled={bulkEnrich.isPending}
            className="flex items-center gap-1 text-xs font-medium bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-full px-3 py-1.5 disabled:opacity-50"
          >
            {bulkEnrich.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Enrich pending
          </button>
        )}
      </div>
      {enrichMsg && (
        <p className="text-xs text-gray-500 dark:text-gray-400 px-4 pt-2">{enrichMsg}</p>
      )}

      <div className="px-4 py-4 space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {!isLoading && stats && (
          <>
            {/* Summary stat tiles -- all lead into the full (unfiltered) leads
                list, since InRangeLeads has no separate enrichment-status
                filter to point Enriched/Pending at. */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => navigate('/inrange/leads')}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 text-center active:bg-gray-50 dark:active:bg-gray-800"
              >
                <Building2 className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              </button>
              <button
                onClick={() => navigate('/inrange/leads')}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 text-center active:bg-gray-50 dark:active:bg-gray-800"
              >
                <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.enriched}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Enriched</p>
              </button>
              <button
                onClick={() => navigate('/inrange/leads')}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 text-center active:bg-gray-50 dark:active:bg-gray-800"
              >
                <Clock className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
              </button>
            </div>

            {/* State breakdown -- NY and NJ are structurally different
                pipelines right now (see STATE_LABELS comment); each row
                drills into that state's leads */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">By State</h2>
              <div className="space-y-2">
                {stats.states.map(({ state, count }) => {
                  const s = STATE_STYLES[state] ?? TIER_STYLES['Tier 4'];
                  return (
                    <button
                      key={state}
                      onClick={() => navigate(`/inrange/leads?state=${encodeURIComponent(state)}`)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 ${s.bg} active:opacity-70`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                        <span className={`text-sm font-medium ${s.text}`}>{STATE_LABELS[state] ?? state}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-bold ${s.text}`}>{count}</span>
                        <ChevronRight className={`h-3.5 w-3.5 ${s.text}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tier breakdown -- each row drills into that tier's leads */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">By Priority Tier</h2>
              <div className="space-y-2">
                {stats.tiers.map(({ tier, count }) => {
                  const s = TIER_STYLES[tier];
                  return (
                    <button
                      key={tier}
                      onClick={() => navigate(`/inrange/leads?tier=${encodeURIComponent(tier)}`)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 ${s.bg} active:opacity-70`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                        <span className={`text-sm font-medium ${s.text}`}>{tier}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-bold ${s.text}`}>{count}</span>
                        <ChevronRight className={`h-3.5 w-3.5 ${s.text}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Always-present way out -- the "Top Tier 1 Leads" block below is
                the only other nav on this page and only renders once leads
                exist there, which left the page a dead end whenever it didn't. */}
            <button
              onClick={() => navigate('/inrange')}
              className="w-full text-center text-sm font-medium text-blue-600 dark:text-blue-400 py-2"
            >
              Go to InRange hub →
            </button>

            {/* Top Tier 1 leads */}
            {tier1Leads.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Top Tier 1 Leads</h2>
                  <button
                    onClick={() => navigate('/inrange/leads')}
                    className="text-xs text-blue-600 dark:text-blue-400 font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-2">
                  {tier1Leads.map((lead: any) => (
                    <button
                      key={lead.id}
                      onClick={() => navigate(`/inrange/${lead.id}`)}
                      className="w-full text-left flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-red-500 flex items-center justify-center text-xs font-bold text-red-600 dark:text-red-400">
                        {lead.composite_score}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{lead.address}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <MapPin className="h-3 w-3" />
                          <span>{lead.city}, {lead.state}</span>
                          {lead.deal_type && <span className="ml-1 text-blue-600 dark:text-blue-400">· {lead.deal_type}</span>}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {stats.total === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No properties in pipeline yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Turn on Make.com scenarios to start ingesting data</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
