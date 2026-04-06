
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePasswordResetHandler = (
  setIsLoading: (value: boolean) => void,
  setError: (error: any) => void,
  setSuccess: (value: boolean) => void
) => {
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
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (token: string, password: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Password set successfully",
        description: "You can now sign in with your new password.",
      });
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleForgotPassword, handleResetPassword };
};
