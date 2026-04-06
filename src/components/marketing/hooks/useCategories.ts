import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCategories = () => {
  return useQuery({
    queryKey: ["materialCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_materials")
        .select("category")
        .eq('category', 'category');
      
      if (error) throw error;
      return data.map(d => d.category).filter((c): c is string => c !== null);
    }
  });
};