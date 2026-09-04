import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import { InRangeLeadSummary, PriorityTier } from '@/types/inrange';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronRight, MapPin, User, AlertTriangle } from 'lucide-react';

type TierFilter = 'all' | PriorityTier;

const TIER_COLORS: Record<PriorityTier, { bg: string; text: string; border: string }> = {
  'Tier 1': { bg: 'bg-red-50 dark:bg-red-950',   text: 'text-red-700 dark:text-red-300',   border: 'border-red-200 dark:border-red-800' },
  'Tier 2': { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  'Tier 3': { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
  'Tier 4': { bg: 'bg-gray-50 dark:bg-gray-900',    text: 'text-gray-600 dark:text-gray-400',    border: 'border-gray-200 dark:border-gray-700' },
};

const TierBadge = ({ tier }: { tier: PriorityTier }) => {
  const c = TIER_COLORS[tier];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text} border ${c.border}`}>
      {tier}
    </span>
  );
};

const ScoreRing = ({ score }: { score: number }) => {
  const color = score >= 80 ? 'text-red-600' : score >= 60 ? 'text-orange-500' : score >= 40 ? 'text-yellow-500' : 'text-gray-400';
  return (
    <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm ${color} border-current`}>
      {score}
    </div>
  );
};

const FILTER_TABS: { label: string; value: TierFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Tier 1', value: 'Tier 1' },
  { label: 'Tier 2', value: 'Tier 2' },
];

export default function InRangeLeads() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TierFilter>('all');

  const { data: leads = [], isLoading, error, refetch } = useQuery({
    queryKey: ['inrange-leads', filter],
    queryFn: async () => {
      let q = inrange
        .from('properties')
        .select('id,address,city,state,zip,priority_tier,composite_score,deal_type,owner_name,owner_type,owner_state,distress_indicators,enrichment_status,ai_enriched_at')
        .eq('enrichment_status', 'complete')
        .order('composite_score', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        q = q.eq('priority_tier', filter);
      }

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as InRangeLeadSummary[];
    },
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">InRange Leads</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isLoading ? 'Loading…' : `${leads.length} enriched leads`}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="text-xs text-blue-600 dark:text-blue-400 font-medium"
          >
            Refresh
          </button>
        </div>

        {/* Tier filter tabs */}
        <div className="flex gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">Could not load leads</p>
            <p className="text-xs text-red-500 mt-1">Check that VITE_INRANGE_URL and VITE_INRANGE_KEY are set in Vercel</p>
          </div>
        )}

        {!isLoading && !error && leads.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No enriched leads yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Run the InRange pipeline to generate leads</p>
          </div>
        )}

        {leads.map((lead) => (
          <button
            key={lead.id}
            onClick={() => navigate(`/inrange/${lead.id}`)}
            className="w-full text-left bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm active:scale-[0.99] transition-transform"
          >
            <div className="flex items-start gap-3">
              <ScoreRing score={lead.composite_score} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
                    {lead.address}
                  </p>
                  <TierBadge tier={lead.priority_tier} />
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span>{lead.city}, {lead.state} {lead.zip}</span>
                </div>

                {lead.deal_type && (
                  <span className="inline-block text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900 rounded px-2 py-0.5 mb-2">
                    {lead.deal_type}
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">{lead.owner_name || 'Unknown owner'}</span>
                    {lead.owner_type === 'llc' && (
                      <span className="text-purple-600 dark:text-purple-400 font-medium">· LLC</span>
                    )}
                    {lead.owner_state && lead.owner_state !== lead.state && (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">· Out-of-state</span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>

                {lead.distress_indicators && lead.distress_indicators.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {lead.distress_indicators.slice(0, 3).map((ind) => (
                      <span
                        key={ind}
                        className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded px-1.5 py-0.5"
                      >
                        {ind.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {lead.distress_indicators.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{lead.distress_indicators.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom padding for mobile nav thumb zone */}
      <div className="h-8" />
    </div>
  );
}
