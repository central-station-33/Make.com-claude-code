
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PasswordField, passwordRequirements } from './form-fields/PasswordField';
import { useAuthForm } from '@/contexts/auth/AuthFormContext';
import { useState } from 'react';

interface ResetPasswordFormProps {
  onBackToSignIn: () => void;
  token: string;
}

const ResetPasswordForm = ({ onBackToSignIn, token }: ResetPasswordFormProps) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { isLoading, error, success, handleResetPassword } = useAuthForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    await handleResetPassword(token, password);
  };

  // Match the checklist PasswordField actually displays (showRequirements)
  // instead of a separate, looser length-only check -- previously this let
  // "Set Password" enable at 6 characters while the on-screen checklist
  // still showed several rules unmet, which is confusing and let weak
  // passwords through despite the UI implying otherwise.
  const meetsAllRequirements = passwordRequirements.every(({ rule }) => rule.test(password));
  const isValidPassword = Boolean(password) && password === confirmPassword && meetsAllRequirements;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>
            Your password has been set successfully. You can now sign in with your new password.
          </AlertDescription>
        </Alert>
      )}
      <div className="space-y-4">
        <PasswordField
          password={password}
          setPassword={setPassword}
          isLoading={isLoading}
          showRequirements
          label="New Password"
          id="new-password"
          placeholder="Enter your new password"
          autoComplete="new-password"
        />
        <PasswordField
          password={confirmPassword}
          setPassword={setConfirmPassword}
          isLoading={isLoading}
          label="Confirm Password"
          id="confirm-password"
          placeholder="Confirm your new password"
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-4">
        {!success && (
          <Button 
            type="submit" 
            className="w-full"
            disabled={isLoading || !isValidPassword}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting password...
              </div>
            ) : (
              'Set Password'
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
      </div>
    </form>
  );
};

export default ResetPasswordForm;
