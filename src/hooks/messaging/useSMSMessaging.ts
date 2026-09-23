import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SMSTouch {
  id: string;
  message: string;
  status: 'sent' | 'failed';
  touched_at: string;
  isa_name: string | null;
}

interface LeadSmsInfo {
  phone: string | null;
  sms_consent: boolean | null;
  sms_opt_out: boolean | null;
}

interface LeadTouchRow {
  id: string;
  notes: string | null;
  touched_at: string;
  isa_name: string | null;
}

// send-sms always writes notes as either `SMS sent: "<message>" (Twilio <sid>)`
// or `SMS failed: "<message>" -- <reason>`. Parse that back out for display
// instead of adding dedicated columns to a table shared with call/email/dm touches.
function parseTouch(row: LeadTouchRow): SMSTouch {
  const notes = row.notes ?? '';
  const failed = notes.startsWith('SMS failed');
  const match = notes.match(/"([\s\S]*)"/);
  return {
    id: row.id,
    message: match ? match[1] : notes,
    status: failed ? 'failed' : 'sent',
    touched_at: row.touched_at,
    isa_name: row.isa_name,
  };
}

export const useSMSMessaging = (leadId: string) => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leadInfo } = useQuery({
    queryKey: ['smsLeadInfo', leadId],
    queryFn: async (): Promise<LeadSmsInfo | null> => {
      const { data, error } = await supabase
        .from('isa_leads')
        .select('phone, sms_consent, sms_opt_out')
        .eq('id', leadId)
        .maybeSingle();
      if (error) throw error;
      return data as LeadSmsInfo | null;
    },
    enabled: !!leadId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['smsMessages', leadId],
    queryFn: async (): Promise<SMSTouch[]> => {
      const { data, error } = await supabase
        .from('lead_touches')
        .select('id, notes, touched_at, isa_name')
        .eq('lead_id', leadId)
        .eq('channel', 'sms')
        .order('touched_at', { ascending: false });

      if (error) {
        console.error('Error fetching SMS touches:', error);
        throw error;
      }
      return (data as LeadTouchRow[] ?? []).map(parseTouch);
    },
    enabled: !!leadId,
  });

  const sendMessage = async (message: string) => {
    if (!message.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Message is required' });
      return;
    }

    try {
      setIsSending(true);

      const { error } = await supabase.functions.invoke('send-sms', {
        body: { lead_id: leadId, message },
      });

      if (error) throw error;

      toast({
        title: 'Message sent',
        description: 'Your text has been sent.',
      });

      queryClient.invalidateQueries({ queryKey: ['smsMessages', leadId] });
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send message',
      });
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    isLoading: isSending || messagesLoading,
    sendMessage,
    leadPhone: leadInfo?.phone ?? null,
    smsConsent: leadInfo?.sms_consent ?? null,
    smsOptOut: leadInfo?.sms_opt_out ?? false,
  };
};
