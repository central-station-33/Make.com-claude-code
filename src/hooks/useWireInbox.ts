import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WireConversation, WireMessage, WireChannel } from '@/types/wire.types';

export type NewConversationData = {
  contact_id: string;
  channel: WireChannel;
  subject?: string;
};

export function useWireInbox() {
  const [conversations, setConversations] = useState<WireConversation[]>([]);
  const [messages, setMessages] = useState<WireMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const msgChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from('wire_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });
    if (!error) setConversations((data ?? []) as WireConversation[]);
    setLoadingConvs(false);
  }, []);

  useEffect(() => {
    fetchConversations();
    const channel = supabase
      .channel('wire_conversations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wire_conversations' }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from('wire_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (!error) setMessages((data ?? []) as WireMessage[]);
    setLoadingMsgs(false);
  }, []);

  useEffect(() => {
    if (msgChannelRef.current) {
      supabase.removeChannel(msgChannelRef.current);
      msgChannelRef.current = null;
    }
    if (!selectedId) { setMessages([]); return; }

    setLoadingMsgs(true);
    fetchMessages(selectedId);

    const ch = supabase
      .channel(`wire_messages_${selectedId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wire_messages',
        filter: `conversation_id=eq.${selectedId}`,
      }, () => {
        fetchMessages(selectedId);
      })
      .subscribe();
    msgChannelRef.current = ch;

    return () => {
      if (msgChannelRef.current) {
        supabase.removeChannel(msgChannelRef.current);
        msgChannelRef.current = null;
      }
    };
  }, [selectedId, fetchMessages]);

  const selectConversation = useCallback(async (conv: WireConversation) => {
    setSelectedId(conv.id);
    if (conv.unread_count > 0) {
      await supabase
        .from('wire_conversations')
        .update({ unread_count: 0, status: conv.status === 'unread' ? 'open' : conv.status })
        .eq('id', conv.id);
    }
  }, []);

  const sendMessage = useCallback(async (body: string) => {
    if (!selectedId || !body.trim()) return;
    const conv = conversations.find((c) => c.id === selectedId);
    if (!conv) return;

    setSending(true);
    try {
      const now = new Date().toISOString();

      const { data: msgRow, error: msgErr } = await supabase
        .from('wire_messages')
        .insert({
          conversation_id: selectedId,
          direction: 'outbound',
          channel: conv.channel,
          body: body.trim(),
          status: 'pending',
        })
        .select()
        .single();

      if (msgErr) throw new Error(msgErr.message);

      await supabase
        .from('wire_conversations')
        .update({ last_message: body.trim(), last_message_at: now, updated_at: now, status: 'open' })
        .eq('id', selectedId);

      if (conv.channel === 'sms') {
        const { data: contact } = await supabase
          .from('wire_contacts')
          .select('phone')
          .eq('id', conv.contact_id)
          .single();

        if (contact?.phone) {
          await supabase.functions.invoke('send-sms', {
            body: { id: msgRow.id, message: body.trim(), recipient_phone: contact.phone },
          });
        }
      }

      await supabase.from('wire_messages').update({ status: 'sent' }).eq('id', msgRow.id);
    } finally {
      setSending(false);
    }
  }, [selectedId, conversations]);

  const startConversation = useCallback(async (data: NewConversationData): Promise<string> => {
    const now = new Date().toISOString();
    const { data: row, error: err } = await supabase
      .from('wire_conversations')
      .insert({
        contact_id: data.contact_id,
        channel: data.channel,
        subject: data.subject ?? null,
        status: 'open',
        unread_count: 0,
        last_message_at: now,
      })
      .select()
      .single();
    if (err) throw new Error(err.message);
    setSelectedId(row.id);
    return row.id;
  }, []);

  const closeConversation = useCallback(async (id: string) => {
    await supabase
      .from('wire_conversations')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', id);
  }, []);

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;
  const unreadTotal = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return {
    conversations,
    messages,
    selectedConversation,
    selectedId,
    loadingConvs,
    loadingMsgs,
    sending,
    unreadTotal,
    selectConversation,
    sendMessage,
    startConversation,
    closeConversation,
    setSelectedId,
  };
}
