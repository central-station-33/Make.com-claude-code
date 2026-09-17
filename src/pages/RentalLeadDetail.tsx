import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import {
  RentalLeadDetail as RentalLeadDetailType, RentalPipelineStage,
  RENTAL_STAGE_LABELS, RENTAL_STAGE_COLORS,
} from '@/types/leasing';
import {
  Loader2, ArrowLeft, AlertTriangle, Phone, Mail, Calendar, DollarSign,
  Home, Users, PawPrint, Car, StickyNote, Sparkles, ShieldAlert,
} from 'lucide-react';

const fmt$ = (v: number | null | undefined) => (v != null ? `$${v.toLocaleString()}` : '—');

const TABS = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'ai', label: 'AI Summary', icon: Sparkles },
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

export default function RentalLeadDetail() {
  const { id } = useParams<{ id: string }>(); // isa_lead_id
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['rental-lead', id],
    queryFn: async () => {
      const { data, error } = await inrange
        .from('rental_inquiries')
        .select('*, isa_lead:isa_leads(id,full_name,email,phone,market,routing,outreach_status,sms_consent,marketing_consent,opted_out_at,assigned_agent_id,ai_summary)')
        .eq('isa_lead_id', id)
        .single();
      if (error) throw error;
      const lead = data as unknown as RentalLeadDetailType;
      if (lead.additional_notes) setNotes(lead.additional_notes);
      return lead;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const saveNotes = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await inrange
        .from('rental_inquiries')
        .update({ additional_notes: text } as never)
        .eq('isa_lead_id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    },
  });

  const updateStage = useMutation({
    mutationFn: async (stage: RentalPipelineStage) => {
      const { error } = await inrange
        .from('rental_inquiries')
        .update({ pipeline_stage: stage } as never)
        .eq('isa_lead_id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rental-lead', id] });
      queryClient.invalidateQueries({ queryKey: ['rental-leads'] });
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
        <p className="text-sm text-red-700 dark:text-red-300">Could not load rental lead</p>
      </div>
    );
  }

  const isa = lead.isa_lead;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate('/leasing/renters')} className="text-gray-500 dark:text-gray-400">
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
            onChange={(e) => updateStage.mutate(e.target.value as RentalPipelineStage)}
            className={`text-xs font-medium rounded-full border px-3 py-1 cursor-pointer appearance-none ${RENTAL_STAGE_COLORS[lead.pipeline_stage]}`}
          >
            {(Object.keys(RENTAL_STAGE_LABELS) as RentalPipelineStage[]).map((s) => (
              <option key={s} value={s}>{RENTAL_STAGE_LABELS[s]}</option>
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
          {isa.opted_out_at && (
            <span className="flex items-center gap-1.5 text-xs font-medium bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-full px-3 py-1">
              <ShieldAlert className="h-3 w-3" /> Opted Out
            </span>
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
            <Section title="Requirements">
              <div className="grid grid-cols-2 gap-2">
                <Card>
                  <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Calendar className="h-3 w-3" /> Move Date</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {lead.move_date ? new Date(lead.move_date).toLocaleDateString() : '—'}
                    {lead.move_date_flexible && <span className="text-xs font-normal text-gray-400 ml-1">(flexible)</span>}
                  </p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><DollarSign className="h-3 w-3" /> Max Rent</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt$(lead.max_rent)}/mo</p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Home className="h-3 w-3" /> Bedrooms</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {lead.min_bedrooms ?? '—'}{lead.preferred_bedrooms && lead.preferred_bedrooms !== lead.min_bedrooms ? ` (pref. ${lead.preferred_bedrooms})` : ''}
                  </p>
                </Card>
                <Card>
                  <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Users className="h-3 w-3" /> Household</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{lead.household_size ?? '—'}</p>
                </Card>
              </div>

              {lead.target_locations && lead.target_locations.length > 0 && (
                <Card className="mt-2">
                  <p className="text-xs text-gray-400 mb-1.5">Target Locations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lead.target_locations.map((loc) => (
                      <span key={loc} className="text-xs bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 rounded-full px-2.5 py-1">
                        {loc}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-2 mt-2">
                {lead.parking_needed != null && (
                  <Card>
                    <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Car className="h-3 w-3" /> Parking</p>
                    <p className="text-sm text-gray-900 dark:text-white">{lead.parking_needed ? 'Needed' : 'Not needed'}</p>
                  </Card>
                )}
                {lead.pets && Object.keys(lead.pets).length > 0 && (
                  <Card>
                    <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><PawPrint className="h-3 w-3" /> Pets</p>
                    <p className="text-sm text-gray-900 dark:text-white">{JSON.stringify(lead.pets)}</p>
                  </Card>
                )}
              </div>

              {lead.unit_style && (
                <div className="mt-2">
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full px-2.5 py-1 capitalize">
                    {lead.unit_style.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
            </Section>

            {lead.additional_notes && (
              <Section title="Additional Notes (from intake)">
                <Card><p className="text-sm text-gray-700 dark:text-gray-300">{lead.additional_notes}</p></Card>
              </Section>
            )}
          </>
        )}

        {tab === 'ai' && (
          <>
            {!lead.ai_conversation_summary && !isa.ai_summary ? (
              <Card>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No AI qualification has run for this lead yet.
                </p>
              </Card>
            ) : (
              <>
                {lead.ai_escalation_needed && (
                  <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider mb-1">Needs Human Review</p>
                    <p className="text-sm text-red-900 dark:text-red-100">{lead.ai_escalation_reason ?? 'Escalation reason not specified.'}</p>
                  </Card>
                )}
                {(lead.ai_conversation_summary || isa.ai_summary) && (
                  <Section title="Conversation Summary">
                    <Card><p className="text-sm text-gray-700 dark:text-gray-300">{lead.ai_conversation_summary ?? isa.ai_summary}</p></Card>
                  </Section>
                )}
                {lead.ai_missing_info && lead.ai_missing_info.length > 0 && (
                  <Section title="Missing Information">
                    <div className="flex flex-wrap gap-1.5">
                      {lead.ai_missing_info.map((info) => (
                        <span key={info} className="text-xs bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full px-2.5 py-1">
                          {info}
                        </span>
                      ))}
                    </div>
                  </Section>
                )}
                {lead.ai_confidence != null && (
                  <Section title="AI Confidence">
                    <Card>
                      <p className="text-base font-bold text-gray-900 dark:text-white">{lead.ai_confidence}<span className="text-xs text-gray-400 font-normal">/5</span></p>
                    </Card>
                  </Section>
                )}
              </>
            )}
          </>
        )}

        {tab === 'notes' && (
          <div className="space-y-3">
            <Card>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Agent Notes</p>
              <textarea
                className="w-full text-sm text-gray-700 dark:text-gray-300 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg p-3 resize-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 min-h-[140px]"
                placeholder="Add notes about this renter — conversations, tour feedback, follow-up reminders…"
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
              {!isa.sms_consent && !isa.opted_out_at && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  No SMS consent on file — outreach to this lead must go by phone or email until consent is captured.
                </p>
              )}
            </Card>
          </Section>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}
