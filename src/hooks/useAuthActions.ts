import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  sendMagicLink,
  signInWithGitHub,
  signOut as firebaseSignOut,
} from '@/integrations/firebase/authHelpers';

export const useAuthActions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const signIn = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      await sendMagicLink(email, redirectUrl);
      toast({
        title: 'Check your email',
        description: "We've sent you a magic link to sign in.",
      });
      return { data: {}, error: null };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Sign in failed';
      toast({ variant: 'destructive', title: 'Sign in failed', description: msg });
      return { data: null, error };
    }
  };

  const signUp = async (email: string) => {
    // Firebase magic-link handles both sign-up and sign-in
    return signIn(email);
  };

  const signInGitHub = async () => {
    try {
      await signInWithGitHub();
      navigate('/dashboard');
      return { data: {}, error: null };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'GitHub sign in failed';
      toast({ variant: 'destructive', title: 'GitHub sign in failed', description: msg });
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut();
      toast({ title: 'Signed out', description: 'You have been logged out successfully.' });
      navigate('/auth');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Sign out failed';
      toast({ variant: 'destructive', title: 'Error signing out', description: msg });
    }
  };

  return { signIn, signUp, signInGitHub, signOut };
};
