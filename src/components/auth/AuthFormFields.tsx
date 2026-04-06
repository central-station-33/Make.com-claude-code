
import { EmailField } from './form-fields/EmailField';
import { useAuthForm } from '@/contexts/auth/AuthFormContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface AuthFormFieldsProps {
  mode?: 'signIn' | 'signUp' | 'resetPassword';
}

const AuthFormFields = ({ 
  mode = 'signIn'
}: AuthFormFieldsProps) => {
  const {
    email,
    setEmail,
    isLoading,
    error
  } = useAuthForm();

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <EmailField 
        value={email} 
        onChange={setEmail} 
        isLoading={isLoading} 
      />
    </div>
  );
};

export default AuthFormFields;
