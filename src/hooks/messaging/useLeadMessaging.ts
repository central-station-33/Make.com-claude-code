
import { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Message, TypingStatus } from "@/types/messaging.types";
import { RealtimeChannel } from "@supabase/supabase-js";

export const useLeadMessaging = (leadId: string) => {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  const { data: messages, refetch, isLoading, error } = useQuery({
    queryKey: ["leadMessages", leadId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("lead_messages")
        .select("*")
        .eq("lead_id", leadId)
        .order("sent_at", { ascending: true });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error loading messages",
          description: error.message,
        });
        throw error;
      }
      
      return (data || []).map((msg): Message => ({
        id: msg.id,
        message: msg.message,
        sent_at: msg.sent_at,
        sender_id: msg.sender_id,
        delivered_at: msg.delivered_at,
        read_at: msg.read_at,
        metadata: msg.metadata as Message['metadata'],
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        lead_id: msg.lead_id,
        status: msg.status
      }));
    },
  });

  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      channel = supabase.channel(`lead_messages:${leadId}`);
      
      channel
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'lead_messages',
            filter: `lead_id=eq.${leadId}`,
          },
          () => {
            refetch();
          }
        )
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel?.presenceState() || {};
          const typingUserIds = new Set(
            Object.values(presenceState)
              .flat()
              .filter((presence: any) => presence.typing)
              .map((presence: any) => presence.user_id)
          );
          setTypingUsers(typingUserIds);
        })
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [leadId, refetch]);

  return {
    messages,
    isLoading,
    error,
    typingUsers,
    currentUser
  };
};
