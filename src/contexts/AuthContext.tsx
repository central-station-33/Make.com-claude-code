
import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { AuthContextType } from '@/types/auth.types';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { session, user, userRole } = useAuthState();
  const { signIn, signUp, signOut } = useAuthActions();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial auth check complete:', {
          hasSession: !!session,
          userEmail: session?.user?.email
        });
      } catch (error) {
        console.error('Error during initial auth check:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', {
        event: _event,
        hasSession: !!session,
        userEmail: session?.user?.email
      });
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Only render children once we've initialized auth
  if (!initialized) {
    return null;
  }

  const value: AuthContextType = {
    session,
    user,
    userRole,
    signIn,
    signUp,
    signOut,
    loading,
    error: null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
