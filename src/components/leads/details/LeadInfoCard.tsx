import { Lead } from "@/types/lead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface LeadInfoCardProps {
  lead: Lead;
}

export const LeadInfoCard = ({ lead }: LeadInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Email</Label>
          <p className="text-gray-700">{lead.email}</p>
        </div>
        <div>
          <Label>Phone</Label>
          <p className="text-gray-700">{lead.phone || 'Not provided'}</p>
        </div>
        <div>
          <Label>Type</Label>
          <p className="text-gray-700">{lead.type}</p>
        </div>
        <div>
          <Label>Status</Label>
          <p className="text-gray-700">{lead.status}</p>
        </div>
        {lead.property_type && (
          <div>
            <Label>Property Type</Label>
            <p className="text-gray-700">{lead.property_type}</p>
          </div>
        )}
        {lead.budget && (
          <div>
            <Label>Budget</Label>
            <p className="text-gray-700">${lead.budget.toLocaleString()}</p>
          </div>
        )}
        {lead.location && (
          <div>
            <Label>Location</Label>
            <p className="text-gray-700">{lead.location}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};