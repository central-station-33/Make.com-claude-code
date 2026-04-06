import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export interface SignInButtonsProps {
  isLoading: boolean;
  isDisabled: boolean;
  onForgotPassword: () => void;
}

export const SignInButtons = ({
  isLoading,
  isDisabled,
  onForgotPassword,
}: SignInButtonsProps) => {
  return (
    <div className="space-y-4">
      <Button 
        type="submit" 
        className="w-full bg-black hover:bg-black/90 text-white"
        disabled={isLoading || isDisabled}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </div>
        ) : (
          'Sign In'
        )}
      </Button>
      
      <div className="flex flex-col space-y-2">
        <Button
          type="button"
          variant="link"
          className="w-full text-black hover:text-black/80"
          onClick={onForgotPassword}
          disabled={isLoading}
        >
          Forgot password?
        </Button>
      </div>
    </div>
  );
};