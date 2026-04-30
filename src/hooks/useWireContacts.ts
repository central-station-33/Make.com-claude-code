import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WireContact } from '@/types/wire.types';

export type ContactFormData = Omit<WireContact, 'id' | 'created_at' | 'updated_at' | 'last_activity'>;

export function useWireContacts() {
  const [contacts, setContacts] = useState<WireContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('wire_contacts')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) { setError(err.message); } else { setContacts((data ?? []) as WireContact[]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts();

    // Supabase Realtime subscription
    const channel = supabase
      .channel('wire_contacts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wire_contacts' }, () => {
        fetchContacts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchContacts]);

  const addContact = useCallback(async (data: ContactFormData): Promise<WireContact> => {
    const { data: row, error: err } = await supabase
      .from('wire_contacts')
      .insert({ ...data, last_activity: new Date().toISOString() })
      .select()
      .single();
    if (err) throw new Error(err.message);
    return row as WireContact;
  }, []);

  const updateContact = useCallback(async (id: string, data: Partial<ContactFormData>): Promise<void> => {
    const { error: err } = await supabase
      .from('wire_contacts')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) throw new Error(err.message);
  }, []);

  const deleteContact = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('wire_contacts').delete().eq('id', id);
    if (err) throw new Error(err.message);
  }, []);

  return { contacts, loading, error, addContact, updateContact, deleteContact };
}
