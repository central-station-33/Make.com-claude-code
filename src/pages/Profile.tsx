
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database/auth/profiles.types';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Button } from '@/components/ui/button';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileLoadingState } from '@/components/profile/ProfileLoadingState';
import { useProfileData } from '@/hooks/profile/useProfileData';

const ProfilePage = () => {
  const { toast } = useToast();
  const {
    profile,
    loading,
    uploading,
    setUploading,
    updateProfile,
    handleSignOut
  } = useProfileData();

  const handleProfileChange = (field: keyof Profile, value: string) => {
    if (profile) {
      updateProfile({ [field]: value });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile?.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile({ avatar_url: publicUrl });
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error uploading avatar",
        description: error instanceof Error ? error.message : "Error uploading avatar"
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <ProfileLoadingState />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <ProfileHeader />
        <CardContent className="space-y-6">
          <ProfileAvatar 
            profile={profile}
            uploading={uploading}
            onUpload={handleAvatarUpload}
          />
          
          <ProfileForm
            profile={profile}
            onProfileChange={handleProfileChange}
            onSubmit={(e) => {
              e.preventDefault();
              if (profile) {
                updateProfile(profile);
              }
            }}
          />

          <div className="pt-6 border-t">
            <Button 
              variant="destructive" 
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
