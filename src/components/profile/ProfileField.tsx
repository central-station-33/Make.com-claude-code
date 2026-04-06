import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}

export const ProfileField = ({ id, label, value, onChange, type = 'text' }: ProfileFieldProps) => {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};