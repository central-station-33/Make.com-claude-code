
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { inrange } from "@/integrations/supabase/inrange";
import { UserPlus, Loader2 } from "lucide-react";
import { functionErrorMessage } from '@/lib/currentTeamAgent';

interface InviteAgentDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onInvited?: () => void;
}

type Market = "nyc" | "nj" | "both";
type Role = "agent" | "broker";

const InviteAgentDialog = ({ open, onOpenChange, onInvited }: InviteAgentDialogProps) => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [market, setMarket] = useState<Market>("both");
  const [role, setRole] = useState<Role>("agent");
  const { toast } = useToast();

  const invite = useMutation({
    mutationFn: async () => {
      const { data, error } = await inrange.functions.invoke("invite-agent", {
        body: {
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
          license_number: licenseNumber.trim() || undefined,
          market,
          // This brokerage always invites into Jet Realty Advisors -- the
          // other value ('highline') only exists for legacy/other-brokerage
          // rows and is not offered here.
          brokerage: "jet_realty",
          role,
        },
      });
      if (error) throw new Error(await functionErrorMessage(error));
      if (data && data.success === false) throw new Error(data.error || "Invite failed");
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: `${fullName || email} will receive a signup email at ${email}.`,
      });
      setEmail("");
      setFullName("");
      setPhone("");
      setLicenseNumber("");
      setMarket("both");
      setRole("agent");
      onOpenChange?.(false);
      onInvited?.();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message ?? "Failed to send invitation. Please try again.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    invite.mutate();
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
            Sends a Supabase signup invite email and creates their Jet Realty Advisors team record.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Agent"
              required
            />
          </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 555-5555" />
            </div>
            <div>
              <Label htmlFor="license">License # (optional)</Label>
              <Input id="license" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="market">Market</Label>
              <select
                id="market"
                value={market}
                onChange={(e) => setMarket(e.target.value as Market)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="both">NYC + NJ</option>
                <option value="nyc">NYC only</option>
                <option value="nj">NJ only</option>
              </select>
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="agent">Agent</option>
                <option value="broker">Broker / Admin</option>
              </select>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={invite.isPending}>
            {invite.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send Invitation
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteAgentDialog;
