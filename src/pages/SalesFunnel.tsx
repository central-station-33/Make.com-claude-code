import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import {
  SalesLead, SalesSegment, SalesStage, LeadRole,
  SALES_STAGE_ORDER, SALES_STAGE_LABELS, SALES_STAGE_COLORS,
} from '@/types/salesPipeline';
import { Loader2, Users, Building2, AlertTriangle, Search, TrendingUp, ArrowLeft, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SMSMessaging } from '@/components/messaging/SMSMessaging';
import { useBrand } from '@/contexts/BrandContext';
import { withBrand } from '@/lib/brandFilter';

type StageFilter = 'all' | SalesStage;

const SEGMENT_TABS: { label: string; value: SalesSegment; icon: typeof Users }[] = [
  { label: 'Residential', value: 'homeowner', icon: Users },
  { label: 'Investor', value: 'investor', icon: Building2 },
];

const STAGE_FILTERS: { label: string; value: StageFilter }[] = [
  { label: 'All', value: 'all' },
  ...SALES_STAGE_ORDER.map((s) => ({ label: SALES_STAGE_LABELS[s], value: s as StageFilter })),
];

const ROLE_COLORS: Record<LeadRole, string> = {
  buyer: 'bg-blue-100 text-blue-700',
  seller: 'bg-orange-100 text-orange-700',
};

function StageBadge({
  stage, leadId, onUpdate,
}: { stage: SalesStage; leadId: string; onUpdate: (id: string, stage: SalesStage) => void }) {
  return (
    <select
      value={stage}
      onChange={(e) => { e.stopPropagation(); onUpdate(leadId, e.target.value as SalesStage); }}
      onClick={(e) => e.stopPropagation()}
      className={`text-xs font-medium rounded-full border px-2 py-0.5 cursor-pointer appearance-none ${SALES_STAGE_COLORS[stage]} dark:bg-opacity-20`}
    >
      {SALES_STAGE_ORDER.map((s) => (
        <option key={s} value={s}>{SALES_STAGE_LABELS[s]}</option>
      ))}
    </select>
  );
}

