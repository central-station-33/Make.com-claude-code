import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { SMSInput } from "./SMSInput";
import { SMSList } from "./SMSList";
import { useSMSMessaging } from "@/hooks/messaging/useSMSMessaging";

interface SMSMessagingProps {
  leadId: string;
}

export const SMSMessaging = ({ leadId }: SMSMessagingProps) => {
  const { messages, isLoading, sendMessage, leadPhone, smsConsent, smsOptOut } = useSMSMessaging(leadId);

  const blockReason = !leadPhone
    ? 'No phone number on file for this lead.'
    : smsOptOut
    ? 'This lead has opted out of SMS.'
    : !smsConsent
    ? 'No SMS consent on file for this lead -- sending is disabled.'
    : null;

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-1">SMS Messages</h3>
      {leadPhone && <p className="text-xs text-muted-foreground mb-4">To: {leadPhone}</p>}
      <div className="space-y-4">
        <SMSList messages={messages} isLoading={isLoading} />
        {blockReason ? (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{blockReason}</span>
          </div>
        ) : (
          <SMSInput onSend={sendMessage} disabled={isLoading} />
        )}
      </div>
    </Card>
  );
};
