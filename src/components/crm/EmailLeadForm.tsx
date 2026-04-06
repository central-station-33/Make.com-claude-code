import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MarketingMaterial } from "@/types/marketing.types";

interface EmailLeadFormProps {
  subject: string;
  content: string;
  selectedMaterial: string;
  marketingMaterials: MarketingMaterial[];
  isLoading: boolean;
  recipientEmail: string;
  onSubjectChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onMaterialChange: (value: string) => void;
  onRecipientChange: (value: string) => void;
  onSubmit: () => void;
}

export const EmailLeadForm = ({
  subject,
  content,
  selectedMaterial,
  marketingMaterials,
  isLoading,
  recipientEmail,
  onSubjectChange,
  onContentChange,
  onMaterialChange,
  onRecipientChange,
  onSubmit
}: EmailLeadFormProps) => {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Input
          placeholder="To: Recipient Email"
          value={recipientEmail}
          onChange={(e) => onRecipientChange(e.target.value)}
          type="email"
          required
        />
      </div>
      <div className="grid gap-2">
        <Select
          value={selectedMaterial}
          onValueChange={onMaterialChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select marketing material" />
          </SelectTrigger>
          <SelectContent>
            {marketingMaterials?.map((material) => (
              <SelectItem key={material.id} value={material.id}>
                {material.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Input
          placeholder="Subject"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Textarea
          placeholder="Email content"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={5}
          required
        />
      </div>
      <Button 
        onClick={onSubmit} 
        disabled={isLoading || !subject || !content || !recipientEmail}
      >
        {isLoading ? "Sending..." : "Send Email"}
      </Button>
    </div>
  );
};