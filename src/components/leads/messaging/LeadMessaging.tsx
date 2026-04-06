
import { Card } from "@/components/ui/card";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { LeadMessagingProps } from "@/types/messaging.types";
import { useLeadMessaging } from "@/hooks/messaging/useLeadMessaging";
import { useMessageSender } from "@/hooks/messaging/useMessageSender";

export const LeadMessaging = ({ leadId }: LeadMessagingProps) => {
  const { messages, isLoading, error, typingUsers, currentUser } = useLeadMessaging(leadId);
  const { handleSend, handleTyping } = useMessageSender(leadId, currentUser);

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-red-500">Error loading messages: {error.message}</div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Messages</h3>
      <MessageList messages={messages} isLoading={isLoading} />
      {typingUsers.size > 0 && (
        <div className="text-sm text-muted-foreground mb-2">
          {Array.from(typingUsers).join(", ")} typing...
        </div>
      )}
      <MessageInput
        onSend={handleSend}
        onTypingStart={() => handleTyping(true)}
        onTypingStop={() => handleTyping(false)}
      />
    </Card>
  );
};
