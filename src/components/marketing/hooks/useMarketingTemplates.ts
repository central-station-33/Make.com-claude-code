import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FilterState, MarketingMaterial } from "@/types/marketing.types";

export const useMarketingTemplates = (filters: FilterState) => {
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["marketingTemplates", filters],
    queryFn: async () => {
      let query = supabase
        .from("marketing_templates")
        .select("*");

      if (filters.category) {
        query = query.eq("category", filters.category);
      }
      if (filters.isPremium) {
        query = query.eq("is_premium", true);
      }
      if (filters.search) {
        query = query.textSearch("title", filters.search);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  return {
    templates,
    isLoading
  };
};