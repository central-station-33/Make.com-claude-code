import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import { InRangeLead, PriorityTier, LeadStatus, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types/inrange';
import { Loader2, ArrowLeft, AlertTriangle, Phone, Mail, MapPin, Home, DollarSign, Share2, MessageCircle, TrendingUp, ShieldAlert, StickyNote } from 'lucide-react';

const TIER_COLORS: Record<PriorityTier, string> = {
  'Tier 1': 'bg-red-100 text-red-700 border-red-300',
  'Tier 2': 'bg-orange-100 text-orange-700 border-orange-300',
  'Tier 3': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  'Tier 4': 'bg-gray-100 text-gray-600 border-gray-300',
};

const fmt$ = (v: number | null | undefined) =>
  v != null ? `$${v.toLocaleString()}` : '—';

const TABS = [
  { id: 'outreach', label: 'Outreach', icon: Share2 },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'analysis', label: 'Analysis', icon: TrendingUp },
  { id: 'owner', label: 'Owner', icon: Home },
  { id: 'financials', label: 'Financials', icon: DollarSign },
  { id: 'signals', label: 'Signals', icon: ShieldAlert },
] as const;
type Tab = (typeof TABS)[number]['id'];

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-5">
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
    {children}
  </div>
);

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 ${className}`}>
    {children}
  </div>
);

export default function InRangeLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('outreach');
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  const saveNotes = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await inrange
        .from('properties')
        .update({ notes: text } as any)
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: LeadStatus) => {
      const { error } = await inrange
        .from('properties')
        .update({ status } as any)
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inrange-lead', id] });
      queryClient.invalidateQueries({ queryKey: ['inrange-leads'] });
    },
  });

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['inrange-lead', id],
    queryFn: async () => {
      const { data, error } = await inrange
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      const lead = data as InRangeLead;
      if (lead.notes) setNotes(lead.notes);
      return lead;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-700 dark:text-red-300">Could not load lead</p>
      </div>
    );
  }

  const ai = lead.ai_analysis;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/inrange/leads')} className="text-gray-500 dark:text-gray-400">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{lead.address}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{lead.city}, {lead.state} {lead.zip}</p>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TIER_COLORS[lead.priority_tier]}`}>
            {lead.priority_tier}
          </span>
        </div>

        {/* Status + action buttons */}
        <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
          <select
            value={lead.status ?? 'new_lead'}
            onChange={(e) => updateStatus.mutate(e.target.value as LeadStatus)}
            className={`text-xs font-medium rounded-full border px-3 py-1 cursor-pointer appearance-none ${LEAD_STATUS_COLORS[lead.status ?? 'new_lead']}`}
          >
            {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((s) => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
            ))}
          </select>
          {lead.owner_phone && (
            <a
              href={`tel:${lead.owner_phone}`}
              className="flex items-center gap-1.5 text-xs font-medium bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-full px-3 py-1"
            >
              <Phone className="h-3 w-3" /> Call
            </a>
          )}
          {lead.owner_email && (
            <a
              href={`mailto:${lead.owner_email}`}
              className="flex items-center gap-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full px-3 py-1"
            >
              <Mail className="h-3 w-3" /> Email
            </a>
          )}
        </div>

        {/* Score bar */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-current flex items-center justify-center font-bold text-sm
            text-red-600 dark:text-red-400">
            {lead.composite_score}
          </div>
          <div className="flex-1">
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-red-500 rounded-full"
                style={{ width: `${lead.composite_score}%` }}
              />
            </div>
          </div>
          {lead.deal_type && (
            <span className="text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900 rounded px-2 py-0.5">
              {lead.deal_type}
            </span>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-gray-800">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-400'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-4 space-y-4">

        {/* ── Notes ── */}
        {tab === 'notes' && (
          <div className="space-y-3">
            <Card>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact Notes</p>
              <textarea
                className="w-full text-sm text-gray-700 dark:text-gray-300 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg p-3 resize-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 min-h-[140px]"
                placeholder="Add notes about this lead — conversations, offers, follow-up reminders…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <button
                onClick={() => saveNotes.mutate(notes)}
                disabled={saveNotes.isPending}
                className="mt-2 w-full py-2 text-sm font-medium rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 disabled:opacity-50"
              >
                {saveNotes.isPending ? 'Saving…' : notesSaved ? 'Saved ✓' : 'Save Notes'}
              </button>
            </Card>
            {lead.last_contacted_at && (
              <Card>
                <p className="text-xs text-gray-400">Last contacted</p>
                <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                  {new Date(lead.last_contacted_at).toLocaleString()}
                </p>
              </Card>
            )}
          </div>
        )}

        {/* ── Outreach ── */}
        {tab === 'outreach' && (
          <>
            {!ai ? (
              <Card>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  AI analysis not yet available for this lead.
                </p>
              </Card>
            ) : (
              <>
                {ai.priority_action && (
                  <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider mb-1">Priority Action — Do This Now</p>
                    <p className="text-sm text-orange-900 dark:text-orange-100">{ai.priority_action}</p>
                  </Card>
                )}

                {ai.contact_strategy && (
                  <Section title="Contact Strategy">
                    <Card>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{ai.contact_strategy}</p>
                    </Card>
                  </Section>
                )}

                {ai.social_platforms && ai.social_platforms.length > 0 && (
                  <Section title="Social Platforms">
                    <div className="space-y-2">
                      {ai.social_platforms.map((p, i) => (
                        <Card key={i}>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{p}</p>
                        </Card>
                      ))}
                    </div>
                  </Section>
                )}

                {ai.talking_points && ai.talking_points.length > 0 && (
                  <Section title="Talking Points / DM Openers">
                    <div className="space-y-2">
                      {ai.talking_points.map((tp, i) => (
                        <Card key={i} className="flex gap-3">
                          <MessageCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-700 dark:text-gray-300">{tp}</p>
                        </Card>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Owner contact quick-access */}
                {(lead.owner_phone || lead.owner_email) && (
                  <Section title="Direct Contact">
                    <div className="space-y-2">
                      {lead.owner_phone && (
                        <a href={`tel:${lead.owner_phone}`} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                          <Phone className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{lead.owner_phone}</span>
                        </a>
                      )}
                      {lead.owner_email && (
                        <a href={`mailto:${lead.owner_email}`} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{lead.owner_email}</span>
                        </a>
                      )}
                    </div>
                  </Section>
                )}
              </>
            )}
          </>
        )}

        {/* ── Analysis ── */}
        {tab === 'analysis' && (
          <>
            {!ai ? (
              <Card>
                <p className="text-sm text-gray-500 text-center py-4">AI analysis not yet available.</p>
              </Card>
            ) : (
              <>
                {ai.investment_thesis && (
                  <Section title="Investment Thesis">
                    <Card>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{ai.investment_thesis}</p>
                    </Card>
                  </Section>
                )}

                {ai.best_strategy && (
                  <Section title="Best Strategy">
                    <Card>
                      <span className="inline-block bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900 rounded-lg px-3 py-1.5 text-sm font-semibold capitalize">
                        {ai.best_strategy.replace(/_/g, ' ')}
                      </span>
                    </Card>
                  </Section>
                )}

                {ai.profit_potential && (
                  <Section title="Profit Potential">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Max Offer', value: ai.profit_potential.max_allowable_offer },
                        { label: 'Rec. Offer', value: ai.profit_potential.recommended_offer },
                        { label: 'Wholesale Fee', value: ai.profit_potential.wholesale_fee },
                        { label: 'Fix & Flip Profit', value: ai.profit_potential.fix_and_flip_profit },
                      ].map(({ label, value }) => value ? (
                        <Card key={label}>
                          <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                          <p className="text-base font-bold text-gray-900 dark:text-white">{fmt$(value)}</p>
                        </Card>
                      ) : null)}
                    </div>
                  </Section>
                )}
              </>
            )}
          </>
        )}

        {/* ── Owner ── */}
        {tab === 'owner' && (
          <Section title="Owner Details">
            <Card>
              <dl className="space-y-3">
                {[
                  { label: 'Name', value: lead.owner_name },
                  { label: 'Type', value: lead.owner_type },
                  { label: 'Owner State', value: lead.owner_state },
                  { label: 'Mailing Address', value: lead.owner_mailing_address },
                  { label: 'Phone', value: lead.owner_phone },
                  { label: 'Email', value: lead.owner_email },
                ].map(({ label, value }) => value ? (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <dt className="text-xs text-gray-400 mt-0.5 min-w-[100px]">{label}</dt>
                    <dd className="text-sm text-gray-900 dark:text-white text-right">{value}</dd>
                  </div>
                ) : null)}
                {lead.owner_state && lead.owner_state !== lead.state && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-xs bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full px-2 py-0.5 font-medium">
                      Out-of-state owner ({lead.owner_state} vs property {lead.state})
                    </span>
                  </div>
                )}
              </dl>
            </Card>
          </Section>
        )}

        {/* ── Financials ── */}
        {tab === 'financials' && (
          <Section title="Financial Details">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Est. ARV', value: fmt$(lead.estimated_arv) },
                { label: 'Equity', value: lead.equity ? `${fmt$(lead.equity)} (${lead.equity_percentage ?? '?'}%)` : '—' },
                { label: 'Asking Price', value: fmt$(lead.asking_price) },
                { label: 'Amount Owed', value: fmt$(lead.amount_owed) },
                { label: 'Assessed Value', value: fmt$(lead.assessed_value) },
                { label: 'Taxes Owed', value: fmt$(lead.taxes_owed) },
                { label: 'Below Market', value: lead.below_market_percentage != null ? `${lead.below_market_percentage}%` : '—' },
              ].map(({ label, value }) => (
                <Card key={label}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
                </Card>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              {[
                { label: 'Property Type', value: lead.property_type },
                { label: 'Bed / Bath', value: lead.bedrooms != null ? `${lead.bedrooms}bd / ${lead.bathrooms ?? '?'}ba` : null },
                { label: 'Sq Ft', value: lead.square_footage ? `${lead.square_footage.toLocaleString()} sqft` : null },
                { label: 'Year Built', value: lead.year_built?.toString() },
                { label: 'County', value: lead.county },
              ].map(({ label, value }) => value ? (
                <div key={label} className="flex justify-between text-sm px-1">
                  <span className="text-gray-400 text-xs">{label}</span>
                  <span className="text-gray-900 dark:text-white">{value}</span>
                </div>
              ) : null)}
            </div>
          </Section>
        )}

        {/* ── Signals ── */}
        {tab === 'signals' && (
          <>
            {lead.distress_indicators && lead.distress_indicators.length > 0 && (
              <Section title="Distress Indicators">
                <div className="flex flex-wrap gap-2">
                  {lead.distress_indicators.map((ind) => (
                    <span
                      key={ind}
                      className="text-xs bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-full px-3 py-1"
                    >
                      {ind.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {lead.process_stage && (
              <Section title="Process">
                <Card>
                  <dl className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 text-xs">Stage</span>
                      <span className="text-gray-900 dark:text-white capitalize">{lead.process_stage}</span>
                    </div>
                    {lead.notice_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 text-xs">Notice Date</span>
                        <span className="text-gray-900 dark:text-white">{lead.notice_date}</span>
                      </div>
                    )}
                    {lead.auction_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 text-xs">Auction Date</span>
                        <span className="text-red-600 dark:text-red-400 font-semibold">{lead.auction_date}</span>
                      </div>
                    )}
                    {lead.case_number && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 text-xs">Case #</span>
                        <span className="text-gray-900 dark:text-white">{lead.case_number}</span>
                      </div>
                    )}
                  </dl>
                </Card>
              </Section>
            )}

            {ai?.red_flags && ai.red_flags.length > 0 && (
              <Section title="Red Flags">
                <div className="space-y-2">
                  {ai.red_flags.map((flag, i) => (
                    <Card key={i} className="flex gap-3 border-red-100 dark:border-red-900">
                      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300">{flag}</p>
                    </Card>
                  ))}
                </div>
              </Section>
            )}

            {ai?.risks && ai.risks.length > 0 && (
              <Section title="Risks">
                <div className="space-y-2">
                  {ai.risks.map((risk, i) => (
                    <Card key={i}>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{risk}</p>
                    </Card>
                  ))}
                </div>
              </Section>
            )}

            <Section title="Scores">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Composite', value: lead.composite_score },
                  { label: 'Distress', value: lead.distress_score },
                  { label: 'Deal Quality', value: lead.deal_quality_score },
                  { label: 'Contact Likelihood', value: lead.contact_likelihood_score },
                  { label: 'Timeline Urgency', value: lead.timeline_urgency_score },
                ].map(({ label, value }) => value != null ? (
                  <Card key={label}>
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white">{value}<span className="text-xs text-gray-400 font-normal">/100</span></p>
                  </Card>
                ) : null)}
              </div>
            </Section>
          </>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
