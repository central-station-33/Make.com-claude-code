import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ForgotPasswordHandlerProps {
  setIsLoading: (value: boolean) => void;
  setError: (error: any) => void;
  setSuccess: (value: boolean) => void;
}

export const useForgotPasswordHandler = ({
  setIsLoading,
  setError,
  setSuccess,
}: ForgotPasswordHandlerProps) => {
  const { toast } = useToast();

  const handleForgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Reset link sent",
        description: "Please check your email for the password reset link.",
      });
    } catch (error: any) {
      setError(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return handleForgotPassword;
};