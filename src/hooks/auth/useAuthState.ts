
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthError } from '@/types/auth.types';
import { RATE_LIMIT_MAX_ATTEMPTS } from '@/utils/rateLimiting';
import { Session } from '@supabase/supabase-js';

export const useAuthState = () => {
  const [email, setEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => 
    localStorage.getItem('rememberMe') === 'true'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [success, setSuccess] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(RATE_LIMIT_MAX_ATTEMPTS);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitExpiry, setRateLimitExpiry] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();
            
          if (!error && data) {
            setUserRole(data.role);
          }
        }
      } catch (error) {
        console.error('Error fetching initial session:', error);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);

      if (session?.user) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
          
        if (!error && data) {
          setUserRole(data.role);
        }
      } else {
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    rememberMe, setRememberMe,
    isLoading, setIsLoading,
    error, setError,
    success, setSuccess,
    remainingAttempts, setRemainingAttempts,
    isRateLimited, setIsRateLimited,
    rateLimitExpiry, setRateLimitExpiry,
    timeRemaining, setTimeRemaining,
    session,
    userRole,
  };
};
