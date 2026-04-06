
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

  const [signInMethod, setSignInMethod] = useState<'password' | 'magic'>('password');
  const [password, setPassword] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      console.log('Attempting sign in with:', { email, method: signInMethod });
      await handleSignIn(email, signInMethod === 'password' ? password : undefined);
    }
  }, [email, handleSignIn, signInMethod, password]);

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
        <EmailField 
          value={email} 
          onChange={setEmail}
          isLoading={isLoading}
        />

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading || signInMethod === 'magic'}
            placeholder="Enter your password"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading || isRateLimited || !email || (signInMethod === 'password' && !password)}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {signInMethod === 'magic' ? 'Sending magic link...' : 'Signing in...'}
            </div>
          ) : (
            signInMethod === 'magic' ? 'Sign In with Magic Link' : 'Sign In with Password'
          )}
        </Button>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={() => setSignInMethod(method => method === 'magic' ? 'password' : 'magic')}
            className="text-gray-600 hover:text-gray-900"
          >
            {signInMethod === 'magic' ? 'Use Password Instead' : 'Use Magic Link Instead'}
          </Button>
        </div>
      </div>
    </form>
  );
});

SignInForm.displayName = 'SignInForm';

export default SignInForm;
