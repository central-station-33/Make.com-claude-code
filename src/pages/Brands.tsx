import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inrange } from '@/integrations/supabase/inrange';
import { useCurrentTeamAgent } from '@/hooks/useCurrentTeamAgent';
import { useBrand, type Brand } from '@/contexts/BrandContext';
import { ArrowLeft, Loader2, AlertTriangle, Save } from 'lucide-react';

/**
 * Broker-only: view and edit brand profiles (the branded fronts on the shared
 * lead engine). Signatures and disclosures saved here are what brand-aware
 * outreach will use once functions are switched over to read them.
 */

type Editable = Pick<Brand,
  'display_name' | 'team_name' | 'sms_signature' | 'email_signature' | 'ad_disclosure' |
  'website_url' | 'sending_email' | 'sms_from_number' | 'logo_url' | 'primary_color' | 'initials' | 'status'
> & { license_states_text: string };

interface MemberRow { id: string; license_state: string; license_number: string | null; status: string;
  team_agents: { full_name: string } | null }

const FIELDS: { key: keyof Editable; label: string; hint?: string; multiline?: boolean }[] = [
  { key: 'display_name', label: 'Display name', hint: 'Shown in the switcher and on ads' },
  { key: 'team_name', label: 'Team name' },
  { key: 'sms_signature', label: 'Text signature', hint: 'Appended to texts, e.g. "— MVP Team @ Highline Residential"' },
  { key: 'email_signature', label: 'Email signature', multiline: true },
  { key: 'ad_disclosure', label: 'Brokerage disclosure', hint: 'Used on ads and reply drafts', multiline: true },
  { key: 'license_states_text', label: 'License states', hint: 'Comma-separated, e.g. NY, NJ' },
  { key: 'website_url', label: 'Website' },
  { key: 'sending_email', label: 'Sending email' },
  { key: 'sms_from_number', label: 'Texting number', hint: 'Blank = shared InRange number' },
  { key: 'logo_url', label: 'Logo URL' },
  { key: 'primary_color', label: 'Brand color', hint: 'Hex, e.g. #0F766E' },
  { key: 'initials', label: 'Initials', hint: 'Shown in the brand badge' },
];

function toEditable(b: Brand): Editable {
  return {
    display_name: b.display_name, team_name: b.team_name, sms_signature: b.sms_signature,
    email_signature: b.email_signature, ad_disclosure: b.ad_disclosure, website_url: b.website_url,
    sending_email: b.sending_email, sms_from_number: b.sms_from_number, logo_url: b.logo_url,
    primary_color: b.primary_color, initials: b.initials, status: b.status,
    license_states_text: b.license_states.join(', '),
  };
}

function BrandCard({ brand }: { brand: Brand }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Editable>(() => toEditable(brand));
  const [saved, setSaved] = useState(false);
  useEffect(() => setForm(toEditable(brand)), [brand]);

  const { data: members = [] } = useQuery({
    queryKey: ['brand-members', brand.id],
    queryFn: async (): Promise<MemberRow[]> => {
      const { data, error } = await inrange
        .from('brand_members' as never)
        .select('id, license_state, license_number, status, team_agents(full_name)')
        .eq('brand_id', brand.id);
      if (error) return [];
      return (data ?? []) as unknown as MemberRow[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { license_states_text, ...rest } = form;
      const clean = Object.fromEntries(
        Object.entries(rest).map(([k, v]) => [k, typeof v === 'string' && v.trim() === '' && k !== 'status' ? null : v]),
      );
      const payload = {
        ...clean,
        display_name: form.display_name.trim(),
        sms_signature: form.sms_signature.trim(),
        initials: (form.initials || 'IR').trim().slice(0, 4),
        license_states: license_states_text.split(',').map((s) => s.trim().toUpperCase()).filter((s) => /^[A-Z]{2}$/.test(s)),
        updated_at: new Date().toISOString(),
      };
      const { error } = await inrange.from('brands' as never).update(payload as never).eq('id', brand.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });

  const set = (k: keyof Editable, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const invalid = !form.display_name.trim() || !form.sms_signature.trim() ||
    (!!form.primary_color && !/^#[0-9A-Fa-f]{6}$/.test(form.primary_color));

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-md flex items-center justify-center shrink-0"
             style={{ backgroundColor: form.primary_color || '#334155' }}>
          <span className="text-white text-[10px] font-black">{form.initials || 'IR'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white">{brand.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Code: {brand.slug}</p>
        </div>
        <select value={form.status} onChange={(e) => set('status', e.target.value)}
                className="text-xs rounded-full border px-3 py-1 bg-transparent">
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className={`block ${f.multiline ? 'sm:col-span-2' : ''}`}>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{f.label}</span>
            {f.multiline ? (
              <textarea rows={2} value={(form[f.key] as string) ?? ''} onChange={(e) => set(f.key, e.target.value)}
                        className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm" />
            ) : (
              <input value={(form[f.key] as string) ?? ''} onChange={(e) => set(f.key, e.target.value)}
                     className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm" />
            )}
            {f.hint && <span className="text-[11px] text-gray-400">{f.hint}</span>}
          </label>
        ))}
      </div>

      <div>
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Agents under this brand</p>
        {members.length === 0 ? (
          <p className="text-xs text-gray-400">None yet. Agents are added as they get InRange logins.</p>
        ) : (
          <ul className="text-sm text-gray-800 dark:text-gray-200 space-y-0.5">
            {members.map((m) => (
              <li key={m.id}>{m.team_agents?.full_name ?? 'Unknown'} · {m.license_state}{m.status !== 'active' ? ' (inactive)' : ''}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {save.isError && <span className="text-xs text-red-600">Could not save</span>}
        {saved && <span className="text-xs text-green-600">Saved</span>}
        <button onClick={() => save.mutate()} disabled={save.isPending || invalid}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium disabled:opacity-50">
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
      </div>
    </div>
  );
}

export default function Brands() {
  const navigate = useNavigate();
  const { isBroker, isLoading: agentLoading } = useCurrentTeamAgent();
  const { brands, isLoading } = useBrand();

  if (agentLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isBroker) {
    return (
      <div className="p-6 text-center min-h-screen flex flex-col items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
        <p className="text-sm text-gray-700 dark:text-gray-300">Brand profiles are available to brokers only.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 dark:text-gray-400 p-1 -ml-1" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1">Brands</h1>
      </div>
      <div className="px-4 py-4 space-y-4 max-w-4xl">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Every brand runs on the same InRange lead engine. Only the branding differs.
        </p>
        {brands.map((b) => <BrandCard key={b.id} brand={b} />)}
      </div>
    </div>
  );
}
