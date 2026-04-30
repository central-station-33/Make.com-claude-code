import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WireAutomation, WireAutomationStatus } from '@/types/wire.types';

export type AutomationFormData = {
  name: string;
  description?: string;
  status: WireAutomationStatus;
  trigger_type: string;
  steps: WireAutomation['steps'];
};

export const TRIGGER_TYPES = [
  { value: 'contact_created',       label: 'New Contact Added' },
  { value: 'contact_tag_added',     label: 'Tag Added to Contact' },
  { value: 'appointment_scheduled', label: 'Appointment Scheduled' },
  { value: 'opportunity_created',   label: 'New Deal Created' },
  { value: 'opportunity_won',       label: 'Deal Won / Closed' },
  { value: 'contact_inactive',      label: 'Contact Inactive (30 days)' },
  { value: 'campaign_clicked',      label: 'Campaign Link Clicked' },
];

export const ACTION_TEMPLATES = [
  { name: 'Send Welcome SMS',          type: 'action' as const, config: { channel: 'sms',   template: 'welcome_sms' } },
  { name: 'Send Welcome Email',        type: 'action' as const, config: { channel: 'email', template: 'welcome_email' } },
  { name: 'Send Follow-up SMS',        type: 'action' as const, config: { channel: 'sms',   template: 'followup_sms' } },
  { name: 'Send Appointment Reminder', type: 'action' as const, config: { channel: 'sms',   template: 'apt_reminder' } },
  { name: 'Send Review Request',       type: 'action' as const, config: { channel: 'sms',   template: 'review_request' } },
  { name: 'Tag Contact',               type: 'action' as const, config: { action: 'add_tag', tag: '' } },
  { name: 'Assign to Agent',           type: 'action' as const, config: { action: 'assign',  agent: '' } },
];

export function useWireAutomations() {
  const [automations, setAutomations] = useState<WireAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomations = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('wire_automations')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) { setError(err.message); } else { setAutomations((data ?? []) as WireAutomation[]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAutomations();
    const channel = supabase
      .channel('wire_automations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wire_automations' }, () => {
        fetchAutomations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAutomations]);

  const addAutomation = useCallback(async (data: AutomationFormData): Promise<void> => {
    const { error: err } = await supabase
      .from('wire_automations')
      .insert({ ...data, enrolled_count: 0, completed_count: 0 });
    if (err) throw new Error(err.message);
  }, []);

  const updateAutomation = useCallback(async (id: string, data: Partial<AutomationFormData>): Promise<void> => {
    const { error: err } = await supabase
      .from('wire_automations')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) throw new Error(err.message);
  }, []);

  const setStatus = useCallback(async (id: string, status: WireAutomationStatus): Promise<void> => {
    const { error: err } = await supabase
      .from('wire_automations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) throw new Error(err.message);
  }, []);

  const deleteAutomation = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('wire_automations').delete().eq('id', id);
    if (err) throw new Error(err.message);
  }, []);

  return { automations, loading, error, addAutomation, updateAutomation, setStatus, deleteAutomation };
}
