import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface RememberMeFieldProps {
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  isLoading: boolean;
}

export const RememberMeField = ({
  rememberMe,
  setRememberMe,
  isLoading,
}: RememberMeFieldProps) => (
  <div className="flex items-center space-x-2">
    <Checkbox
      id="remember"
      checked={rememberMe}
      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
      disabled={isLoading}
      aria-label="Remember me"
    />
    <Label
      htmlFor="remember"
      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed"
    >
      Remember me
    </Label>
  </div>
);