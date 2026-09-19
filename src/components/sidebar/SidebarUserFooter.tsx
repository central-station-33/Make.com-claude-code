
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SidebarUserFooter() {
  const { session } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Signed out successfully" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "Please try again",
      });
    }
  };

  const email = session?.user?.email;

  return (
    <div className="flex items-center gap-2 px-1">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" title={email ?? undefined}>
          {email ?? "Signed in"}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={handleSignOut}
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Sign out</span>
      </Button>
    </div>
  );
}
