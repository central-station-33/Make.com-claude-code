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
import type { WireContact } from '@/types/wire.types';

export type ContactFormData = Omit<WireContact, 'id' | 'created_at' | 'updated_at' | 'last_activity'>;

function docToContact(id: string, data: DocumentData): WireContact {
  return {
    id,
    first_name: data.first_name ?? '',
    last_name: data.last_name ?? '',
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    address: data.address ?? undefined,
    city: data.city ?? undefined,
    state: data.state ?? undefined,
    zip: data.zip ?? undefined,
    tags: Array.isArray(data.tags) ? data.tags : [],
    source: data.source ?? undefined,
    assigned_to: data.assigned_to ?? undefined,
    do_not_contact: data.do_not_contact ?? false,
    notes: data.notes ?? undefined,
    created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    updated_at: data.updated_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    last_activity: data.last_activity?.toDate?.()?.toISOString() ?? undefined,
  };
}

export function useWireContacts() {
  const [contacts, setContacts] = useState<WireContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'wire_contacts'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setContacts(snap.docs.map((d) => docToContact(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const addContact = useCallback(async (data: ContactFormData): Promise<WireContact> => {
    const payload = {
      ...data,
      tags: data.tags ?? [],
      do_not_contact: data.do_not_contact ?? false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      last_activity: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'wire_contacts'), payload);
    return { ...data, id: ref.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  }, []);

  const updateContact = useCallback(async (id: string, data: Partial<ContactFormData>): Promise<void> => {
    await updateDoc(doc(db, 'wire_contacts', id), {
      ...data,
      updated_at: serverTimestamp(),
    });
  }, []);

  const deleteContact = useCallback(async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'wire_contacts', id));
  }, []);

  return { contacts, loading, error, addContact, updateContact, deleteContact };
}
