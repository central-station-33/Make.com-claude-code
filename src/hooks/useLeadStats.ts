
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LeadStat {
  status: string;
  count: number;
  last_updated: string;
}

export const useLeadStats = () => {
  return useQuery<LeadStat[]>({
    queryKey: ['lead-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dashboard_lead_stats')
        .select('*');

      if (error) {
        console.error('Error fetching lead stats:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60, // Consider data stale after 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
};
