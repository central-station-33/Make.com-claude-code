import { format } from "date-fns";
import { MessageBubbleProps } from "@/types/messaging.types";

export const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  const bubbleClass = isOwn
    ? "bg-primary text-primary-foreground ml-auto"
    : "bg-muted";

  const renderContent = () => {
    if (message.metadata?.fileUrl) {
      if (message.metadata.fileType?.startsWith('image/')) {
        return (
          <img 
            src={message.metadata.fileUrl} 
            alt={message.metadata.fileName || 'Attached image'} 
            className="max-w-[200px] rounded"
          />
        );
      }
      return (
        <a 
          href={message.metadata.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {message.metadata.fileName || 'Download attachment'}
        </a>
      );
    }
    return message.message;
  };

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
      <div className={`p-3 rounded-lg max-w-[70%] break-words ${bubbleClass}`}>
        {renderContent()}
      </div>
      <span className="text-xs text-muted-foreground mt-1">
        {format(new Date(message.sent_at), 'HH:mm')}
      </span>
    </div>
  );
};