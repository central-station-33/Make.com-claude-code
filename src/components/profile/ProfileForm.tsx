import { Profile } from '@/types/database/auth/profiles.types';
import { Button } from '@/components/ui/button';
import { ProfileField } from './ProfileField';

interface ProfileFormProps {
  profile: Profile | null;
  onProfileChange: (field: keyof Profile, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ProfileForm = ({ profile, onProfileChange, onSubmit }: ProfileFormProps) => {
  if (!profile) return null;

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <ProfileField
          id="full_name"
          label="Full Name"
          value={profile.full_name}
          onChange={(value) => onProfileChange('full_name', value)}
        />
        
        <ProfileField
          id="email"
          label="Email"
          type="email"
          value={profile.email}
          onChange={(value) => onProfileChange('email', value)}
        />
        
        <ProfileField
          id="phone"
          label="Phone"
          type="tel"
          value={profile.phone || ''}
          onChange={(value) => onProfileChange('phone', value)}
        />
        
        <ProfileField
          id="company"
          label="Company"
          value={profile.company || ''}
          onChange={(value) => onProfileChange('company', value)}
        />

        <Button type="submit" className="w-full">
          Update Profile
        </Button>
      </div>
    </form>
  );
};