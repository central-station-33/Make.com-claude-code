
import { useCallback, memo } from "react";
import { useAuthForm } from "@/contexts/auth/AuthFormContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { getAuthErrorMessage } from "@/utils/authErrors";
import { EmailField } from "./form-fields/EmailField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SignInForm = memo(() => {
  const {
    email,
    setEmail,
    handleSignIn,
    isLoading,
    error,
    isRateLimited,
    timeRemaining
  } = useAuthForm();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [password, setPassword] = useState('');
  const [signupDone, setSignupDone] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signingUp, setSigningUp] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      await handleSignIn(email, password);
    }
  }, [email, handleSignIn, password]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetting(true);
    setResetError('');
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      setResetError(error.message);
    } else {
      setResetSent(true);
    }
    setResetting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningUp(true);
    setSignupError('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setSignupError(error.message);
    } else {
      setSignupDone(true);
    }
    setSigningUp(false);
  };

  if (mode === 'forgot') {
    return (
      <form onSubmit={handleForgotPassword} className="space-y-4">
        {resetSent ? (
          <Alert>
            <AlertDescription>
              If an account exists for that email, a password reset link has been sent. Check your inbox (and spam folder) — the link expires in 24 hours.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {resetError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{resetError}</AlertDescription>
              </Alert>
            )}
            <EmailField value={resetEmail} onChange={setResetEmail} isLoading={resetting} />
            <Button type="submit" className="w-full" disabled={resetting || !resetEmail}>
              {resetting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
            </Button>
          </>
        )}
        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={() => { setMode('signin'); setResetSent(false); setResetError(''); }}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to sign in
          </Button>
        </div>
      </form>
    );
  }

  if (mode === 'signup') {
    return (
      <form onSubmit={handleSignUp} className="space-y-4">
        {signupDone ? (
          <Alert>
            <AlertDescription>
              Account created! Check your email to confirm, or go back and sign in directly if email confirmation is off.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {signupError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{signupError}</AlertDescription>
              </Alert>
            )}
            <EmailField value={email} onChange={setEmail} isLoading={signingUp} />
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={signingUp}
                placeholder="Create a password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={signingUp || !email || !password}>
              {signingUp ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : 'Create Account'}
            </Button>
          </>
        )}
        <div className="text-center">
          <Button type="button" variant="link" onClick={() => setMode('signin')} className="text-gray-600 hover:text-gray-900">
            Already have an account? Sign in
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{getAuthErrorMessage(error.message)}</AlertDescription>
        </Alert>
      )}
      {isRateLimited && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Too many attempts. Please try again in {Math.ceil(timeRemaining / 60)} minutes.
          </AlertDescription>
        </Alert>
      )}
      <div className="space-y-4">
        <EmailField value={email} onChange={setEmail} isLoading={isLoading} />
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="Enter your password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading || isRateLimited || !email || !password}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : 'Sign In'}
        </Button>
        <div className="flex items-center justify-between">
          <Button type="button" variant="link" onClick={() => setMode('signup')} className="text-gray-600 hover:text-gray-900 px-0">
            No account? Create one
          </Button>
          <Button type="button" variant="link" onClick={() => { setMode('forgot'); setResetEmail(email); }} className="text-gray-600 hover:text-gray-900 px-0">
            Forgot password?
          </Button>
        </div>
      </div>
    </form>
  );
});

SignInForm.displayName = 'SignInForm';

export default SignInForm;
