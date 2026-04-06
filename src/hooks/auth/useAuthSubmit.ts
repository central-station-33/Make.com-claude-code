
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAuthValidation } from './useAuthValidation';
import { supabase } from '@/integrations/supabase/client';

interface AuthSubmitProps {
  email: string;
  setIsLoading: (value: boolean) => void;
  setError: (error: any) => void;
  setRemainingAttempts: (value: number) => void;
  setIsRateLimited: (value: boolean) => void;
  setRateLimitExpiry: (value: string | null) => void;
}

export const useAuthSubmit = ({
  email,
  setIsLoading,
  setError,
  setRemainingAttempts,
  setIsRateLimited,
  setRateLimitExpiry,
}: AuthSubmitProps) => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const { validateEmail } = useAuthValidation();

  const checkRateLimit = async (email: string, ip: string) => {
    try {
      const { data: rateLimit, error } = await supabase.rpc('check_rate_limit', {
        user_email: email,
        user_ip: ip,
      });
      
      if (error) throw error;
      return rateLimit;
    } catch (err) {
      console.error('Rate limit check failed:', err);
      return false; // Fail open if rate limit check fails
    }
  };

  const recordLoginAttempt = async (email: string, success: boolean) => {
    try {
      const { error } = await supabase.from('login_attempts').insert([{
        email,
        ip_address: window.location.hostname,
        success,
      }]);
      
      if (error) throw error;
    } catch (err) {
      console.error('Failed to record login attempt:', err);
      // Don't throw - this is non-critical functionality
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError(new Error('Please enter a valid email address'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isRateLimited = await checkRateLimit(email, window.location.hostname);
      if (isRateLimited) {
        setIsRateLimited(true);
        setRateLimitExpiry(new Date(Date.now() + 15 * 60 * 1000).toISOString());
        throw new Error('Too many login attempts. Please try again later.');
      }

      const { error } = await signIn(email);
      
      if (error) {
        await recordLoginAttempt(email, false);
        throw error;
      }

      await recordLoginAttempt(email, true);
      toast({
        title: "Success",
        description: "Check your email for the magic link.",
      });
    } catch (err: any) {
      console.error("Form submission error:", err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return handleSubmit;
};
