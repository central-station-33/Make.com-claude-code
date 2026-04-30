import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export function useWireCalendar() {
  const [appointments, setAppointments] = useState<WireAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('wire_appointments')
      .select('*')
      .order('start_time', { ascending: true });
    if (err) { setError(err.message); } else { setAppointments((data ?? []) as WireAppointment[]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAppointments();
    const channel = supabase
      .channel('wire_appointments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wire_appointments' }, () => {
        fetchAppointments();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAppointments]);

  const addAppointment = useCallback(async (data: AppointmentFormData): Promise<void> => {
    const { error: err } = await supabase.from('wire_appointments').insert(data);
    if (err) throw new Error(err.message);
  }, []);

  const updateAppointment = useCallback(async (id: string, data: Partial<AppointmentFormData>): Promise<void> => {
    const { error: err } = await supabase.from('wire_appointments').update(data).eq('id', id);
    if (err) throw new Error(err.message);
  }, []);

  const updateStatus = useCallback(async (id: string, status: WireAppointment['status']): Promise<void> => {
    const { error: err } = await supabase.from('wire_appointments').update({ status }).eq('id', id);
    if (err) throw new Error(err.message);
  }, []);

  const deleteAppointment = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('wire_appointments').delete().eq('id', id);
    if (err) throw new Error(err.message);
  }, []);

  return { appointments, loading, error, addAppointment, updateAppointment, updateStatus, deleteAppointment };
}
