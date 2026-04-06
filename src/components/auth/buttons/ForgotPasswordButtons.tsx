import { Button } from '@/components/ui/button';

interface ForgotPasswordButtonsProps {
  isLoading: boolean;
  isDisabled: boolean;
  onBackToSignIn: () => void;
  showSubmitButton: boolean;
}

export const ForgotPasswordButtons = ({
  isLoading,
  isDisabled,
  onBackToSignIn,
  showSubmitButton,
}: ForgotPasswordButtonsProps) => {
  return (
    <>
      {showSubmitButton && (
        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading || isDisabled}
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⚪</span>
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </Button>
      )}
      <Button
        type="button"
        variant="link"
        className="w-full"
        onClick={onBackToSignIn}
        disabled={isLoading}
      >
        Back to sign in
      </Button>
    </>
  );
};