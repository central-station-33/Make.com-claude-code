import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import { InRangeLeadSummary, PriorityTier, LeadStatus, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types/inrange';
import { Loader2, MapPin, AlertTriangle, Search, ChevronRight, User } from 'lucide-react';

type TierFilter = 'all' | PriorityTier;
type StatusFilter = 'all' | LeadStatus;

const TIER_COLORS: Record<PriorityTier, string> = {
  'Tier 1': 'bg-red-100 text-red-700',
  'Tier 2': 'bg-orange-100 text-orange-700',
  'Tier 3': 'bg-yellow-100 text-yellow-700',
  'Tier 4': 'bg-gray-100 text-gray-500',
};

const PROGRESS_STEPS: LeadStatus[] = ['new_lead', 'contacted', 'offer_sent', 'under_contract', 'closed'];

function ProgressDots({ status }: { status: LeadStatus | null }) {
  const current = status ?? 'new_lead';
  const idx = PROGRESS_STEPS.indexOf(current);
  const isDead = current === 'dead';
  return (
    <div className="flex items-center gap-1">
      {PROGRESS_STEPS.map((_, i) => (
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${
            isDead
              ? 'bg-gray-200 dark:bg-gray-700'
              : i <= idx
              ? i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-teal-500' : i === 2 ? 'bg-purple-500' : i === 3 ? 'bg-orange-500' : 'bg-green-500'
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        />
      ))}
    </div>
  );
}

function StatusBadge({
  status,
  leadId,
  onUpdate,
}: {
  status: LeadStatus | null;
  leadId: string;
  onUpdate: (id: string, status: LeadStatus) => void;
}) {
  const current = status ?? 'new_lead';
  const colors = LEAD_STATUS_COLORS[current];
  return (
    <select
      value={current}
      onChange={(e) => {
        e.stopPropagation();
        onUpdate(leadId, e.target.value as LeadStatus);
      }}
      onClick={(e) => e.stopPropagation()}
      className={`text-xs font-medium rounded-full border px-2 py-0.5 cursor-pointer appearance-none ${colors} dark:bg-opacity-20`}
    >
      {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
        <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
      ))}
    </select>
  );
}

type ExtendedLead = InRangeLeadSummary & { status?: LeadStatus | null; last_contacted_at?: string | null };

export default function InRangeLeads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const { data: leads = [], isLoading, error, refetch } = useQuery({
    queryKey: ['inrange-leads', tierFilter],
    queryFn: async () => {
      let q = inrange
        .from('properties')
        .select('id,address,city,state,zip,priority_tier,composite_score,deal_type,owner_name,owner_type,owner_state,distress_indicators,enrichment_status,ai_enriched_at,status,last_contacted_at,tags')
        .order('composite_score', { ascending: false })
        .limit(200);

      if (tierFilter !== 'all') q = q.eq('priority_tier', tierFilter);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ExtendedLead[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await inrange
        .from('properties')
        .update({ status, last_contacted_at: status === 'contacted' ? new Date().toISOString() : undefined } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['inrange-leads', tierFilter] });
      const prev = queryClient.getQueryData<ExtendedLead[]>(['inrange-leads', tierFilter]);
      queryClient.setQueryData<ExtendedLead[]>(['inrange-leads', tierFilter], (old) =>
        old?.map((l) => l.id === id ? { ...l, status } : l) ?? []
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['inrange-leads', tierFilter], ctx.prev);
    },
  });

  const filtered = leads.filter((l) => {
    const matchesTier = tierFilter === 'all' || l.priority_tier === tierFilter;
    const matchesStatus = statusFilter === 'all' || (l.status ?? 'new_lead') === statusFilter;
    const matchesSearch = !search ||
      l.address.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase()) ||
      (l.owner_name ?? '').toLowerCase().includes(search.toLowerCase());
    return matchesTier && matchesStatus && matchesSearch;
  });

  const TIER_TABS: { label: string; value: TierFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Tier 1', value: 'Tier 1' },
    { label: 'Tier 2', value: 'Tier 2' },
    { label: 'Tier 3', value: 'Tier 3' },
  ];

  const STATUS_TABS: { label: string; value: StatusFilter }[] = [
    { label: 'All Status', value: 'all' },
    { label: 'New', value: 'new_lead' },
    { label: 'Contacted', value: 'contacted' },
    { label: 'Offer Sent', value: 'offer_sent' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                InRange Leads
                <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length} results)</span>
              </h1>
            </div>
            <button onClick={() => refetch()} className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Refresh
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search address, city, owner…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent rounded-lg focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          {/* Tier filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TIER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTierFilter(tab.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  tierFilter === tab.value
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1" />
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">Could not load leads</p>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No leads match your filters</p>
          </div>
        )}

        {/* Lead rows */}
        <div className="space-y-2">
          {filtered.map((lead) => {
            const status = lead.status ?? 'new_lead';
            const lastActivity = lead.last_contacted_at ?? lead.ai_enriched_at;
            const lastActivityDate = lastActivity
              ? new Date(lastActivity).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })
              : null;

            return (
              <div
                key={lead.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
              >
                {/* Main row — clickable */}
                <button
                  onClick={() => navigate(`/inrange/${lead.id}`)}
                  className="w-full text-left px-4 pt-3 pb-2"
                >
                  <div className="flex items-start gap-3">
                    {/* Score ring */}
                    <div className={`flex-shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                      lead.composite_score >= 80 ? 'border-red-500 text-red-600 dark:text-red-400' :
                      lead.composite_score >= 60 ? 'border-orange-500 text-orange-600 dark:text-orange-400' :
                      lead.composite_score >= 40 ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' :
                      'border-gray-300 text-gray-500'
                    }`}>
                      {lead.composite_score}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Address + tier */}
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
                          {lead.address}
                        </p>
                        <span className={`flex-shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${TIER_COLORS[lead.priority_tier]}`}>
                          {lead.priority_tier}
                        </span>
                      </div>

                      {/* City/state */}
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-1.5">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span>{lead.city}, {lead.state} {lead.zip}</span>
                        {lead.deal_type && <span className="text-blue-600 dark:text-blue-400 ml-1">· {lead.deal_type}</span>}
                      </div>

                      {/* Owner */}
                      {lead.owner_name && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[160px]">{lead.owner_name}</span>
                          {lead.owner_type === 'llc' && <span className="text-purple-600 dark:text-purple-400 font-medium">· LLC</span>}
                          {lead.owner_state && lead.owner_state !== lead.state && (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">· Out-of-state</span>
                          )}
                        </div>
                      )}
                    </div>

                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </button>

                {/* Bottom bar — progress + status + tags + timestamp */}
                <div className="px-4 pb-3 border-t border-gray-50 dark:border-gray-800 pt-2 flex items-center gap-3 flex-wrap">
                  <ProgressDots status={status} />

                  <StatusBadge
                    status={status}
                    leadId={lead.id}
                    onUpdate={(id, s) => updateStatus.mutate({ id, status: s })}
                  />

                  {lead.distress_indicators && lead.distress_indicators.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {lead.distress_indicators.slice(0, 2).map((ind) => (
                        <span key={ind} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded px-1.5 py-0.5">
                          {ind.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {lead.distress_indicators.length > 2 && (
                        <span className="text-[10px] text-gray-400">+{lead.distress_indicators.length - 2}</span>
                      )}
                    </div>
                  )}

                  {lastActivityDate && (
                    <span className="text-[10px] text-gray-400 ml-auto">{lastActivityDate}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
