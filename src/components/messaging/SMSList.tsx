import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { SMSTouch } from "@/hooks/messaging/useSMSMessaging";

interface SMSListProps {
  messages: SMSTouch[];
  isLoading: boolean;
}

export const SMSList = ({ messages, isLoading }: SMSListProps) => {
  if (isLoading) {
    return <div>Loading messages...</div>;
  }

  if (!messages.length) {
    return <div className="text-center py-4 text-muted-foreground">No messages yet</div>;
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {messages.map((message) => (
          <Card key={message.id} className="p-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="text-sm">{message.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(message.touched_at), 'MMM dd, yyyy HH:mm')}
                  {message.isa_name ? ` · ${message.isa_name}` : ''}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                message.status === 'sent' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
              }`}>
                {message.status}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};
