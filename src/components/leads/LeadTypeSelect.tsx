import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadType } from "@/components/crm/types/lead";

interface LeadTypeSelectProps {
  type: string;
  setType: (value: string) => void;
}

const LeadTypeSelect = ({ type, setType }: LeadTypeSelectProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="type">Lead Type</Label>
      <Select value={type} onValueChange={setType}>
        <SelectTrigger>
          <SelectValue placeholder="Select lead type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={LeadType.BUYER}>Buyer</SelectItem>
          <SelectItem value={LeadType.SELLER}>Seller</SelectItem>
          <SelectItem value={LeadType.INVESTOR}>Investor</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default LeadTypeSelect;