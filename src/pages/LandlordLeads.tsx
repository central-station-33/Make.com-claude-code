import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import {
  LandlordLeadSummary, LandlordPipelineStage, LANDLORD_STAGE_LABELS, LANDLORD_STAGE_COLORS,
} from '@/types/leasing';
import { Loader2, Building2, AlertTriangle, Search, ChevronRight, Calendar, DollarSign, ArrowLeft } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { withBrand } from '@/lib/brandFilter';

type StageFilter = 'all' | LandlordPipelineStage;

const STAGE_FILTERS: { label: string; value: StageFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new_lead' },
  { label: 'Consultation', value: 'consultation_scheduled' },
  { label: 'Agreement', value: 'listing_agreement_sent' },
  { label: 'Active Listing', value: 'active_listing' },
  { label: 'Placed', value: 'tenant_placed' },
  { label: 'Lost', value: 'lost' },
];

const fmt$ = (v: number | null | undefined) => (v != null ? `$${v.toLocaleString()}` : '—');

function StageBadge({
  stage, isaLeadId, onUpdate,
}: { stage: LandlordPipelineStage; isaLeadId: string; onUpdate: (id: string, stage: LandlordPipelineStage) => void }) {
  return (
    <select
      value={stage}
      onChange={(e) => { e.stopPropagation(); onUpdate(isaLeadId, e.target.value as LandlordPipelineStage); }}
      onClick={(e) => e.stopPropagation()}
      className={`text-xs font-medium rounded-full border px-2 py-0.5 cursor-pointer appearance-none ${LANDLORD_STAGE_COLORS[stage]} dark:bg-opacity-20`}
    >
      {(Object.keys(LANDLORD_STAGE_LABELS) as LandlordPipelineStage[]).map((s) => (
        <option key={s} value={s}>{LANDLORD_STAGE_LABELS[s]}</option>
      ))}
    </select>
  );
}

export default function LandlordLeads() {
  const { activeBrandId } = useBrand();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const stageParam = searchParams.get('stage') as StageFilter | null;
  const [stageFilter, setStageFilterState] = useState<StageFilter>(stageParam ?? 'all');
  const [search, setSearch] = useState('');

  const setStageFilter = (stage: StageFilter) => {
    setStageFilterState(stage);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (stage === 'all') next.delete('stage'); else next.set('stage', stage);
      return next;
    }, { replace: true });
  };

  const { data: leads = [], isLoading, error, refetch } = useQuery({
    queryKey: ['landlord-leads', activeBrandId],
    queryFn: async () => {
      const { data, error } = await withBrand(inrange
        .from('landlord_leasing_pipeline')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200), activeBrandId);
      if (error) throw error;
      return (data ?? []) as unknown as LandlordLeadSummary[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const updateStage = useMutation({
    mutationFn: async ({ isaLeadId, stage }: { isaLeadId: string; stage: LandlordPipelineStage }) => {
      const { error } = await inrange
        .from('landlord_leads')
        .update({ pipeline_stage: stage } as never)
        .eq('isa_lead_id', isaLeadId);
      if (error) throw error;
    },
    onMutate: async ({ isaLeadId, stage }) => {
      const key = ['landlord-leads', activeBrandId];
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<LandlordLeadSummary[]>(key);
      queryClient.setQueryData<LandlordLeadSummary[]>(key, (old) =>
        old?.map((l) => l.isa_lead_id === isaLeadId ? { ...l, pipeline_stage: stage } : l) ?? []
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['landlord-leads', activeBrandId], ctx.prev);
    },
  });

  const filtered = leads.filter((l) => {
    const matchesStage = stageFilter === 'all' || l.pipeline_stage === stageFilter;
    const matchesSearch = !search ||
      (l.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.property_address ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (l.email ?? '').toLowerCase().includes(search.toLowerCase());
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
                Landlord Leads
                <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length} results)</span>
              </h1>
            </div>
            <button onClick={() => refetch()} className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Refresh
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, address, email…"
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
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">Could not load landlord leads</p>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {leads.length === 0 ? 'No landlord leads yet' : 'No leads match your filters'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((lead) => {
            const vacancyDate = lead.vacancy_date
              ? new Date(lead.vacancy_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : null;

            return (
              <div
                key={lead.isa_lead_id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
              >
                <button
                  onClick={() => navigate(`/leasing/landlords/${lead.isa_lead_id}`)}
                  className="w-full text-left px-4 pt-3 pb-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-11 h-11 rounded-full bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate mb-0.5">
                        {lead.full_name ?? 'Unnamed Lead'}
                      </p>

                      {lead.property_address && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1.5">{lead.property_address}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span className="uppercase font-medium">{lead.market}</span>
                        {vacancyDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Vacant {vacancyDate}
                          </span>
                        )}
                        {lead.expected_rent != null && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> {fmt$(lead.expected_rent)}/mo
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </button>

                <div className="px-4 pb-3 border-t border-gray-50 dark:border-gray-800 pt-2 flex items-center gap-3 flex-wrap">
                  <StageBadge
                    stage={lead.pipeline_stage}
                    isaLeadId={lead.isa_lead_id}
                    onUpdate={(id, stage) => updateStage.mutate({ isaLeadId: id, stage })}
                  />
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
    </div>
  );
}
