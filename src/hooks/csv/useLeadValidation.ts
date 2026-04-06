
import { LeadType } from '@/types/lead';
import { useToast } from "@/hooks/use-toast";

export const useLeadValidation = () => {
  const { toast } = useToast();

  const validateLead = async (data: any, type: LeadType) => {
    const errors: string[] = [];
    
    // Normalize email and phone by trimming whitespace
    const email = data.email?.trim();
    const phone = data.phone?.trim();
    
    // Print validation data for debugging
    console.log('Validating lead data:', { 
      email, 
      phone,
      rawEmail: data.email,
      rawPhone: data.phone,
      allData: data 
    });

    // Name validation
    if (!data.name?.trim()) {
      errors.push('Name is required');
    }

    // Contact method validation (matches database trigger)
    if (!email && !phone) {
      errors.push('Either email or phone is required');
    }

    if (email && !isValidEmail(email)) {
      errors.push('Invalid email format');
    }

    if (phone && !isValidPhone(phone)) {
      errors.push('Invalid phone format - must contain at least 10 digits');
    }

    // Additional validations for SELLER type
    if (type === LeadType.SELLER) {
      if (!data.address?.trim()) {
        errors.push('Address is required for seller leads');
      }
      if (!data.city?.trim()) {
        errors.push('City is required for seller leads');
      }
      if (!data.state?.trim()) {
        errors.push('State is required for seller leads');
      }
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

  // Helper function to validate email format (matches database trigger regex)
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  // Helper function to validate phone format (matches database trigger logic)
  const isValidPhone = (phone: string): boolean => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Check if we have at least 10 digits
    return digits.length >= 10;
  };

  return {
    validateLead,
    validateFile
  };
};
