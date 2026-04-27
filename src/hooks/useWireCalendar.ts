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
import type { WireAppointment } from '@/types/wire.types';

export type AppointmentFormData = {
  title: string;
  contact_id: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: WireAppointment['status'];
  assigned_to?: string;
  location?: string;
  meeting_link?: string;
};

function docToAppointment(id: string, data: DocumentData): WireAppointment {
  return {
    id,
    contact_id: data.contact_id ?? '',
    title: data.title ?? '',
    description: data.description ?? undefined,
    start_time: data.start_time?.toDate?.()?.toISOString() ?? data.start_time ?? new Date().toISOString(),
    end_time: data.end_time?.toDate?.()?.toISOString() ?? data.end_time ?? new Date().toISOString(),
    status: data.status ?? 'scheduled',
    assigned_to: data.assigned_to ?? undefined,
    location: data.location ?? undefined,
    meeting_link: data.meeting_link ?? undefined,
    created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  };
}

export function useWireCalendar() {
  const [appointments, setAppointments] = useState<WireAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'wire_appointments'), orderBy('start_time', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAppointments(snap.docs.map((d) => docToAppointment(d.id, d.data())));
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );
    return unsub;
  }, []);

  const addAppointment = useCallback(async (data: AppointmentFormData): Promise<void> => {
    await addDoc(collection(db, 'wire_appointments'), {
      ...data,
      start_time: new Date(data.start_time),
      end_time: new Date(data.end_time),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }, []);

  const updateAppointment = useCallback(async (id: string, data: Partial<AppointmentFormData>): Promise<void> => {
    const payload: Record<string, unknown> = { ...data, updated_at: serverTimestamp() };
    if (data.start_time) payload.start_time = new Date(data.start_time);
    if (data.end_time) payload.end_time = new Date(data.end_time);
    await updateDoc(doc(db, 'wire_appointments', id), payload);
  }, []);

  const updateStatus = useCallback(async (id: string, status: WireAppointment['status']): Promise<void> => {
    await updateDoc(doc(db, 'wire_appointments', id), { status, updated_at: serverTimestamp() });
  }, []);

  const deleteAppointment = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'wire_appointments', id));
  }, []);

  return { appointments, loading, error, addAppointment, updateAppointment, updateStatus, deleteAppointment };
}
