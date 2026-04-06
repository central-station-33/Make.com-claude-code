import { Lead } from "@/types/lead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface LeadSourceCardProps {
  lead: Lead;
}

export const LeadSourceCard = ({ lead }: LeadSourceCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Source Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Source</Label>
          <p className="text-gray-700">{lead.source || 'Not specified'}</p>
        </div>
        {lead.source_details && (
          <div>
            <Label>Source Details</Label>
            <p className="text-gray-700">
              {typeof lead.source_details === 'object' 
                ? JSON.stringify(lead.source_details, null, 2) 
                : lead.source_details}
            </p>
          </div>
        )}
        {lead.source_referral_fee !== null && (
          <div>
            <Label>Referral Fee</Label>
            <p className="text-gray-700">
              ${lead.source_referral_fee.toLocaleString()}
            </p>
          </div>
        )}
        {lead.source_referral_notes && (
          <div>
            <Label>Referral Notes</Label>
            <p className="text-gray-700">{lead.source_referral_notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};