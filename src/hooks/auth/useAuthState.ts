import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChange } from '@/integrations/firebase/authHelpers';
import { getDocuments, COLLECTIONS, where } from '@/integrations/firebase/firestore';
import { RATE_LIMIT_MAX_ATTEMPTS } from '@/utils/rateLimiting';
import type { AuthError } from '@/types/auth.types';

export const useAuthState = () => {
  const [email, setEmail] = useState(() => localStorage.getItem('userEmail') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(
    () => localStorage.getItem('rememberMe') === 'true'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [success, setSuccess] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(RATE_LIMIT_MAX_ATTEMPTS);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitExpiry, setRateLimitExpiry] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const roles = await getDocuments<{ role: string }>(COLLECTIONS.USER_ROLES, [
          where('user_id', '==', firebaseUser.uid),
        ]);
        setUserRole(roles[0]?.role ?? null);
      } else {
        setUserRole(null);
      }
    });
    return unsubscribe;
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
    user,
    userRole,
  };
};
