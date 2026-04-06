
import { Button } from "@/components/ui/button";
import { Download, Star, Mail } from "lucide-react";
import { EmailLeadDialog } from "@/components/crm/EmailLeadDialog";
import { Lead, LeadType, LeadStatus } from "@/types/lead";

interface MaterialCardActionsProps {
  onDownload: () => void;
  onFavoriteToggle: () => void;
  isFavorited: boolean;
  isDownloading: boolean;
  previewButton?: React.ReactNode;
}

export const MaterialCardActions = ({
  onDownload,
  onFavoriteToggle,
  isFavorited,
  isDownloading,
  previewButton
}: MaterialCardActionsProps) => {
  const dummyLead: Lead = {
    id: "",
    name: "",
    email: "",
    type: LeadType.BUYER,
    status: LeadStatus.NEW,
    phone: null,
    property_type: null,
    budget: null,
    location: null,
    notes: null,
    created_at: null,
    updated_at: null,
    user_id: null,
    agent_id: null,
    follow_up_date: null,
    last_contact_date: null,
    source: null,
    source_details: null,
    email_source: null,
    email_metadata: null,
    source_referral_fee: null,
    source_referral_notes: null,
    team_id: null,
    distribution_status: "pending",
    distribution_date: null,
    import_id: null,
    import_row_number: null,
    import_errors: null
  };

  return (
    <div className="flex gap-2">
      {previewButton}
      <Button 
        variant="outline" 
        size="sm"
        onClick={onFavoriteToggle}
      >
        <Star className={`h-4 w-4 ${isFavorited ? "fill-yellow-400" : ""}`} />
      </Button>
      <Button 
        size="sm"
        onClick={onDownload}
        disabled={isDownloading}
      >
        <Download className="h-4 w-4 mr-2" />
        {isDownloading ? "Downloading..." : "Download"}
      </Button>
      <EmailLeadDialog lead={dummyLead} />
    </div>
  );
};
