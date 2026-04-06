
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { SMSListProps } from "@/types/messaging.types";

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
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm">{message.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(message.created_at!), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                message.status === 'delivered' ? 'bg-green-100 text-green-800' :
                message.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                message.status === 'failed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {message.status}
              </span>
            </div>
            {message.error_message && (
              <p className="text-xs text-red-500 mt-2">{message.error_message}</p>
            )}
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};
