
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MarketingMaterial } from '@/types/marketing.types';

export const useMarketingOperations = (onSuccess: () => void) => {
  const { toast } = useToast();
  const [selectedMaterial, setSelectedMaterial] = useState<MarketingMaterial | undefined>();

  const handleSubmit = async (formData: any, e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedMaterial?.id) {
        const { error } = await supabase
          .from('marketing_materials')
          .update(formData)
          .eq('id', selectedMaterial.id);

        if (error) throw error;
        toast({ title: "Material Updated", description: "The marketing material has been updated successfully." });
      } else {
        const { error } = await supabase
          .from('marketing_materials')
          .insert(formData);

        if (error) throw error;
        toast({ title: "Material Created", description: "The new marketing material has been created successfully." });
      }

      onSuccess();
      return true;
    } catch (error) {
      console.error('Error saving material:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save the marketing material."
      });
      return false;
    }
  };

  const handleDelete = async (material: MarketingMaterial) => {
    try {
      const { error } = await supabase
        .from('marketing_materials')
        .delete()
        .eq('id', material.id);

      if (error) throw error;

      toast({
        title: "Material Deleted",
        description: "The marketing material has been deleted successfully."
      });
      onSuccess();
      return true;
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the marketing material."
      });
      return false;
    }
  };

  return {
    selectedMaterial,
    setSelectedMaterial,
    handleSubmit,
    handleDelete
  };
};
