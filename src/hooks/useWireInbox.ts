import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/integrations/firebase/config';
import app from '@/integrations/firebase/config';
import type { WireConversation, WireMessage, WireChannel } from '@/types/wire.types';

const fns = getFunctions(app);

function docToConversation(id: string, data: DocumentData): WireConversation {
  return {
    id,
    contact_id: data.contact_id ?? '',
    channel: data.channel ?? 'sms',
    status: data.status ?? 'open',
    subject: data.subject ?? undefined,
    last_message: data.last_message ?? undefined,
    last_message_at: data.last_message_at?.toDate?.()?.toISOString() ?? undefined,
    assigned_to: data.assigned_to ?? undefined,
    unread_count: data.unread_count ?? 0,
    created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    updated_at: data.updated_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  };
}

function docToMessage(id: string, data: DocumentData): WireMessage {
  return {
    id,
    conversation_id: data.conversation_id ?? '',
    direction: data.direction ?? 'outbound',
    channel: data.channel ?? 'sms',
    body: data.body ?? '',
    from: data.from ?? undefined,
    to: data.to ?? undefined,
    status: data.status ?? 'sent',
    created_at: data.created_at?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  };
}

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
  const msgUnsubRef = useRef<(() => void) | null>(null);

  // Subscribe to all conversations ordered by last activity
  useEffect(() => {
    const q = query(
      collection(db, 'wire_conversations'),
      orderBy('last_message_at', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setConversations(snap.docs.map((d) => docToConversation(d.id, d.data())));
      setLoadingConvs(false);
    }, () => setLoadingConvs(false));
    return unsub;
  }, []);

  // Subscribe to messages for selected conversation
  useEffect(() => {
    if (msgUnsubRef.current) { msgUnsubRef.current(); msgUnsubRef.current = null; }
    if (!selectedId) { setMessages([]); return; }

    setLoadingMsgs(true);
    const q = query(
      collection(db, 'wire_messages'),
      where('conversation_id', '==', selectedId),
      orderBy('created_at', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => docToMessage(d.id, d.data())));
      setLoadingMsgs(false);
    }, () => setLoadingMsgs(false));
    msgUnsubRef.current = unsub;
    return () => { if (msgUnsubRef.current) msgUnsubRef.current(); };
  }, [selectedId]);

  const selectConversation = useCallback(async (conv: WireConversation) => {
    setSelectedId(conv.id);
    // Mark as read
    if (conv.unread_count > 0) {
      await updateDoc(doc(db, 'wire_conversations', conv.id), {
        unread_count: 0,
        status: conv.status === 'unread' ? 'open' : conv.status,
      });
    }
  }, []);

  const sendMessage = useCallback(async (body: string) => {
    if (!selectedId || !body.trim()) return;
    const conv = conversations.find((c) => c.id === selectedId);
    if (!conv) return;

    setSending(true);
    try {
      if (conv.channel === 'sms') {
        // Route through Cloud Function → Twilio for real delivery
        const callSendSms = httpsCallable(fns, 'sendSms');
        await callSendSms({ conversationId: selectedId, body: body.trim() });
      } else if (conv.channel === 'email') {
        // Route through Cloud Function → SendGrid for real delivery
        const callSendEmail = httpsCallable(fns, 'sendEmail');
        await callSendEmail({ conversationId: selectedId, body: body.trim() });
      } else {
        // Note / other channel — write directly to Firestore
        await addDoc(collection(db, 'wire_messages'), {
          conversation_id: selectedId,
          direction: 'outbound',
          channel: conv.channel,
          body: body.trim(),
          status: 'sent',
          created_at: serverTimestamp(),
        });
        await updateDoc(doc(db, 'wire_conversations', selectedId), {
          last_message: body.trim(),
          last_message_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          status: 'open',
        });
      }
    } finally {
      setSending(false);
    }
  }, [selectedId, conversations]);

  const startConversation = useCallback(async (data: NewConversationData): Promise<string> => {
    const ref = await addDoc(collection(db, 'wire_conversations'), {
      contact_id: data.contact_id,
      channel: data.channel,
      subject: data.subject ?? null,
      status: 'open',
      unread_count: 0,
      last_message_at: serverTimestamp(),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    setSelectedId(ref.id);
    return ref.id;
  }, []);

  const closeConversation = useCallback(async (id: string) => {
    await updateDoc(doc(db, 'wire_conversations', id), {
      status: 'closed',
      updated_at: serverTimestamp(),
    });
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
