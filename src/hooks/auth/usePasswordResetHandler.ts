import { useToast } from '@/hooks/use-toast';
import { sendPasswordReset, confirmNewPassword } from '@/integrations/firebase/authHelpers';

export const usePasswordResetHandler = (
  setIsLoading: (value: boolean) => void,
  setError: (error: unknown) => void,
  setSuccess: (value: boolean) => void
) => {
  const { toast } = useToast();

  const handleForgotPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await sendPasswordReset(email, `${window.location.origin}/auth/reset-password`);
      setSuccess(true);
      toast({ title: 'Reset link sent', description: 'Please check your email.' });
    } catch (err: unknown) {
      setError(err);
      const msg = err instanceof Error ? err.message : 'Failed to send reset email';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  // token here is the Firebase oobCode from the reset URL
  const handleResetPassword = async (token: string, password: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await confirmNewPassword(token, password);
      setSuccess(true);
      toast({ title: 'Password set', description: 'You can now sign in.' });
    } catch (err: unknown) {
      setError(err);
      const msg = err instanceof Error ? err.message : 'Password reset failed';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleForgotPassword, handleResetPassword };
};
