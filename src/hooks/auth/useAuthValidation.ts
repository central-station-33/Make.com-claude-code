
import { useToast } from '@/hooks/use-toast';

export const useAuthValidation = () => {
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Email is required",
      });
      return false;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid email address",
      });
      return false;
    }

    return true;
  };

  return {
    validateEmail,
  };
};
