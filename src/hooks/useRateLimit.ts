import { supabase } from "@/integrations/supabase/client";

export const useRateLimit = () => {
  const checkRateLimit = async (userId: string) => {
    const { data: isRateLimited, error: rateLimitError } = await supabase.rpc(
      'check_invitation_rate_limit',
      { user_id: userId }
    );

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
      throw new Error('Failed to check rate limit');
    }

    if (isRateLimited) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    return false;
  };

  return { checkRateLimit };
};