
import { useState } from 'react';
import { AuthError } from '@/types/auth.types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleSignIn = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: rateLimit, error: rateLimitError } = await supabase.rpc('check_rate_limit', { 
        user_email: email,
        user_ip: window.location.hostname,
      });

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError);
        throw new Error('Error checking rate limit. Please try again.');
      }

      if (rateLimit) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      const { data, error } = await signIn(email);
      
      if (error) {
        await supabase.from('login_attempts').insert([{ 
          email,
          ip_address: window.location.hostname,
          success: false,
        }]);

        if (error.message === 'Email not confirmed') {
          throw new Error('Please verify your email address before signing in.');
        }

        throw error;
      }

      await supabase.from('login_attempts').insert([{ 
        email,
        ip_address: window.location.hostname,
        success: true,
      }]);

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while signing in';
      setError({ 
        message: errorMessage,
        name: 'AuthError',
        status: err.status,
      });
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    handleSignIn,
    setError,
  };
};
