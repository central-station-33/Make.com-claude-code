import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFavorites = () => {
  const queryClient = useQueryClient();

  const { data: favorites = new Set() } = useQuery({
    queryKey: ["materialFavorites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_favorites")
        .select("material_id");
      
      if (error) throw error;
      return new Set(data.map(f => f.material_id));
    }
  });

  const toggleFavorite = async (materialId: string) => {
    const isFavorited = favorites.has(materialId);
    
    if (isFavorited) {
      await supabase
        .from("material_favorites")
        .delete()
        .eq("material_id", materialId);
      favorites.delete(materialId);
    } else {
      await supabase
        .from("material_favorites")
        .insert([{ material_id: materialId }]);
      favorites.add(materialId);
    }
    
    queryClient.invalidateQueries({ queryKey: ["materialFavorites"] });
  };

  return {
    favorites,
    toggleFavorite
  };
};