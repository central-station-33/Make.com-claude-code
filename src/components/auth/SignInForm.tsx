
import { useCallback, memo, useState } from "react";
import { useAuthForm } from "@/contexts/auth/AuthFormContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { getAuthErrorMessage } from "@/utils/authErrors";
import { EmailField } from "./form-fields/EmailField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithGitHub } from "@/integrations/firebase/authHelpers";

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
  const [githubLoading, setGithubLoading] = useState(false);

  const handleGitHubSignIn = useCallback(async () => {
    setGithubLoading(true);
    try {
      await signInWithGitHub();
    } finally {
      setGithubLoading(false);
    }
  }, []);

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

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={handleGitHubSignIn}
        disabled={githubLoading || isLoading}
      >
        {githubLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
        )}
        Continue with GitHub
      </Button>
    </form>
  );
});

SignInForm.displayName = 'SignInForm';

export default SignInForm;
