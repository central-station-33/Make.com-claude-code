
import { Card } from "@/components/ui/card";
import { SMSInput } from "./SMSInput";
import { SMSList } from "./SMSList";
import { useSMSMessaging } from "@/hooks/messaging/useSMSMessaging";

interface SMSMessagingProps {
  leadId: string;
  recipientPhone?: string;
}

export const SMSMessaging = ({ leadId, recipientPhone }: SMSMessagingProps) => {
  const { messages, isLoading, sendMessage } = useSMSMessaging(leadId);

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">SMS Messages</h3>
      <div className="space-y-4">
        <SMSList messages={messages} isLoading={isLoading} />
        <SMSInput 
          onSend={sendMessage}
          recipientPhone={recipientPhone}
          disabled={isLoading}
        />
      </div>
    </Card>
  );
};
