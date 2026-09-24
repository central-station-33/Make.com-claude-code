import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { SMSInput } from "./SMSInput";
import { SMSList } from "./SMSList";
import { ConsentCapture } from "./ConsentCapture";
import { useSMSMessaging } from "@/hooks/messaging/useSMSMessaging";

interface SMSMessagingProps {
  leadId: string;
}

export const SMSMessaging = ({ leadId }: SMSMessagingProps) => {
  const {
    messages, isLoading, sendMessage, leadPhone, smsConsent, smsOptOut,
    consentSource, consentCapturedAt, recordConsent, isRecordingConsent,
  } = useSMSMessaging(leadId);

  const canRecordConsent = !!leadPhone && !smsOptOut && !smsConsent;

  const blockReason = !leadPhone
    ? 'No phone number on file for this lead.'
    : smsOptOut
    ? 'This lead has opted out of SMS.'
    : !smsConsent
    ? null // handled by the consent-capture form below instead of a plain block message
    : null;

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-1">SMS Messages</h3>
      {leadPhone && <p className="text-xs text-muted-foreground mb-1">To: {leadPhone}</p>}
      {smsConsent && consentSource && (
        <p className="text-xs text-muted-foreground mb-4">
          Consent: {consentSource}
          {consentCapturedAt && ` · ${new Date(consentCapturedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}`}
        </p>
      )}
      <div className="space-y-4">
        <SMSList messages={messages} isLoading={isLoading} />

        {blockReason && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{blockReason}</span>
          </div>
        )}

        {canRecordConsent && (
          <ConsentCapture onRecord={recordConsent} disabled={isRecordingConsent} />
        )}

        {leadPhone && !smsOptOut && smsConsent && (
          <SMSInput onSend={sendMessage} disabled={isLoading} />
        )}
      </div>
    </Card>
  );
};
