import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

export const useRateLimiting = () => {
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitExpiry, setRateLimitExpiry] = useState<string | null>(null);

  const checkRateLimit = async (email: string) => {
    const { data: rateLimit } = await supabase.rpc('check_rate_limit', {
      user_email: email,
      user_ip: window.location.hostname,
    });

    if (rateLimit) {
      setIsRateLimited(true);
      setRateLimitExpiry(new Date(Date.now() + 15 * 60 * 1000).toISOString());
      throw new Error('Too many login attempts');
    }
  };

  const updateRemainingAttempts = async (email: string) => {
    const { data: attempts } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('email', email)
      .eq('ip_address', window.location.hostname)
      .eq('success', false)
      .gte('attempt_time', new Date(Date.now() - 15 * 60 * 1000).toISOString());

    const remaining = Math.max(0, 5 - (attempts?.length || 0));
    setRemainingAttempts(remaining);
  };

  return {
    remainingAttempts,
    isRateLimited,
    rateLimitExpiry,
    checkRateLimit,
    updateRemainingAttempts,
    setIsRateLimited,
    setRateLimitExpiry,
  };
};