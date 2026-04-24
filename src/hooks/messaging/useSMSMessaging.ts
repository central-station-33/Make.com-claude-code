
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, sendMagicLink, signOut as firebaseSignOut } from '@/integrations/firebase/authHelpers';
import { useToast } from '@/hooks/use-toast';
import { SMSMessage } from '@/types/messaging.types';

export const useSMSMessaging = (leadId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['smsMessages', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('text_messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching SMS messages:', error);
        throw error;
      }
      return data as SMSMessage[];
    },
  });

  const sendMessage = async (message: string, phoneNumber: string) => {
    if (!message.trim() || !phoneNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Message and phone number are required",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // First create the message record
      const { data: messageData, error: insertError } = await supabase
        .from('text_messages')
        .insert({
          lead_id: leadId,
          sender_id: getCurrentUser()?.uid,
          message,
          status: 'pending',
          metadata: { recipient_phone: phoneNumber }
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call the Edge Function to send the SMS
      const { error: sendError } = await supabase.functions.invoke('send-sms', {
        body: {
          id: messageData.id,
          message,
          recipient_phone: phoneNumber,
        },
      });

      if (sendError) throw sendError;

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });

      // Refresh the messages list
      queryClient.invalidateQueries({ queryKey: ['smsMessages', leadId] });

    } catch (error: any) {
      console.error('Error sending SMS:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send message",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage
  };
};
