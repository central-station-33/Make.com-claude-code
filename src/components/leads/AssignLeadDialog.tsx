import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserCircle } from "lucide-react";
import AgentSelect from "./assign/AgentSelect";
import { useAssignLead } from "./assign/useAssignLead";

interface AssignLeadDialogProps {
  leadId: string;
  currentAgentId: string | null;
  onAssigned?: () => void;
}

const AssignLeadDialog = ({ 
  leadId, 
  currentAgentId, 
  onAssigned 
}: AssignLeadDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(currentAgentId);
  
  const { agents, assignLead, isAssigning } = useAssignLead(leadId, () => {
    setOpen(false);
    onAssigned?.();
  });

  const handleAssign = () => {
    assignLead(selectedAgent);
  };

  const buttonTitle = currentAgentId ? "Reassign lead" : "Assign lead";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          title={buttonTitle}
        >
          <UserCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentAgentId ? "Reassign Lead" : "Assign Lead"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <AgentSelect
            agents={agents}
            selectedAgent={selectedAgent}
            onAgentChange={setSelectedAgent}
          />
          <Button 
            onClick={handleAssign} 
            className="w-full"
            disabled={isAssigning}
          >
            {selectedAgent ? "Assign Lead" : "Unassign Lead"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignLeadDialog;