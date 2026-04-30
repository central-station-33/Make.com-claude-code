// Supabase-backed compatibility shim — keeps the same API surface as the old Firebase helpers
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type CompatUser = {
  uid: string;
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerData: { providerId: string; displayName: string | null; email: string | null; photoURL: string | null }[];
};

function toCompatUser(user: User): CompatUser {
  return {
    uid: user.id,
    id: user.id,
    email: user.email ?? null,
    displayName: (user.user_metadata?.full_name ?? user.user_metadata?.name ?? null) as string | null,
    photoURL: (user.user_metadata?.avatar_url ?? null) as string | null,
    providerData: (user.identities ?? []).map((i) => ({
      providerId: i.provider === 'github' ? 'github.com' : `${i.provider}.com`,
      displayName: ((i.identity_data?.name ?? i.identity_data?.full_name) as string | null) ?? null,
      email: (i.identity_data?.email as string | null) ?? null,
      photoURL: (i.identity_data?.avatar_url as string | null) ?? null,
    })),
  };
}

let _cachedUser: CompatUser | null = null;
supabase.auth.onAuthStateChange((_event, session) => {
  _cachedUser = session?.user ? toCompatUser(session.user) : null;
});

export async function sendMagicLink(email: string, redirectUrl: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectUrl },
  });
  if (error) throw error;
  window.localStorage.setItem('emailForSignIn', email);
}

export async function completeMagicLinkSignIn(_email: string, _href: string) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInWithGitHub() {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function sendPasswordReset(email: string, redirectUrl: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
  if (error) throw error;
}

export async function confirmNewPassword(_oobCode: string, newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export function getCurrentUser(): CompatUser | null {
  return _cachedUser;
}

export function onAuthChange(callback: (user: CompatUser | null) => void): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? toCompatUser(session.user) : null);
  });
  return () => subscription.unsubscribe();
}
