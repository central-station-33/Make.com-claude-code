import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LeadSourceFieldsProps {
  source: string;
  setSource: (value: string) => void;
  sourceDetails?: string;
  setSourceDetails?: (value: string) => void;
  sourceReferralFee?: string;
  setSourceReferralFee?: (value: string) => void;
  sourceReferralNotes?: string;
  setSourceReferralNotes?: (value: string) => void;
}

const LeadSourceFields = ({
  source,
  setSource,
  sourceDetails,
  setSourceDetails,
  sourceReferralFee,
  setSourceReferralFee,
  sourceReferralNotes,
  setSourceReferralNotes,
}: LeadSourceFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="source">Lead Source</Label>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger>
            <SelectValue placeholder="Select lead source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="direct">Direct Contact</SelectItem>
            <SelectItem value="facebook_group">Facebook Expat Group</SelectItem>
            <SelectItem value="linkedin_group">LinkedIn Expat Group</SelectItem>
            <SelectItem value="whatsapp_group">WhatsApp Expat Group</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {source && (
        <div className="space-y-2">
          <Label htmlFor="sourceDetails">
            {source.includes('group') ? 'Group Name' : 'Source Details'}
          </Label>
          <Input
            id="sourceDetails"
            value={sourceDetails}
            onChange={(e) => setSourceDetails?.(e.target.value)}
            placeholder={source.includes('group') ? 'Enter group name' : 'Enter source details'}
          />
        </div>
      )}

      {source === 'referral' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="sourceReferralFee">Referral Fee</Label>
            <Input
              id="sourceReferralFee"
              type="number"
              value={sourceReferralFee}
              onChange={(e) => setSourceReferralFee?.(e.target.value)}
              placeholder="Enter referral fee amount"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sourceReferralNotes">Referral Notes</Label>
            <Textarea
              id="sourceReferralNotes"
              value={sourceReferralNotes}
              onChange={(e) => setSourceReferralNotes?.(e.target.value)}
              placeholder="Enter any notes about the referral"
            />
          </div>
        </>
      )}
    </>
  );
};

export default LeadSourceFields;