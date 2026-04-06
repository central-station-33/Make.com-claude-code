
import { useState } from 'react';
import SignInForm from '../SignInForm';
import SignUpForm from '../SignUpForm';
import ForgotPasswordForm from '../ForgotPasswordForm';
import ResetPasswordForm from '../ResetPasswordForm';
import { AuthFormMode } from '@/types/auth/form.types';
import { Button } from '@/components/ui/button';

const AuthForms = () => {
  const [mode, setMode] = useState<AuthFormMode>('signIn');

  const handleForgotPassword = () => setMode('forgotPassword');
  const handleBackToSignIn = () => setMode('signIn');
  const handleSignUpClick = () => setMode('signUp');
  const handleSignInClick = () => setMode('signIn');

  return (
    <div>
      {mode === 'signIn' && (
        <>
          <SignInForm />
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Need to create an account?{' '}
              <Button variant="link" className="p-0" onClick={handleSignUpClick}>
                Sign up
              </Button>
            </p>
          </div>
        </>
      )}
      {mode === 'signUp' && (
        <>
          <SignUpForm onSignIn={handleSignInClick} />
          <div className="mt-4 text-center">
            <Button variant="outline" className="w-full" onClick={handleSignInClick}>
              Back to Sign In
            </Button>
          </div>
        </>
      )}
      {mode === 'forgotPassword' && (
        <ForgotPasswordForm onBackToSignIn={handleBackToSignIn} />
      )}
      {mode === 'resetPassword' && (
        <ResetPasswordForm onBackToSignIn={handleBackToSignIn} token="" />
      )}
    </div>
  );
};

export default AuthForms;
