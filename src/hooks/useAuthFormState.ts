
import { useState } from 'react';
import { RATE_LIMIT_MAX_ATTEMPTS } from '@/utils/rateLimiting';

export const useAuthFormState = () => {
  const [email, setEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [remainingAttempts, setRemainingAttempts] = useState(RATE_LIMIT_MAX_ATTEMPTS);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitExpiry, setRateLimitExpiry] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  return {
    email, setEmail,
    remainingAttempts, setRemainingAttempts,
    isRateLimited, setIsRateLimited,
    rateLimitExpiry, setRateLimitExpiry,
    timeRemaining, setTimeRemaining,
  };
};
