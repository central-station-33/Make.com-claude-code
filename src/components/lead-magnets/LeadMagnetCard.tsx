import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Mail } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LeadMagnetCardProps {
  title: string;
  description: string;
  type: string;
  icon: LucideIcon;
  isLocked?: boolean;
  isTemplate?: boolean;
  onDownload: () => void;
}

const LeadMagnetCard = ({
  title,
  description,
  type,
  icon: Icon,
  isLocked = false,
  isTemplate = false,
  onDownload,
}: LeadMagnetCardProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailCalculator = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-calculator", {
        body: {
          recipientEmail: email,
          recipientName: name,
          propertyAddress: address,
        },
      });

      if (error) throw error;

      toast({
        title: "Calculator sent!",
        description: "Check your email for the property value calculator.",
      });

      // Track the interaction
      await supabase.from("lead_magnet_interactions").insert({
        magnet_type: type,
        content_title: title,
        metadata: { email, name, address }
      });

    } catch (error) {
      console.error("Error sending calculator:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send calculator. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-8 w-8 text-primary" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {type === "calculator" ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Email Calculator
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Get Your Property Value Calculator</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Property Address (optional)</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                  />
                </div>
                <Button 
                  onClick={handleEmailCalculator} 
                  disabled={isLoading || !email || !name}
                >
                  {isLoading ? "Sending..." : "Send Calculator"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button onClick={onDownload} className="w-full" variant={isLocked ? "secondary" : "default"}>
            <Download className="mr-2 h-4 w-4" />
            {isLocked ? "Sign in to Download" : `Download ${type}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadMagnetCard;