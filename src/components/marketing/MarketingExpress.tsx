import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import MaterialList from "./MaterialList";
import MaterialFilters from "./MaterialFilters";
import MaterialStats from "./MaterialStats";
import { useToast } from "@/hooks/use-toast";
import { useMarketingMaterials } from "./hooks/useMarketingMaterials";
import { FilterState } from "@/types/marketing.types";
import { supabase } from "@/integrations/supabase/client";

const initialFilters: FilterState = {
  category: null,
  isPremium: false,
  search: "",
  sort: "newest",
  viewMode: "grid"
};

export const MarketingExpress = () => {
  const { toast } = useToast();
  const { data: materials, isLoading } = useQuery({
    queryKey: ["marketingMaterials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_materials")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
  
  const handleFavoriteToggle = (id: string) => {
    // Implement favorite toggle logic
    console.log("Toggle favorite for:", id);
  };

  return (
    <div className="space-y-6">
      <MaterialStats stats={{ downloads: 0, views: 0, favorites: 0 }} />
      <Card className="p-6">
        <MaterialFilters filters={initialFilters} setFilters={() => {}} />
        <MaterialList 
          materials={materials || []}
          viewMode={initialFilters.viewMode}
          isLoading={isLoading}
          onFavoriteToggle={handleFavoriteToggle}
        />
      </Card>
    </div>
  );
};

export default MarketingExpress;