import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { ForgotPasswordButtons } from './buttons/ForgotPasswordButtons';
import { useAuthForm } from '@/contexts/auth/AuthFormContext';
import { useState, useCallback } from 'react';

interface ForgotPasswordFormProps {
  onBackToSignIn: () => void;
}

const ForgotPasswordForm = ({ onBackToSignIn }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const { isLoading, error, success, handleForgotPassword } = useAuthForm();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    await handleForgotPassword(email);
  }, [email, handleForgotPassword]);

  const isValidEmail = email && email.includes('@') && email.includes('.');

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
          <AlertDescription className="space-y-2">
            <p>Password reset instructions have been sent to your email.</p>
            <p className="text-sm text-muted-foreground">
              Please check your inbox and spam folder. The link expires in 24 hours.
            </p>
          </AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading || success}
          className="w-full"
          placeholder="Enter your email"
          autoComplete="email"
          pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
          title="Please enter a valid email address"
        />
      </div>
      <ForgotPasswordButtons
        isLoading={isLoading}
        isDisabled={!isValidEmail}
        onBackToSignIn={onBackToSignIn}
        showSubmitButton={!success}
      />
    </form>
  );
};

export default ForgotPasswordForm;