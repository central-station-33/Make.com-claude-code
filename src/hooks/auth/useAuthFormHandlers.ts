
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAuthValidation } from './useAuthValidation';
import { useRateLimiting } from './useRateLimiting';
import { supabase } from '@/integrations/supabase/client';

export const useAuthFormHandlers = () => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const { validateEmail } = useAuthValidation();
  const rateLimiting = useRateLimiting();

  const recordSuccessfulLogin = async (email: string) => {
    await supabase.from('login_attempts').insert([{
      email,
      ip_address: window.location.hostname,
      success: true,
    }]);
  };

  const handleSubmit = async (
    email: string,
    setIsLoading: (value: boolean) => void,
    setError: (error: any) => void
  ) => {
    if (!validateEmail(email)) {
      setError(new Error('Please enter a valid email address'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await rateLimiting.checkRateLimit(email);
      const siteURL = window.location.origin;
      const { error } = await signIn(email);
      
      if (error) {
        await handleLoginError(error, email);
      }

      await recordSuccessfulLogin(email);
    } catch (err: any) {
      handleError(err, setError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginError = async (error: any, email: string) => {
    await rateLimiting.updateRemainingAttempts(email);
    throw error;
  };

  const handleError = (err: any, setError: (error: any) => void) => {
    console.error("Form submission error:", err);
    setError(err);
    toast({
      variant: "destructive",
      title: "Error",
      description: err.message,
    });
  };

  return {
    handleSubmit,
    ...rateLimiting,
  };
};
