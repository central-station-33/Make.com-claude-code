import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/lead";
import { FollowUpManager } from "@/components/leads/FollowUpManager";
import { LeadInfoCard } from "@/components/leads/details/LeadInfoCard";
import { LeadSourceCard } from "@/components/leads/details/LeadSourceCard";
import { LeadMessaging } from "@/components/leads/messaging/LeadMessaging";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const LeadDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching lead:", error);
        throw error;
      }

      if (!data) {
        toast({
          variant: "destructive",
          title: "Lead not found",
          description: "The requested lead does not exist or you don't have permission to view it."
        });
        navigate('/leads');
        return null;
      }

      return data as Lead;
    },
  });

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading lead details...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        Error loading lead details. Please try again.
      </div>
    );
  }

  if (!lead) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">{lead.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <LeadInfoCard lead={lead} />
          <LeadSourceCard lead={lead} />
          <LeadMessaging leadId={id!} />
        </div>
        <div>
          <FollowUpManager leadId={id!} />
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;