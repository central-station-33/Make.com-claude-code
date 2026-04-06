
import { SignInFormData, SignInResult } from '@/types/auth.types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSignInHandler = (
  setIsLoading: (value: boolean) => void,
  setError: (error: any) => void,
  isRateLimited: boolean,
  timeRemaining: number
) => {
  const { toast } = useToast();

  const handleSignIn = async (email: string, password?: string): Promise<SignInResult> => {
    if (isRateLimited) {
      toast({
        variant: "destructive",
        title: "Rate limit exceeded",
        description: `Please try again in ${timeRemaining} minutes`
      });
      return { success: false };
    }

    try {
      console.log('Attempting sign in with:', { email, hasPassword: !!password });
      setIsLoading(true);
      setError(null);

      let signInResult;

      if (password) {
        // Password sign in
        signInResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        // Magic link sign in
        const siteURL = window.location.origin;
        signInResult = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${siteURL}/auth/callback`,
            data: {
              redirect_url: `${siteURL}/dashboard`,
            }
          }
        });
      }

      const { error } = signInResult;

      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }

      if (!password) {
        toast({
          title: "Check your email",
          description: "We've sent you a magic link to sign in.",
        });
      }

      return { success: true };
    } catch (err: any) {
      console.error("Sign in error:", err);
      
      let errorMessage = 'An error occurred during sign in';
      
      if (err.status === 500) {
        errorMessage = 'Server error - please try again later';
      } else if (err.message.includes('rate limit')) {
        errorMessage = 'Too many attempts - please wait a few minutes';
      } else if (err.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError({ 
        message: errorMessage,
        status: err.status,
      });

      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: errorMessage,
      });

      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSignIn };
};
