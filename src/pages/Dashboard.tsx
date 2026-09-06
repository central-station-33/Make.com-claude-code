import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { inrange } from '@/integrations/supabase/inrange';
import { Loader2, MapPin, ChevronRight, AlertTriangle, TrendingUp, Building2, Clock } from 'lucide-react';

type TierCount = { tier: string; count: number };

const TIER_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'Tier 1': { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  'Tier 2': { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  'Tier 3': { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  'Tier 4': { bg: 'bg-gray-50 dark:bg-gray-900', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await inrange
        .from('properties')
        .select('priority_tier, enrichment_status, composite_score');
      if (error) throw error;

      const rows = data ?? [];
      const total = rows.length;
      const enriched = rows.filter((r) => r.enrichment_status === 'complete').length;
      const pending = rows.filter((r) => r.enrichment_status === 'pending').length;

      const tierMap: Record<string, number> = {};
      for (const r of rows) {
        if (r.priority_tier) tierMap[r.priority_tier] = (tierMap[r.priority_tier] ?? 0) + 1;
      }
      const tiers: TierCount[] = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4']
        .map((t) => ({ tier: t, count: tierMap[t] ?? 0 }));

      return { total, enriched, pending, tiers };
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">InRange Pipeline</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Property distress dashboard</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {!isLoading && stats && (
          <>
            {/* Summary stat tiles */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 text-center">
                <Building2 className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 text-center">
                <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.enriched}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Enriched</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 text-center">
                <Clock className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
              </div>
            </div>

            {/* Tier breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">By Priority Tier</h2>
              <div className="space-y-2">
                {stats.tiers.map(({ tier, count }) => {
                  const s = TIER_STYLES[tier];
                  return (
                    <div key={tier} className={`flex items-center justify-between rounded-lg px-3 py-2 ${s.bg}`}>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                        <span className={`text-sm font-medium ${s.text}`}>{tier}</span>
                      </div>
                      <span className={`text-sm font-bold ${s.text}`}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

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
