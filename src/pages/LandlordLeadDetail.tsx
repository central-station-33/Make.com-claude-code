import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import {
  LandlordLeadDetail as LandlordLeadDetailType, LandlordPipelineStage,
  LANDLORD_STAGE_LABELS, LANDLORD_STAGE_COLORS,
} from '@/types/leasing';
import {
  Loader2, ArrowLeft, AlertTriangle, Phone, Mail, Calendar, DollarSign,
  Building2, StickyNote, ShieldAlert, MapPin,
} from 'lucide-react';

const fmt$ = (v: number | null | undefined) => (v != null ? `$${v.toLocaleString()}` : '—');

const TABS = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'consent', label: 'Consent', icon: ShieldAlert },
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

export default function LandlordLeadDetail() {
  const { id } = useParams<{ id: string }>(); // isa_lead_id
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['landlord-lead', id],
    queryFn: async () => {
      const { data, error } = await inrange
        .from('landlord_leads')
        .select('*, isa_lead:isa_leads(id,full_name,email,phone,market,sms_consent,marketing_consent,opted_out_at,assigned_agent_id)')
        .eq('isa_lead_id', id)
        .single();
      if (error) throw error;
      const lead = data as unknown as LandlordLeadDetailType;
      if (lead.notes) setNotes(lead.notes);
      return lead;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const saveNotes = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await inrange
        .from('landlord_leads')
        .update({ notes: text } as never)
        .eq('isa_lead_id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    },
  });

  const updateStage = useMutation({
    mutationFn: async (stage: LandlordPipelineStage) => {
      const { error } = await inrange
        .from('landlord_leads')
        .update({ pipeline_stage: stage } as never)
        .eq('isa_lead_id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landlord-lead', id] });
      queryClient.invalidateQueries({ queryKey: ['landlord-leads'] });
    },
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
        <p className="text-sm text-red-700 dark:text-red-300">Could not load landlord lead</p>
      </div>
    );
  }

  const isa = lead.isa_lead;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/leasing/landlords')} className="text-gray-500 dark:text-gray-400">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{isa.full_name ?? 'Unnamed Lead'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{isa.market}</p>
          </div>
        </div>

        <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
          <select
            value={lead.pipeline_stage}
            onChange={(e) => updateStage.mutate(e.target.value as LandlordPipelineStage)}
            className={`text-xs font-medium rounded-full border px-3 py-1 cursor-pointer appearance-none ${LANDLORD_STAGE_COLORS[lead.pipeline_stage]}`}
          >
            {(Object.keys(LANDLORD_STAGE_LABELS) as LandlordPipelineStage[]).map((s) => (
              <option key={s} value={s}>{LANDLORD_STAGE_LABELS[s]}</option>
            ))}
          </select>
          {isa.phone && !isa.opted_out_at && (
            <a
              href={`tel:${isa.phone}`}
              className="flex items-center gap-1.5 text-xs font-medium bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-full px-3 py-1"
            >
              <Phone className="h-3 w-3" /> Call
            </a>
          )}
          {isa.email && (
            <a
              href={`mailto:${isa.email}`}
              className="flex items-center gap-1.5 text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-full px-3 py-1"
            >
              <Mail className="h-3 w-3" /> Email
            </a>
          )}
        </div>

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

      <div className="px-4 py-4 space-y-4">
        {tab === 'overview' && (
          <>
            {lead.property_address && (
              <Section title="Property">
                <Card>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.property_address}</p>
                      <p className="text-xs text-gray-400">
                        {[lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}
                        {lead.county && ` · ${lead.county} County`}
                      </p>
                    </div>
                  </div>
                </Card>
              </Section>
            )}

            <Section title="Leasing Details">
              <div className="grid grid-cols-2 gap-2">
                <Card>
                  <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Calendar className="h-3 w-3" /> Vacancy Date</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {lead.vacancy_date ? new Date(lead.vacancy_date).toLocaleDateString() : '—'}
                  </p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><DollarSign className="h-3 w-3" /> Expected Rent</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt$(lead.expected_rent)}/mo</p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-400 mb-0.5">Unit Count</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{lead.unit_count ?? '—'}</p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-400 mb-0.5">Preferred Contact</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{lead.preferred_contact_method ?? '—'}</p>
                </Card>
              </div>

              {lead.leasing_need && (
                <Card className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Leasing Need</p>
                  <p className="text-sm text-gray-900 dark:text-white">{lead.leasing_need}</p>
                </Card>
              )}

              {lead.current_status && (
                <Card className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Current Status</p>
                  <p className="text-sm text-gray-900 dark:text-white">{lead.current_status}</p>
                </Card>
              )}
            </Section>
          </>
        )}

        {tab === 'notes' && (
          <div className="space-y-3">
            <Card>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Agent Notes</p>
              <textarea
                className="w-full text-sm text-gray-700 dark:text-gray-300 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg p-3 resize-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 min-h-[140px]"
                placeholder="Add notes about this landlord — vacancy details, listing agreement status, follow-up reminders…"
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
          </div>
        )}

        {tab === 'consent' && (
          <Section title="Communication Consent">
            <Card>
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-gray-400">SMS Consent</dt>
                  <dd className={`text-xs font-medium rounded-full px-2 py-0.5 ${isa.sms_consent ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {isa.sms_consent ? 'On file' : 'Not on file'}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-gray-400">Marketing Consent</dt>
                  <dd className={`text-xs font-medium rounded-full px-2 py-0.5 ${isa.marketing_consent ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {isa.marketing_consent ? 'On file' : 'Not on file'}
                  </dd>
                </div>
                {isa.opted_out_at && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                    <dt className="text-xs text-red-500">Opted Out</dt>
                    <dd className="text-xs text-red-700 dark:text-red-300">{new Date(isa.opted_out_at).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </Card>
          </Section>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
