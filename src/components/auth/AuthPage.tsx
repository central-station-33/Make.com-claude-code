
import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { AuthFormProvider } from "@/contexts/auth/AuthFormContext";
import { Loader2 } from "lucide-react";
import SignInForm from "./SignInForm";

const AuthPage = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  useEffect(() => {
    if (session?.user) {
      console.log('AuthPage: User is authenticated, redirecting to dashboard');
      navigate("/dashboard", { replace: true });
    }
  }, [session, navigate]);

  // Memoize the loading state UI
  const loadingUI = useMemo(() => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/80 dark:bg-gray-900/80">
      <div className="text-center space-y-4 animate-in fade-in-50">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  ), []);

  if (loading) {
    return loadingUI;
  }

  if (session?.user) {
    return loadingUI;
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Card className="p-6 bg-white">
          <div className="flex flex-col space-y-2 text-center mb-4">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/9426cd2c-3e5d-46c0-8df6-12e24c277730.png" 
                alt="JRA Logo" 
                className="h-[9.9rem] w-auto"
              />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Central Station
            </h1>
            <p className="text-sm text-muted-foreground">
              {inviteToken ? "Enter your credentials to access your account" : "Sign in to your account"}
            </p>
          </div>
          <AuthFormProvider>
            <SignInForm />
          </AuthFormProvider>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
