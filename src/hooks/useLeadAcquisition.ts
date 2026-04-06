import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, subDays, format } from "date-fns";

export const useLeadAcquisition = (days: number = 7) => {
  return useQuery({
    queryKey: ['lead-acquisition', days],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), days));
      
      const { data: leads, error } = await supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Create a map of dates and lead counts
      const leadsByDate = new Map();
      for (let i = 0; i <= days; i++) {
        const date = format(subDays(new Date(), i), 'MMM dd');
        leadsByDate.set(date, 0);
      }

      // Count leads for each date
      leads.forEach(lead => {
        const date = format(new Date(lead.created_at), 'MMM dd');
        if (leadsByDate.has(date)) {
          leadsByDate.set(date, leadsByDate.get(date) + 1);
        }
      });

      // Convert to array format for chart
      return Array.from(leadsByDate.entries())
        .map(([date, leads]) => ({
          date,
          leads,
        }))
        .reverse();
    },
  });
};