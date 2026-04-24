import { useQuery } from "@tanstack/react-query";
import { getCurrentUser, signOut as firebaseSignOut } from "@/integrations/firebase/authHelpers";

export const useTimelineData = (leadId: string) => {
  return useQuery({
    queryKey: ['followUps', leadId],
    queryFn: async () => {
      const user = getCurrentUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      // First check if user has access to this lead
      const { data: userLead, error: userLeadError } = await supabase
        .from('leads')
        .select('id')
        .eq('id', leadId)
        .eq('user_id', user.uid)
        .maybeSingle();

      if (userLeadError) {
        console.error("Lead access error:", userLeadError);
        throw userLeadError;
      }

      // If not found as user_id, check agent_id
      if (!userLead) {
        const { data: agentLead, error: agentLeadError } = await supabase
          .from('leads')
          .select('id')
          .eq('id', leadId)
          .eq('agent_id', user.uid)
          .maybeSingle();

        if (agentLeadError) {
          console.error("Lead access error:", agentLeadError);
          throw agentLeadError;
        }

        if (!agentLead) {
          throw new Error("You don't have permission to view this lead");
        }
      }

      // Now fetch the follow-ups
      const { data, error } = await supabase
        .from('lead_follow_ups')
        .select(`
          id,
          scheduled_for,
          completed_at,
          notes,
          status,
          template:follow_up_templates(
            name,
            description
          )
        `)
        .eq('lead_id', leadId)
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error("Follow-ups fetch error:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!leadId,
  });
};