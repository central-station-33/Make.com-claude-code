
import { LeadType } from '@/types/lead';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useLeadValidation = () => {
  const { toast } = useToast();

  const validateLead = async (data: any, type: LeadType) => {
    const errors: string[] = [];
    
    if (!data.name && !data.email && !data.phone) {
      errors.push('Name and at least one contact method (email or phone) are required');
    }

    if (type === LeadType.SELLER) {
      if (!data.address) errors.push('Address is required for seller leads');
      if (!data.city) errors.push('City is required for seller leads');
      if (!data.state) errors.push('State is required for seller leads');
    }

    // Store validation result in the new table
    try {
      const { error } = await supabase
        .from('lead_validations')
        .insert({
          lead_id: data.id,
          validation_type: type,
          validation_result: errors.length === 0,
          validation_errors: errors
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error storing lead validation:', error);
    }

    if (errors.length > 0) {
      errors.forEach(error => {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error
        });
      });
      return false;
    }

    return true;
  };

  const validateFile = (file: File): boolean => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No file selected"
      });
      return false;
    }

    const allowedTypes = ['csv', 'xlsx', 'xls', 'numbers'];
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    if (!fileType || !allowedTypes.includes(fileType)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a CSV, Excel, or Numbers file"
      });
      return false;
    }

    return true;
  };

  return {
    validateLead,
    validateFile
  };
};
