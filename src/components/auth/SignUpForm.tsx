
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthForm } from '@/contexts/auth/AuthFormContext';
import { RateLimitAlerts } from './alerts/RateLimitAlerts';
import { getAuthErrorMessage } from '@/utils/authErrors';
import { EmailField } from './form-fields/EmailField';

interface SignUpFormProps {
  onSignIn: () => void;
}

const SignUpForm = ({ onSignIn }: SignUpFormProps) => {
  const {
    email,
    setEmail,
    isLoading,
    error,
    handleSignUp,
    remainingAttempts,
    isRateLimited,
    timeRemaining,
  } = useAuthForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      await handleSignUp(email);
    }
  };

  const isFormValid = email?.trim() && !isRateLimited;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{getAuthErrorMessage(error.message)}</AlertDescription>
        </Alert>
      )}
      
      <EmailField 
        value={email} 
        onChange={setEmail}
        isLoading={isLoading}
      />

      <RateLimitAlerts
        remainingAttempts={remainingAttempts}
        isRateLimited={isRateLimited}
        timeRemaining={timeRemaining}
      />

      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading || !isFormValid}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </div>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  );
};

export default SignUpForm;
