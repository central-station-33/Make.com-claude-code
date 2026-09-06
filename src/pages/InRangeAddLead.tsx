import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import { PriorityTier } from '@/types/inrange';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

type FormData = {
  address: string;
  city: string;
  state: string;
  zip: string;
  deal_type: string;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  priority_tier: PriorityTier;
  notes: string;
};

const EMPTY: FormData = {
  address: '',
  city: '',
  state: 'NJ',
  zip: '',
  deal_type: '',
  owner_name: '',
  owner_phone: '',
  owner_email: '',
  priority_tier: 'Tier 3',
  notes: '',
};

const FIELD_CLASS =
  'w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 dark:focus:border-blue-500';

const LABEL_CLASS = 'block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1';

export default function InRangeAddLead() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saved, setSaved] = useState(false);

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const addLead = useMutation({
    mutationFn: async () => {
      const { data, error } = await inrange
        .from('properties')
        .insert({
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          zip: form.zip.trim(),
          deal_type: form.deal_type.trim() || null,
          owner_name: form.owner_name.trim() || null,
          owner_phone: form.owner_phone.trim() || null,
          owner_email: form.owner_email.trim() || null,
          priority_tier: form.priority_tier,
          notes: form.notes.trim() || null,
          composite_score: 50,
          enrichment_status: 'pending',
          status: 'new_lead',
        } as any)
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSaved(true);
      setTimeout(() => navigate(`/inrange/${data.id}`), 900);
    },
  });

  const canSubmit = form.address.trim() && form.city.trim() && form.state.trim();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/inrange')} className="text-gray-500 dark:text-gray-400 p-1 -ml-1">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1">Add a Lead</h1>
        <button
          onClick={() => addLead.mutate()}
          disabled={!canSubmit || addLead.isPending || saved}
          className="text-sm font-semibold text-blue-600 dark:text-blue-400 disabled:opacity-40"
        >
          {addLead.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : 'Save'}
        </button>
      </div>

      <div className="px-4 py-5 space-y-5">
        {addLead.error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700 dark:text-red-300">{(addLead.error as Error).message}</p>
          </div>
        )}

        {/* Property */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Property</p>
          <div>
            <label className={LABEL_CLASS}>Address *</label>
            <input className={FIELD_CLASS} placeholder="123 Main St" value={form.address} onChange={set('address')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>City *</label>
              <input className={FIELD_CLASS} placeholder="Newark" value={form.city} onChange={set('city')} />
            </div>
            <div>
              <label className={LABEL_CLASS}>State *</label>
              <select className={FIELD_CLASS} value={form.state} onChange={set('state')}>
                <option value="NJ">NJ</option>
                <option value="NY">NY</option>
                <option value="CT">CT</option>
                <option value="PA">PA</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>ZIP</label>
              <input className={FIELD_CLASS} placeholder="07102" value={form.zip} onChange={set('zip')} maxLength={10} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Deal Type</label>
              <select className={FIELD_CLASS} value={form.deal_type} onChange={set('deal_type')}>
                <option value="">— Select —</option>
                <option value="wholesale">Wholesale</option>
                <option value="fix_and_flip">Fix &amp; Flip</option>
                <option value="buy_and_hold">Buy &amp; Hold</option>
                <option value="subject_to">Subject-To</option>
              </select>
            </div>
          </div>
        </div>

        {/* Owner */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Owner</p>
          <div>
            <label className={LABEL_CLASS}>Name</label>
            <input className={FIELD_CLASS} placeholder="John Smith" value={form.owner_name} onChange={set('owner_name')} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Phone</label>
            <input className={FIELD_CLASS} type="tel" placeholder="(201) 555-0100" value={form.owner_phone} onChange={set('owner_phone')} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Email</label>
            <input className={FIELD_CLASS} type="email" placeholder="owner@example.com" value={form.owner_email} onChange={set('owner_email')} />
          </div>
        </div>

        {/* Priority */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Priority</p>
          <div className="grid grid-cols-4 gap-2">
            {(['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'] as PriorityTier[]).map((t) => (
              <button
                key={t}
                onClick={() => setForm((f) => ({ ...f, priority_tier: t }))}
                className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  form.priority_tier === t
                    ? t === 'Tier 1' ? 'bg-red-500 text-white border-red-500'
                    : t === 'Tier 2' ? 'bg-orange-500 text-white border-orange-500'
                    : t === 'Tier 3' ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'bg-gray-500 text-white border-gray-500'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Notes</p>
          <textarea
            className={`${FIELD_CLASS} resize-none`}
            rows={3}
            placeholder="Any initial notes about this lead…"
            value={form.notes}
            onChange={set('notes')}
          />
        </div>

        {/* Save button */}
        <button
          onClick={() => addLead.mutate()}
          disabled={!canSubmit || addLead.isPending || saved}
          className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {addLead.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {saved ? 'Saved! Redirecting…' : 'Save Lead'}
        </button>

        <div className="h-4" />
      </div>
    </div>
  );
}
