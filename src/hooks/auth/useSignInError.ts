import { supabase } from '@/integrations/supabase/client';

export const useSignInError = () => {
  const updateLoginAttempt = async (email: string, success: boolean) => {
    await supabase.from('login_attempts').insert([{
      email,
      ip_address: window.location.hostname,
      success,
    }]);
  };

  const updateRemainingAttempts = async (
    email: string,
    setRemainingAttempts: (value: number) => void
  ) => {
    const { data: attempts } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('email', email)
      .eq('ip_address', window.location.hostname)
      .eq('success', false)
      .gte('attempt_time', new Date(Date.now() - 15 * 60 * 1000).toISOString());

    const remainingAttempts = 5 - (attempts?.length || 0);
    setRemainingAttempts(Math.max(0, remainingAttempts));
  };

  return { updateLoginAttempt, updateRemainingAttempts };
};