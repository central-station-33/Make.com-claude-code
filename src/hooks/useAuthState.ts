import { fetchCurrentTeamAgentRole } from '@/lib/currentTeamAgent';

import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const useAuthState = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now());
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, []);

  // Check for session timeout
  useEffect(() => {
    const checkInactivity = () => {
      const storedLastActivity = localStorage.getItem('lastActivity');
      const lastActivityTime = storedLastActivity ? parseInt(storedLastActivity) : Date.now();
      const timeSinceLastActivity = Date.now() - lastActivityTime;

      if (timeSinceLastActivity > INACTIVITY_TIMEOUT && session) {
        console.log('Session timeout due to inactivity');
        supabase.auth.signOut();
        localStorage.removeItem('lastActivity');
      }
    };

    const intervalId = setInterval(checkInactivity, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [session]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Fetch user role if session exists
          // NOTE: there is no `user_roles` table in this database -- role
          // lives on `team_agents.role`, keyed by `auth_user_id`. Querying
          // `user_roles` always errored (table doesn't exist), so
          // `userRole` silently stayed null for every signed-in user.
          if (session?.user) {
            const role = await fetchCurrentTeamAgentRole().catch(() => null);
            if (role) setUserRole(role);
          }
          
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('An unknown error occurred'));
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const role = await fetchCurrentTeamAgentRole().catch(() => null);
          if (role) setUserRole(role);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, user, userRole, loading, error };
};
