
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Profile } from '@/types/database/auth/profiles.types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useProfileData = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getProfile();
  }, []);

  // There is no `profiles` table in the live schema -- the real analog for a
  // signed-in user's editable profile is `team_agents`, keyed by
  // `auth_user_id`. It has no avatar_url column, so avatar upload still
  // writes the image to storage but the URL isn't persisted anywhere; the
  // fallback below is the honest reflection of that, not a bug.
  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/auth');
        return;
      }

      // team_agents isn't in the generated Supabase types at all (they're
      // stale relative to the live schema, same as elsewhere in this repo),
      // so the table name has to be cast past the Tables union.
      const { data, error } = await supabase
        .from('team_agents' as never)
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      const row = data as unknown as {
        id?: string; full_name?: string; email?: string; phone?: string;
        brokerage?: string; license_number?: string; created_at?: string; updated_at?: string;
      } | null;

      setProfile({
        id: row?.id ?? user.id,
        user_id: user.id,
        full_name: row?.full_name ?? '',
        email: row?.email ?? user.email ?? '',
        phone: row?.phone ?? null,
        company: row?.brokerage ?? null,
        license_number: row?.license_number ?? null,
        avatar_url: null,
        created_at: row?.created_at ?? null,
        updated_at: row?.updated_at ?? null,
      } as Profile);
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error loading profile",
        description: "Please try again later"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { avatar_url, company, ...rest } = updates;

      const { error } = await supabase
        .from('team_agents' as never)
        .upsert(
          { auth_user_id: user.id, ...rest, ...(company !== undefined ? { brokerage: company } : {}) } as never,
          { onConflict: 'auth_user_id' }
        );

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates, avatar_url: prev.avatar_url } : null);

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully."
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error instanceof Error ? error.message : "Error updating profile"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/auth');
      toast({
        title: "Signed out successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "Please try again"
      });
    }
  };

  return {
    profile,
    loading,
    uploading,
    setUploading,
    updateProfile,
    handleSignOut,
  };
};
