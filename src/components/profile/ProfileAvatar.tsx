import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Profile } from '@/types/database/auth/profiles.types';

interface ProfileAvatarProps {
  profile: Profile | null;
  uploading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileAvatar = ({ profile, uploading, onUpload }: ProfileAvatarProps) => {
  return (
    <div className="mb-6">
      <Avatar className="w-20 h-20">
        <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'Avatar'} />
        <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
      </Avatar>
      
      <div className="mt-4">
        <Label htmlFor="avatar">Change Avatar</Label>
        <Input
          id="avatar"
          type="file"
          accept="image/*"
          onChange={onUpload}
          disabled={uploading}
          className="mt-2"
        />
      </div>
    </div>
  );
};