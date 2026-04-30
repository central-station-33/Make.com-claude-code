import { useState, useEffect } from 'react';
import type { CompatUser as User } from '@/integrations/firebase/authHelpers';
import { onAuthChange } from '@/integrations/firebase/authHelpers';
import { getDocuments, COLLECTIONS, where } from '@/integrations/firebase/firestore';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Track activity for session timeout
  useEffect(() => {
    const update = () => localStorage.setItem('lastActivity', Date.now().toString());
    ['mousemove', 'keydown', 'click', 'scroll'].forEach((e) =>
      window.addEventListener(e, update)
    );
    return () =>
      ['mousemove', 'keydown', 'click', 'scroll'].forEach((e) =>
        window.removeEventListener(e, update)
      );
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const stored = localStorage.getItem('lastActivity');
      const last = stored ? parseInt(stored) : Date.now();
      if (Date.now() - last > INACTIVITY_TIMEOUT && user) {
        import('@/integrations/firebase/authHelpers').then(({ signOut }) => signOut());
        localStorage.removeItem('lastActivity');
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          const roles = await getDocuments<{ role: string }>(
            COLLECTIONS.USER_ROLES,
            [where('user_id', '==', firebaseUser.uid)]
          );
          setUserRole(roles[0]?.role ?? null);
        } else {
          setUserRole(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Auth error'));
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  return { user, userRole, loading, error };
};
