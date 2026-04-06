
import { useState } from 'react';
import { MarketingMaterialFormData } from '@/types/marketing.types';

const DEFAULT_FORM_DATA: MarketingMaterialFormData = {
  title: '',
  description: '',
  category: '',
  type: 'document',
  is_premium: false,
  template_url: '',
  thumbnail_url: ''
};

export const useMarketingFormState = () => {
  const [formData, setFormData] = useState<MarketingMaterialFormData>(DEFAULT_FORM_DATA);
  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFormData(DEFAULT_FORM_DATA);
    }
  };

  return {
    formData,
    setFormData,
    open,
    handleOpenChange
  };
};
