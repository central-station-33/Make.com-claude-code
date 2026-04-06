import { MessageGroupProps } from "@/types/messaging.types";
import { MessageBubble } from "./MessageBubble";

export const MessageGroup = ({ date, messages, currentUserId }: MessageGroupProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {date}
        </span>
      </div>
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwn={message.sender_id === currentUserId}
        />
      ))}
    </div>
  );
};