import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import { Loader2, AlertTriangle, ArrowLeft, Building, Search, Calendar, DollarSign, Star, Lock } from 'lucide-react';

// Exclusive Leasing module (Module 4). Everything on this page is scoped to
// one exclusive property and is protected by RLS: only brokers and agents on
// the property's team (exclusive_property_agents) can read these rows.

type ExclusiveProperty = {
  id: string; slug: string; name: string; display_brand: string; address: string;
  alt_address: string | null; neighborhood: string | null; exclusive_holder: string | null;
  jra_role: string | null; min_advertised_rent: number | null; parking_asking_rent: number | null;
  jra_offer: string | null; status: string;
};

type ExclusiveUnit = {
  id: string; unit_number: string; floor: number | null; bedrooms: number | null; bathrooms: number | null;
  square_footage: number | null; outdoor_sf: number | null; roof_private_sf: number | null;
  orientation: string | null; monthly_rent: number | null; listing_status: string;
  owner_advertised: boolean; staged: boolean; marketing_priority: 'A' | 'B' | 'C' | null;
  pricing_review_note: string | null;
};

type ExclusiveLead = {
  isa_lead_id: string; full_name: string | null; email: string | null; phone: string | null;
  outreach_status: string | null; sms_consent: boolean | null; lead_created_at: string;
  pipeline_stage: string | null; move_date: string | null; max_rent: number | null;
  min_bedrooms: number | null; ai_escalation_needed: boolean | null;
};

type Tab = 'leads' | 'units' | 'summary';
type BedFilter = 'all' | '0' | '1' | '2' | '3';
type PriorityFilter = 'all' | 'focus' | 'A' | 'B' | 'C';

const fmt$ = (v: number | null | undefined) => (v != null ? `$${Math.round(v).toLocaleString()}` : '—');
const bedLabel = (b: number | null) => (b == null ? '—' : b === 0 ? 'Studio' : `${b}BR`);

const PRIORITY_STYLE: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  B: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  C: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};
const PRIORITY_LABEL: Record<string, string> = { A: 'Focus', B: 'Featured', C: 'Standard' };

const chip = (active: boolean) =>
  `flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
    active ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
  }`;

