import { useToast } from '@/hooks/use-toast';
import { sendPasswordReset } from '@/integrations/firebase/authHelpers';

interface ForgotPasswordHandlerProps {
  setIsLoading: (value: boolean) => void;
  setError: (error: unknown) => void;
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
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      await sendPasswordReset(email, redirectUrl);
      setSuccess(true);
      toast({
        title: 'Reset link sent',
        description: 'Please check your email for the password reset link.',
      });
    } catch (err: unknown) {
      setError(err);
      const msg = err instanceof Error ? err.message : 'Failed to send reset email';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return handleForgotPassword;
};
