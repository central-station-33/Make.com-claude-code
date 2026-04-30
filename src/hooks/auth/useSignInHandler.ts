import type { SignInResult } from '@/types/auth.types';
import { useToast } from '@/hooks/use-toast';
import { sendMagicLink } from '@/integrations/firebase/authHelpers';

export const useSignInHandler = (
  setIsLoading: (value: boolean) => void,
  setError: (error: unknown) => void,
  isRateLimited: boolean,
  timeRemaining: number
) => {
  const { toast } = useToast();

  const handleSignIn = async (email: string, _password?: string): Promise<SignInResult> => {
    if (isRateLimited) {
      toast({
        variant: 'destructive',
        title: 'Rate limit exceeded',
        description: `Please try again in ${timeRemaining} minutes`,
      });
      return { success: false };
    }

    try {
      setIsLoading(true);
      setError(null);
      const redirectUrl = `${window.location.origin}/auth/callback`;
      await sendMagicLink(email, redirectUrl);
      toast({
        title: 'Check your email',
        description: "We've sent you a magic link to sign in.",
      });
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during sign in';
      setError({ message: msg });
      toast({ variant: 'destructive', title: 'Sign in failed', description: msg });
      return { success: false, error: err instanceof Error ? err : new Error(msg) };
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSignIn };
};
