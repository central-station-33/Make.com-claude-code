import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResetPasswordHandlerProps {
  setIsLoading: (value: boolean) => void;
  setError: (error: any) => void;
  setSuccess: (value: boolean) => void;
  onSuccess?: () => void;
}

export const useResetPasswordHandler = ({
  setIsLoading,
  setError,
  setSuccess,
  onSuccess,
}: ResetPasswordHandlerProps) => {
  const { toast } = useToast();

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
      onSuccess?.();
    } catch (error: any) {
      console.error("Password reset error:", error);
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

  return handleResetPassword;
};