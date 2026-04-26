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
import type { WireOpportunity, WireOpportunityStatus } from '@/types/wire.types';

export type DealFormData = {
  name: string;
  contact_id: string;
  contact_name?: string;
  pipeline_id: string;
  stage_id: string;
  value?: number;
  status: WireOpportunityStatus;
  assigned_to?: string;
  close_date?: string;
  notes?: string;
};

const DEFAULT_PIPELINE_ID = 'main';

export const DEFAULT_STAGES = [
  { id: 's1', pipeline_id: DEFAULT_PIPELINE_ID, name: 'New Lead',        position: 0, color: '#6B7280' },
  { id: 's2', pipeline_id: DEFAULT_PIPELINE_ID, name: 'Contacted',       position: 1, color: '#3B82F6' },
  { id: 's3', pipeline_id: DEFAULT_PIPELINE_ID, name: 'Appointment Set', position: 2, color: '#8B5CF6' },
  { id: 's4', pipeline_id: DEFAULT_PIPELINE_ID, name: 'Offer Made',      position: 3, color: '#F59E0B' },
  { id: 's5', pipeline_id: DEFAULT_PIPELINE_ID, name: 'Under Contract',  position: 4, color: '#10B981' },
  { id: 's6', pipeline_id: DEFAULT_PIPELINE_ID, name: 'Closed',          position: 5, color: '#EAB308' },
];

function docToOpportunity(id: string, data: DocumentData): WireOpportunity {
  return {
    id,
    pipeline_id: data.pipeline_id ?? DEFAULT_PIPELINE_ID,
    stage_id: data.stage_id ?? 's1',
    contact_id: data.contact_id ?? '',
    name: data.name ?? '',
    value: data.value ?? undefined,
    status: data.status ?? 'open',
    assigned_to: data.assigned_to ?? undefined,
    close_date: data.close_date ?? undefined,
    notes: data.notes ?? undefined,
    created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    updated_at: data.updated_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  };
}

export function useWirePipeline() {
  const [opportunities, setOpportunities] = useState<WireOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'wire_opportunities'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setOpportunities(snap.docs.map((d) => docToOpportunity(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const addDeal = useCallback(async (data: DealFormData): Promise<WireOpportunity> => {
    const payload = {
      ...data,
      pipeline_id: DEFAULT_PIPELINE_ID,
      status: 'open',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'wire_opportunities'), payload);
    return { ...data, id: ref.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  }, []);

  const updateDeal = useCallback(async (id: string, data: Partial<DealFormData>): Promise<void> => {
    await updateDoc(doc(db, 'wire_opportunities', id), {
      ...data,
      updated_at: serverTimestamp(),
    });
  }, []);

  const moveDeal = useCallback(async (id: string, stage_id: string): Promise<void> => {
    await updateDoc(doc(db, 'wire_opportunities', id), {
      stage_id,
      updated_at: serverTimestamp(),
    });
  }, []);

  const deleteDeal = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'wire_opportunities', id));
  }, []);

  return { opportunities, loading, error, addDeal, updateDeal, moveDeal, deleteDeal };
}
