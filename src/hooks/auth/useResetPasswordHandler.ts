import { useToast } from '@/hooks/use-toast';
import { confirmNewPassword } from '@/integrations/firebase/authHelpers';

interface ResetPasswordHandlerProps {
  setIsLoading: (value: boolean) => void;
  setError: (error: unknown) => void;
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

  // token = Firebase oobCode extracted from the reset URL query param
  const handleResetPassword = async (token: string, password: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await confirmNewPassword(token, password);
      setSuccess(true);
      onSuccess?.();
    } catch (err: unknown) {
      setError(err);
      const msg = err instanceof Error ? err.message : 'Password reset failed';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return handleResetPassword;
};