export default function ExclusivePropertyPage() {
  const navigate = useNavigate();
  const { slug = 'solace' } = useParams();
  const [tab, setTab] = useState<Tab>('units');
  const [beds, setBeds] = useState<BedFilter>('all');
  const [priority, setPriority] = useState<PriorityFilter>('focus');
  const [search, setSearch] = useState('');

  const propertyQ = useQuery({
    queryKey: ['exclusive-property', slug],
    queryFn: async () => {
      const { data, error } = await inrange.from('exclusive_properties' as never).select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data as unknown as ExclusiveProperty | null;
    },
  });
  const property = propertyQ.data;

  const unitsQ = useQuery({
    queryKey: ['exclusive-units', property?.id],
    enabled: !!property?.id,
    queryFn: async () => {
      const { data, error } = await inrange
        .from('rental_units')
        .select('id, unit_number, floor, bedrooms, bathrooms, square_footage, outdoor_sf, roof_private_sf, orientation, monthly_rent, listing_status, owner_advertised, staged, marketing_priority, pricing_review_note' as never)
        .eq('exclusive_property_id' as never, property!.id as never)
        .order('floor' as never, { ascending: true })
        .order('unit_number', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ExclusiveUnit[];
    },
  });

  const leadsQ = useQuery({
    queryKey: ['exclusive-leads', slug],
    enabled: !!property?.id,
    queryFn: async () => {
      const { data, error } = await inrange
        .from('exclusive_leasing_pipeline' as never)
        .select('*')
        .eq('property_slug', slug)
        .order('lead_created_at', { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as ExclusiveLead[];
    },
  });

  const units = unitsQ.data ?? [];
  const leads = leadsQ.data ?? [];

  const filteredUnits = useMemo(() => units.filter((u) => {
    if (beds !== 'all' && String(u.bedrooms) !== beds) return false;
    if (priority === 'focus' && !(u.marketing_priority === 'A' || u.marketing_priority === 'B')) return false;
    if (priority !== 'all' && priority !== 'focus' && u.marketing_priority !== priority) return false;
    if (search && !u.unit_number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [units, beds, priority, search]);

  const summary = useMemo(() => {
    const rows = [0, 1, 2, 3].map((b) => {
      const us = units.filter((u) => u.bedrooms === b);
      const rents = us.map((u) => u.monthly_rent ?? 0).filter(Boolean);
      return {
        label: bedLabel(b), total: us.length,
        focus: us.filter((u) => u.marketing_priority === 'A' || u.marketing_priority === 'B').length,
        owner: us.filter((u) => u.owner_advertised).length,
        hold: us.filter((u) => u.listing_status === 'draft').length,
        min: rents.length ? Math.min(...rents) : null, max: rents.length ? Math.max(...rents) : null,
      };
    });
    const gpr = units.reduce((s, u) => s + (u.monthly_rent ?? 0), 0);
    return { rows, gpr };
  }, [units]);

  if (propertyQ.isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
  }

  if (propertyQ.error || !property) {
    return (
      <div className="px-4 py-16 text-center">
        <Lock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This exclusive isn't available to your account. Ask your broker to add you to the property team.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 dark:text-gray-400 p-1 -ml-1" aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{property.name}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {property.display_brand} · {property.address}{property.alt_address ? ` / ${property.alt_address}` : ''}
                {property.neighborhood ? ` · ${property.neighborhood}` : ''}
              </p>
            </div>
            <span className="ml-auto flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Exclusive
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pt-2">
            {(['units', 'leads', 'summary'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={chip(tab === t)}>
                {t === 'units' ? `Units (${units.length})` : t === 'leads' ? `Leads (${leads.length})` : 'Summary'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        {tab === 'units' && (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text" placeholder="Search unit (e.g. S1605)" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {([['focus', 'Campaign focus'], ['all', 'All'], ['A', 'Focus (2–3BR)'], ['B', 'Featured 1BR/Studio'], ['C', 'Standard']] as [PriorityFilter, string][]).map(([v, l]) => (
                <button key={v} onClick={() => setPriority(v)} className={chip(priority === v)}>{l}</button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-3">
              {([['all', 'All beds'], ['0', 'Studio'], ['1', '1BR'], ['2', '2BR'], ['3', '3BR']] as [BedFilter, string][]).map(([v, l]) => (
                <button key={v} onClick={() => setBeds(v)} className={chip(beds === v)}>{l}</button>
              ))}
            </div>

            {unitsQ.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>}
            {unitsQ.error && <ErrorBox text="Could not load units" />}
            <p className="text-xs text-gray-500 mb-2">{filteredUnits.length} units</p>
            <div className="space-y-2">
              {filteredUnits.map((u) => {
                const outdoor = (u.outdoor_sf ?? 0) + (u.roof_private_sf ?? 0);
                return (
                  <div key={u.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-white">{u.unit_number}</span>
                      <span className="text-xs text-gray-500">{bedLabel(u.bedrooms)} / {u.bathrooms ?? '—'}BA</span>
                      {u.marketing_priority && (
                        <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${PRIORITY_STYLE[u.marketing_priority]}`}>
                          {PRIORITY_LABEL[u.marketing_priority]}
                        </span>
                      )}
                      <span className="ml-auto text-sm font-semibold text-gray-900 dark:text-white">{fmt$(u.monthly_rent)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                      <span>Floor {u.floor ?? '—'}</span>
                      {u.square_footage != null && <span>{u.square_footage} sf</span>}
                      {outdoor > 0 && <span>{outdoor} sf outdoor{u.roof_private_sf ? ' (private roof)' : ''}</span>}
                      {u.orientation && <span className="truncate">{u.orientation}</span>}
                    </div>
                    {(u.owner_advertised || u.staged || u.listing_status === 'draft') && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {u.listing_status === 'draft' && <Tag className="bg-red-100 text-red-700">Pricing hold, do not advertise</Tag>}
                        {u.owner_advertised && <Tag className="bg-amber-100 text-amber-800">Owner-advertised, skip in JRA ads</Tag>}
                        {u.staged && <Tag className="bg-violet-100 text-violet-800"><Star className="h-3 w-3 inline -mt-0.5 mr-0.5" />Staged</Tag>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'leads' && (
          <>
            {leadsQ.isLoading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>}
            {leadsQ.error && <ErrorBox text="Could not load leads" />}
            {!leadsQ.isLoading && leads.length === 0 && (
              <div className="text-center py-16">
                <Building className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No {property.name} leads yet</p>
                <p className="text-xs text-gray-400 mt-1">Leads from {property.name} ads and forms will appear here, separate from standard rentals.</p>
              </div>
            )}
            <div className="space-y-2">
              {leads.map((l) => (
                <div key={l.isa_lead_id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{l.full_name ?? 'Unnamed lead'}</span>
                    {l.ai_escalation_needed && <Tag className="bg-red-100 text-red-700">Needs review</Tag>}
                    <span className="ml-auto text-[10px] text-gray-400">{new Date(l.lead_created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                    {l.pipeline_stage && <span>{l.pipeline_stage.replace(/_/g, ' ')}</span>}
                    {l.move_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Move {new Date(l.move_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                    {l.max_rent != null && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />up to {fmt$(l.max_rent)}</span>}
                    {l.min_bedrooms != null && <span>{bedLabel(l.min_bedrooms)}+</span>}
                    <span>{l.sms_consent ? 'SMS consent on file' : 'No SMS consent'}</span>
                  </div>
                  {(l.email || l.phone) && <div className="text-xs text-gray-500 mt-1 truncate">{l.email}{l.email && l.phone ? ' · ' : ''}{l.phone}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'summary' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat label="Market units" value={String(units.length)} />
              <Stat label="Gross potential rent" value={`${fmt$(summary.gpr)}/mo`} />
              <Stat label="Minimum advertised rent" value={fmt$(property.min_advertised_rent)} />
              <Stat label="Parking" value={property.parking_asking_rent ? `${fmt$(property.parking_asking_rent)}/mo` : '—'} />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Layout</th>
                    <th className="text-right font-medium px-3 py-2">Units</th>
                    <th className="text-right font-medium px-3 py-2">Campaign</th>
                    <th className="text-right font-medium px-3 py-2">Owner-advertised</th>
                    <th className="text-right font-medium px-3 py-2">On hold</th>
                    <th className="text-right font-medium px-3 py-2">Rent range</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.rows.map((r) => (
                    <tr key={r.label} className="border-b last:border-0 border-gray-50 dark:border-gray-800 text-gray-900 dark:text-gray-100">
                      <td className="px-3 py-2">{r.label}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.total}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.focus}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.owner}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.hold}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt$(r.min)}–{fmt$(r.max)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Exclusive held by {property.exclusive_holder ?? '—'}{property.jra_role === 'loan_out' ? '; JRA MVP Team on loan-out' : ''}.
              Leads generated by JRA are JRA's. Affordable (MIH) units are handled only through NYC Housing Connect and are not listed here.
              {property.jra_offer ? ` Current JRA offer: ${property.jra_offer}.` : ' No JRA offer set; ads use gross rent.'}
            </p>
          </div>
        )}
        <div className="h-8" />
      </div>
    </div>
  );
}

function Tag({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${className}`}>{children}</span>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2">
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-base font-semibold text-gray-900 dark:text-white tabular-nums">{value}</p>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 text-center mb-3">
      <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
      <p className="text-sm text-red-700 dark:text-red-300 font-medium">{text}</p>
    </div>
  );
}
