
import { useMarketingFormState } from './useMarketingFormState';
import { useMarketingOperations } from './useMarketingOperations';
import { MarketingMaterial } from '@/types/marketing.types';

export const useMarketingDialog = (onSuccess: () => void) => {
  const { formData, setFormData, open, handleOpenChange } = useMarketingFormState();
  const { selectedMaterial, setSelectedMaterial, handleSubmit, handleDelete } = useMarketingOperations(onSuccess);

  const handleEdit = (material: MarketingMaterial) => {
    setSelectedMaterial(material);
    setFormData({
      title: material.title,
      description: material.description,
      category: material.category,
      type: material.type,
      is_premium: material.is_premium,
      template_url: material.template_url || '',
      thumbnail_url: material.thumbnail_url || ''
    });
    handleOpenChange(true);
  };

  return {
    open,
    formData,
    setFormData,
    selectedMaterial,
    handleOpenChange,
    handleSubmit: (e: React.FormEvent) => handleSubmit(formData, e),
    handleEdit,
    handleDelete
  };
};
