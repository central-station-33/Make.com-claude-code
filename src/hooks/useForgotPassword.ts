import { useState } from 'react';
import { sendPasswordReset } from '@/integrations/firebase/authHelpers';
import { useToast } from '@/hooks/use-toast';

export const useForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleForgotPassword = async (email: string) => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await sendPasswordReset(email, `${window.location.origin}/auth/reset-password`);
      setSuccess(true);
      toast({ title: 'Reset link sent', description: 'Please check your email for the password reset link.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed';
      setError(msg);
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, success, handleForgotPassword };
};
