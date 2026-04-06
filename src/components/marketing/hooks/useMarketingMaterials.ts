import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FilterState, MaterialStats } from "@/types/marketing.types";

export const useMarketingMaterials = (initialFilters: FilterState) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [stats, setStats] = useState<MaterialStats>({
    downloads: 0,
    views: 0,
    favorites: 0
  });

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ["marketingMaterials", filters],
    queryFn: async () => {
      let query = supabase
        .from("marketing_materials")
        .select(`
          *,
          material_downloads(count),
          material_favorites(count)
        `);

      if (filters.category) {
        query = query.eq("category", filters.category);
      }
      if (filters.isPremium) {
        query = query.eq("is_premium", true);
      }
      if (filters.search) {
        query = query.textSearch("search_keywords", filters.search);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Update stats based on the fetched materials
      if (data) {
        setStats({
          downloads: data.reduce((sum, item) => sum + (item.download_count || 0), 0),
          views: data.reduce((sum, item) => sum + (item.view_count || 0), 0),
          favorites: data.reduce((sum, item) => sum + (item.material_favorites?.[0]?.count || 0), 0)
        });
      }

      return data.sort((a, b) => {
        switch (filters.sort) {
          case "popular":
            return (b.download_count || 0) - (a.download_count || 0);
          case "newest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "oldest":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          default:
            return 0;
        }
      });
    }
  });

  return {
    materials,
    isLoading,
    filters,
    setFilters,
    stats
  };
};