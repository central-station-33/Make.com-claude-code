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
import type { WireCampaign } from '@/types/wire.types';

export type CampaignFormData = {
  name: string;
  type: 'email' | 'sms';
  status: WireCampaign['status'];
  subject?: string;
  body: string;
  recipient_tags: string[];
  scheduled_at?: string;
};

function docToCampaign(id: string, data: DocumentData): WireCampaign {
  return {
    id,
    name: data.name ?? '',
    type: data.type ?? 'email',
    status: data.status ?? 'draft',
    subject: data.subject ?? undefined,
    body: data.body ?? '',
    recipient_count: data.recipient_count ?? 0,
    sent_count: data.sent_count ?? 0,
    open_count: data.open_count ?? 0,
    click_count: data.click_count ?? 0,
    scheduled_at: data.scheduled_at ?? undefined,
    sent_at: data.sent_at ?? undefined,
    created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  };
}

export function useWireCampaigns() {
  const [campaigns, setCampaigns] = useState<WireCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'wire_campaigns'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setCampaigns(snap.docs.map((d) => docToCampaign(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const addCampaign = useCallback(async (data: CampaignFormData): Promise<void> => {
    await addDoc(collection(db, 'wire_campaigns'), {
      ...data,
      recipient_count: 0,
      sent_count: 0,
      open_count: 0,
      click_count: 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }, []);

  const updateCampaign = useCallback(async (id: string, data: Partial<CampaignFormData>): Promise<void> => {
    await updateDoc(doc(db, 'wire_campaigns', id), {
      ...data,
      updated_at: serverTimestamp(),
    });
  }, []);

  const deleteCampaign = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'wire_campaigns', id));
  }, []);

  const duplicateCampaign = useCallback(async (campaign: WireCampaign): Promise<void> => {
    await addDoc(collection(db, 'wire_campaigns'), {
      name: `${campaign.name} (Copy)`,
      type: campaign.type,
      status: 'draft',
      subject: campaign.subject,
      body: campaign.body,
      recipient_count: 0,
      sent_count: 0,
      open_count: 0,
      click_count: 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }, []);

  return { campaigns, loading, error, addCampaign, updateCampaign, deleteCampaign, duplicateCampaign };
}
