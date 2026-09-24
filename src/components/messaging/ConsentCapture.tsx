import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ShieldCheck } from "lucide-react";

const CONSENT_SOURCE_OPTIONS = [
  "Verbal (phone call)",
  "Written (text/email reply)",
  "Web form",
  "Other",
] as const;

interface ConsentCaptureProps {
  onRecord: (source: string) => Promise<void>;
  disabled?: boolean;
}

// Agent-attested consent capture: the agent picks how consent was actually
// obtained (this brokerage currently uses a mix of verbal and written
// methods, not one single automated flow), and that gets stamped with a
// timestamp into isa_leads.consent_source / consent_captured_at. This is a
// record of an attestation, not proof by itself -- if this ever needs to
// hold up to a TCPA challenge, the underlying evidence (call recording,
// email, form submission) should also be kept wherever it already lives.
export const ConsentCapture = ({ onRecord, disabled = false }: ConsentCaptureProps) => {
  const [source, setSource] = useState<string>("");
  const [otherText, setOtherText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const finalSource = source === "Other" ? otherText.trim() : source;
  const canSubmit = !!finalSource && !disabled && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onRecord(finalSource);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-md border border-gray-200 dark:border-gray-800 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
        <ShieldCheck className="h-4 w-4 text-gray-500" />
        Record SMS consent
      </div>
      <p className="text-xs text-muted-foreground">
        Confirm how this lead agreed to receive texts before enabling SMS.
      </p>
      <Select value={source} onValueChange={setSource}>
        <SelectTrigger className="text-sm">
          <SelectValue placeholder="How was consent obtained?" />
        </SelectTrigger>
        <SelectContent>
          {CONSENT_SOURCE_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {source === "Other" && (
        <Input
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          placeholder="Describe how consent was obtained"
          className="text-sm"
        />
      )}
      <Button size="sm" className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
        Record consent
      </Button>
    </div>
  );
};
