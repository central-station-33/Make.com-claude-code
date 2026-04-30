import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export function useWireCampaigns() {
  const [campaigns, setCampaigns] = useState<WireCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('wire_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) { setError(err.message); } else { setCampaigns((data ?? []) as WireCampaign[]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCampaigns();
    const channel = supabase
      .channel('wire_campaigns_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wire_campaigns' }, () => {
        fetchCampaigns();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchCampaigns]);

  const addCampaign = useCallback(async (data: CampaignFormData): Promise<void> => {
    const { recipient_tags: _tags, ...rest } = data;
    const { error: err } = await supabase
      .from('wire_campaigns')
      .insert({ ...rest, recipient_count: 0, sent_count: 0, open_count: 0, click_count: 0 });
    if (err) throw new Error(err.message);
  }, []);

  const updateCampaign = useCallback(async (id: string, data: Partial<CampaignFormData>): Promise<void> => {
    const { recipient_tags: _tags, ...rest } = data;
    const { error: err } = await supabase.from('wire_campaigns').update(rest).eq('id', id);
    if (err) throw new Error(err.message);
  }, []);

  const deleteCampaign = useCallback(async (id: string): Promise<void> => {
    const { error: err } = await supabase.from('wire_campaigns').delete().eq('id', id);
    if (err) throw new Error(err.message);
  }, []);

  const duplicateCampaign = useCallback(async (campaign: WireCampaign): Promise<void> => {
    const { error: err } = await supabase.from('wire_campaigns').insert({
      name: `${campaign.name} (Copy)`,
      type: campaign.type,
      status: 'draft',
      subject: campaign.subject,
      body: campaign.body,
      recipient_count: 0,
      sent_count: 0,
      open_count: 0,
      click_count: 0,
    });
    if (err) throw new Error(err.message);
  }, []);

  return { campaigns, loading, error, addCampaign, updateCampaign, deleteCampaign, duplicateCampaign };
}
