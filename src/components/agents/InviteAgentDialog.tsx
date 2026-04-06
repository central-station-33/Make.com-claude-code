
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

interface InviteAgentDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const InviteAgentDialog = ({ open, onOpenChange }: InviteAgentDialogProps) => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // TODO: Implement agent invitation logic
      toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${email}`,
      });
      setEmail("");
      onOpenChange?.(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send invitation. Please try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Agent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite New Agent</DialogTitle>
          <DialogDescription>
            Send an invitation to a new agent to join the platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@example.com"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Send Invitation
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteAgentDialog;
