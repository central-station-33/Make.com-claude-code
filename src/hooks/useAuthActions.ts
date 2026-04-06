
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuthActions = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const signIn = async (email: string) => {
    try {
      const siteURL = window.location.origin;
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteURL}/auth/callback`,
          data: {
            redirect_url: `${siteURL}/dashboard`,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a magic link to sign in.",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
      return { data: null, error };
    }
  };

  const signUp = async (email: string) => {
    try {
      const siteURL = window.location.origin;
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${siteURL}/auth/callback`,
          data: {
            redirect_url: `${siteURL}/dashboard`,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Account created",
        description: "Please check your email to verify your account.",
      });

      return { data, error: null };
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message,
      });
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Signed out",
        description: "You have been logged out successfully.",
      });
      
      navigate('/auth');
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    }
  };

  return { signIn, signUp, signOut };
};
