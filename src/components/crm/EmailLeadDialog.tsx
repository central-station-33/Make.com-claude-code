import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { Lead } from "@/types/lead";
import { useEmailLead } from "@/hooks/useEmailLead";
import { EmailLeadForm } from "./EmailLeadForm";

interface EmailLeadDialogProps {
  lead: Lead;
}

export const EmailLeadDialog = ({ lead }: EmailLeadDialogProps) => {
  const {
    subject,
    setSubject,
    content,
    setContent,
    selectedMaterial,
    setSelectedMaterial,
    recipientEmail,
    setRecipientEmail,
    isLoading,
    marketingMaterials,
    handleSendEmail
  } = useEmailLead(lead);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Send Email to {lead.name}</DialogTitle>
        </DialogHeader>
        <EmailLeadForm
          subject={subject}
          content={content}
          selectedMaterial={selectedMaterial}
          marketingMaterials={marketingMaterials || []}
          isLoading={isLoading}
          recipientEmail={recipientEmail}
          onSubjectChange={setSubject}
          onContentChange={setContent}
          onMaterialChange={setSelectedMaterial}
          onRecipientChange={setRecipientEmail}
          onSubmit={handleSendEmail}
        />
      </DialogContent>
    </Dialog>
  );
};