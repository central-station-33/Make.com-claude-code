import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/config';
import type { WireAutomation, WireAutomationStep, WireAutomationStatus } from '@/types/wire.types';

export type AutomationFormData = {
  name: string;
  description?: string;
  status: WireAutomationStatus;
  trigger_type: string;
  steps: WireAutomationStep[];
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
  { name: 'Send Welcome SMS',         type: 'action' as const, config: { channel: 'sms', template: 'welcome_sms' } },
  { name: 'Send Welcome Email',       type: 'action' as const, config: { channel: 'email', template: 'welcome_email' } },
  { name: 'Send Follow-up SMS',       type: 'action' as const, config: { channel: 'sms', template: 'followup_sms' } },
  { name: 'Send Appointment Reminder', type: 'action' as const, config: { channel: 'sms', template: 'apt_reminder' } },
  { name: 'Send Review Request',      type: 'action' as const, config: { channel: 'sms', template: 'review_request' } },
  { name: 'Tag Contact',              type: 'action' as const, config: { action: 'add_tag', tag: '' } },
  { name: 'Assign to Agent',          type: 'action' as const, config: { action: 'assign', agent: '' } },
];

function docToAutomation(id: string, data: DocumentData): WireAutomation {
  return {
    id,
    name: data.name ?? '',
    description: data.description ?? undefined,
    status: data.status ?? 'draft',
    trigger_type: data.trigger_type ?? 'contact_created',
    steps: Array.isArray(data.steps) ? data.steps : [],
    enrolled_count: data.enrolled_count ?? 0,
    completed_count: data.completed_count ?? 0,
    created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    updated_at: data.updated_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  };
}

export function useWireAutomations() {
  const [automations, setAutomations] = useState<WireAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'wire_automations'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAutomations(snap.docs.map((d) => docToAutomation(d.id, d.data())));
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
    return unsub;
  }, []);

  const addAutomation = useCallback(async (data: AutomationFormData): Promise<void> => {
    await addDoc(collection(db, 'wire_automations'), {
      ...data,
      enrolled_count: 0,
      completed_count: 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }, []);

  const updateAutomation = useCallback(async (id: string, data: Partial<AutomationFormData>): Promise<void> => {
    await updateDoc(doc(db, 'wire_automations', id), { ...data, updated_at: serverTimestamp() });
  }, []);

  const setStatus = useCallback(async (id: string, status: WireAutomationStatus): Promise<void> => {
    await updateDoc(doc(db, 'wire_automations', id), { status, updated_at: serverTimestamp() });
  }, []);

  const deleteAutomation = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'wire_automations', id));
  }, []);

  return { automations, loading, error, addAutomation, updateAutomation, setStatus, deleteAutomation };
}
