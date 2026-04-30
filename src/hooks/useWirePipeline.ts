import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WireOpportunity, WirePipelineStage, WireOpportunityStatus } from '@/types/wire.types';

export type DealFormData = {
  name: string;
  contact_id: string;
  pipeline_id: string;
  stage_id: string;
  value?: number;
  status: WireOpportunityStatus;
  assigned_to?: string;
  close_date?: string;
  notes?: string;
};

// Fixed seeded pipeline ID from migration
export const DEFAULT_PIPELINE_ID = '00000000-0000-0000-0000-000000000001';

// Fallback display stages (used before DB stages load)
export const DEFAULT_STAGES: WirePipelineStage[] = [
  { id: '', pipeline_id: DEFAULT_PIPELINE_ID, name: 'New Lead',        position: 0, color: '#6B7280' },
  { id: '', pipeline_id: DEFAULT_PIPELINE_ID, name: 'Contacted',       position: 1, color: '#3B82F6' },
  { id: '', pipeline_id: DEFAULT_PIPELINE_ID, name: 'Appointment Set', position: 2, color: '#8B5CF6' },
  { id: '', pipeline_id: DEFAULT_PIPELINE_ID, name: 'Offer Made',      position: 3, color: '#F59E0B' },
  { id: '', pipeline_id: DEFAULT_PIPELINE_ID, name: 'Under Contract',  position: 4, color: '#10B981' },
  { id: '', pipeline_id: DEFAULT_PIPELINE_ID, name: 'Closed',          position: 5, color: '#EAB308' },
];

export function useWirePipeline() {
  const [opportunities, setOpportunities] = useState<WireOpportunity[]>([]);
  const [stages, setStages] = useState<WirePipelineStage[]>(DEFAULT_STAGES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [oppsRes, stagesRes] = await Promise.all([
      supabase
        .from('wire_opportunities')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('wire_pipeline_stages')
        .select('*')
        .eq('pipeline_id', DEFAULT_PIPELINE_ID)
        .order('position', { ascending: true }),
    ]);

    if (oppsRes.error) setError(oppsRes.error.message);
    else setOpportunities((oppsRes.data ?? []) as WireOpportunity[]);

    if (stagesRes.data && stagesRes.data.length > 0) {
      setStages(stagesRes.data as WirePipelineStage[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('wire_opportunities_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wire_opportunities' }, () => {
        fetchData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const addDeal = useCallback(async (data: DealFormData): Promise<WireOpportunity> => {
    const { data: row, error: err } = await supabase
      .from('wire_opportunities')
      .insert({ ...data, pipeline_id: DEFAULT_PIPELINE_ID, status: 'open' })
      .select()
      .single();
    if (err) throw new Error(err.message);
    return row as WireOpportunity;
  }, []);

  const updateDeal = useCallback(async (id: string, data: Partial<DealFormData>): Promise<void> => {
    const { error: err } = await supabase
      .from('wire_opportunities')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) throw new Error(err.message);
  }, []);

  const moveDeal = useCallback(async (id: string, stage_id: string): Promise<void> => {
    const { error: err } = await supabase
      .from('wire_opportunities')
      .update({ stage_id, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) throw new Error(err.message);
  }, []);

  const deleteDeal = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('wire_opportunities').delete().eq('id', id);
    if (err) throw new Error(err.message);
  }, []);

  return { opportunities, stages, loading, error, addDeal, updateDeal, moveDeal, deleteDeal };
}
