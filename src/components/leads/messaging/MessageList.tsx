import { useState, useEffect } from 'react';
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageGroup } from "./MessageGroup";
import { supabase } from "@/integrations/supabase/client";
import { Message, MessageListProps } from "@/types/messaging.types";

export const MessageList = ({ messages = [], isLoading }: MessageListProps) => {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  if (!messages?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No messages yet
      </div>
    );
  }

  const messagesByDate = messages.reduce((acc: Record<string, Message[]>, message) => {
    const date = format(new Date(message.sent_at), 'MMM dd, yyyy');
    if (!acc[date]) acc[date] = [];
    acc[date].push(message);
    return acc;
  }, {});

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-6 p-4">
        {Object.entries(messagesByDate).map(([date, messages]) => (
          <MessageGroup 
            key={date} 
            date={date} 
            messages={messages}
            currentUserId={currentUser?.id}
          />
        ))}
      </div>
    </ScrollArea>
  );
};