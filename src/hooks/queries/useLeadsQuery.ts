
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeadsQueryResult, LeadWithProfile } from "@/types/dashboard";
import { useToast } from "@/hooks/use-toast";

export const useLeadsQuery = () => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ["leads"],
    queryFn: async (): Promise<LeadsQueryResult> => {
      try {
        console.log('Starting leads fetch from database...');
        
        const { data, error, count } = await supabase
          .from("leads")
          .select(`
            *,
            profiles:agent_id(*),
            crm_contacts(
              *,
              crm_activities(*)
            ),
            lead_imports:import_id(
              filename,
              file_path,
              status
            )
          `, { count: 'exact' });

        if (error) {
          const supabaseError = error;
          console.error("Error fetching leads:", supabaseError);
          throw new Error(`Database error: ${supabaseError.message}`);
        }

        if (!data) {
          console.log('No leads found in database');
          return {
            leads: [],
            totalCount: 0,
            currentPage: 1,
            totalPages: 0
          };
        }

        console.log('Leads fetch successful, got', data.length, 'leads');
        const leads = data as LeadWithProfile[];
        
        return {
          leads,
          totalCount: count || 0,
          currentPage: 1,
          totalPages: Math.ceil((count || 0) / 10)
        };
      } catch (error) {
        console.error("Error in useLeadsQuery:", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        toast({
          variant: "destructive", 
          title: "Error loading leads",
          description: errorMessage
        });
        throw error;
      }
    }
  });
};
