import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CRMActivity } from "@/types/crm.types";
import { toast } from "@/components/ui/use-toast";

export const useActivitiesQuery = (timeframe?: string) => {
  return useQuery({
    queryKey: ['crm-activities', timeframe],
    queryFn: async () => {
      const timeFilter = timeframe ? 
        new Date(Date.now() - parseInt(timeframe) * 24 * 60 * 60 * 1000).toISOString() :
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('crm_activities')
        .select(`
          *,
          crm_contacts (
            id,
            status,
            leads (
              name,
              email,
              profiles (
                full_name
              )
            )
          )
        `)
        .gte('created_at', timeFilter);

      if (error) {
        console.error('Error fetching activities:', error);
        toast({
          variant: "destructive",
          title: "Error fetching activities",
          description: error.message
        });
        throw error;
      }

      return data as CRMActivity[];
    }
  });
};