import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeadWithProfile } from "@/types/dashboard";
import { useToast } from "./use-toast";

export interface CRMStats {
  leads: LeadWithProfile[];
  stageData: { name: string; value: number }[];
  totalLeads: number;
  activeLeads: number;
  conversionRate: number;
}

export const useCRMStats = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["crm-stats"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("leads")
          .select(`
            *,
            profiles:agent_id(*),
            crm_contacts(
              *,
              crm_activities(*)
            )
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const leads = data as LeadWithProfile[];
        
        // Calculate stage distribution
        const stages = leads.reduce((acc, lead) => {
          const stage = lead.status || 'Unknown';
          acc[stage] = (acc[stage] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const stageData = Object.entries(stages).map(([name, value]) => ({
          name,
          value
        }));

        // Calculate additional stats
        const totalLeads = leads.length;
        const activeLeads = leads.filter(l => l.status !== 'Lost' && l.status !== 'Closed').length;
        const conversionRate = totalLeads ? (leads.filter(l => l.status === 'Closed').length / totalLeads) * 100 : 0;

        return {
          leads,
          stageData,
          totalLeads,
          activeLeads,
          conversionRate
        } as CRMStats;

      } catch (error) {
        console.error("Error fetching CRM stats:", error);
        toast({
          variant: "destructive",
          title: "Error loading CRM stats",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
        });
        throw error;
      }
    },
  });
};