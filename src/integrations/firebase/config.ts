// Supabase compatibility stub — replaces the old Firebase config
import { supabase } from '@/integrations/supabase/client';
import type { CompatUser } from './authHelpers';

let _currentUser: CompatUser | null = null;
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    const u = session.user;
    _currentUser = {
      uid: u.id,
      id: u.id,
      email: u.email ?? null,
      displayName: (u.user_metadata?.full_name ?? u.user_metadata?.name ?? null) as string | null,
      photoURL: (u.user_metadata?.avatar_url ?? null) as string | null,
      providerData: (u.identities ?? []).map((i) => ({
        providerId: i.provider === 'github' ? 'github.com' : `${i.provider}.com`,
        displayName: ((i.identity_data?.name ?? i.identity_data?.full_name) as string | null) ?? null,
        email: (i.identity_data?.email as string | null) ?? null,
        photoURL: (i.identity_data?.avatar_url as string | null) ?? null,
      })),
    };
  } else {
    _currentUser = null;
  }
});

export const auth = {
  get currentUser() { return _currentUser; },
};

export const db = supabase;
export const storage = supabase.storage;
export default { auth, db, storage };