export default function SalesFunnel() {
  const { activeBrandId } = useBrand();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const segmentParam = searchParams.get('segment') as SalesSegment | null;
  const [segment, setSegmentState] = useState<SalesSegment>(segmentParam ?? 'homeowner');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [search, setSearch] = useState('');
  const [smsLeadId, setSmsLeadId] = useState<string | null>(null);
  const [smsLeadName, setSmsLeadName] = useState<string | null>(null);

  const setSegment = (next: SalesSegment) => {
    setSegmentState(next);
    setStageFilter('all');
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('segment', next);
      return params;
    }, { replace: true });
  };

  const residential = useQuery({
    queryKey: ['sales-leads', 'residential', activeBrandId],
    queryFn: async () => {
      const { data, error } = await withBrand(inrange
        .from('residential_sale_pipeline')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300), activeBrandId);
      if (error) throw error;
      return (data ?? []) as unknown as SalesLead[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const investor = useQuery({
    queryKey: ['sales-leads', 'investor', activeBrandId],
    queryFn: async () => {
      const { data, error } = await withBrand(inrange
        .from('distressed_investor_pipeline')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300), activeBrandId);
      if (error) throw error;
      return (data ?? []) as unknown as SalesLead[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = residential.isLoading || investor.isLoading;
  const error = residential.error || investor.error;
  const refetch = () => { residential.refetch(); investor.refetch(); };

  const updateStage = useMutation({
    mutationFn: async ({ leadId, stage }: { leadId: string; stage: SalesStage }) => {
      const { error } = await inrange
        .from('isa_leads')
        .update({ outreach_status: stage } as never)
        .eq('id', leadId);
      if (error) throw error;
    },
    onMutate: async ({ leadId, stage }) => {
      const key = ['sales-leads', segment === 'homeowner' ? 'residential' : 'investor', activeBrandId];
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<SalesLead[]>(key);
      queryClient.setQueryData<SalesLead[]>(key, (old) =>
        old?.map((l) => (l.isa_lead_id === leadId ? { ...l, outreach_status: stage } : l)) ?? []
      );
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(ctx.key, ctx.prev);
    },
  });

  const segmentLeads = segment === 'homeowner' ? (residential.data ?? []) : (investor.data ?? []);

  const stageCounts = SALES_STAGE_ORDER.reduce<Record<SalesStage, number>>((acc, s) => {
    acc[s] = segmentLeads.filter((l) => (l.outreach_status ?? 'new') === s).length;
    return acc;
  }, {} as Record<SalesStage, number>);

  const filtered = segmentLeads.filter((l) => {
    const stage = l.outreach_status ?? 'new';
    const matchesStage = stageFilter === 'all' || stage === stageFilter;
    const matchesSearch = !search ||
      (l.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.phone ?? '').includes(search);
    return matchesStage && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/dashboard')} className="text-gray-500 dark:text-gray-400 p-1 -ml-1">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Sales Funnel
                <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length} results)</span>
              </h1>
            </div>
            <button onClick={refetch} className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Refresh
            </button>
          </div>

          {/* Segment split -- the two ranked, non-leasing ISA segments
              (CLAUDE.md: homeowner = regular single/multi-family residential,
              ranked above investor). Separate views/tabs rather than one
              combined list since they're genuinely different pipelines. */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {SEGMENT_TABS.map((tab) => {
              const Icon = tab.icon;
              const count = (tab.value === 'homeowner' ? residential.data : investor.data)?.length ?? 0;
              return (
                <button
                  key={tab.value}
                  onClick={() => setSegment(tab.value)}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    segment === tab.value
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <span className="text-xs opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent rounded-lg focus:outline-none focus:border-gray-300 dark:focus:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {STAGE_FILTERS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStageFilter(tab.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  stageFilter === tab.value
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab.label}
                {tab.value !== 'all' && (
                  <span className="ml-1 opacity-60">{stageCounts[tab.value as SalesStage]}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">Could not load sales leads</p>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            {segment === 'homeowner' ? (
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            ) : (
              <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            )}
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {segmentLeads.length === 0
                ? `No ${segment === 'homeowner' ? 'residential' : 'investor'} leads yet`
                : 'No leads match your filters'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((lead) => {
            const stage = lead.outreach_status ?? 'new';

            return (
              <div
                key={lead.isa_lead_id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm px-4 pt-3 pb-2"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${
                    segment === 'homeowner' ? 'bg-blue-50 dark:bg-blue-950' : 'bg-purple-50 dark:bg-purple-950'
                  }`}>
                    {segment === 'homeowner' ? (
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
                        {lead.full_name ?? 'Unnamed Lead'}
                      </p>
                      {lead.lead_role && (
                        <span className={`flex-shrink-0 text-[10px] font-semibold uppercase rounded-full px-1.5 py-0.5 ${ROLE_COLORS[lead.lead_role]}`}>
                          {lead.lead_role}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-1.5 flex-wrap">
                      {lead.market && <span className="uppercase font-medium">{lead.market}</span>}
                      {lead.motivation_score != null && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> Motivation {lead.motivation_score}
                        </span>
                      )}
                      {lead.bant_score != null && <span>BANT {lead.bant_score}</span>}
                    </div>

                    {(lead.email || lead.phone) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {lead.email}{lead.email && lead.phone ? ' · ' : ''}{lead.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-gray-50 dark:border-gray-800 flex items-center gap-3 flex-wrap">
                  <StageBadge
                    stage={stage}
                    leadId={lead.isa_lead_id}
                    onUpdate={(id, s) => updateStage.mutate({ leadId: id, stage: s })}
                  />
                  {lead.phone && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSmsLeadId(lead.isa_lead_id);
                        setSmsLeadName(lead.full_name ?? null);
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700"
                    >
                      <MessageSquare className="h-3 w-3" />
                      SMS
                    </button>
                  )}
                  <span className="text-[10px] text-gray-400 ml-auto">
                    {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-8" />
      </div>

      <Dialog open={!!smsLeadId} onOpenChange={(open) => { if (!open) { setSmsLeadId(null); setSmsLeadName(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{smsLeadName ?? 'Lead'}</DialogTitle>
          </DialogHeader>
          {smsLeadId && <SMSMessaging leadId={smsLeadId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
