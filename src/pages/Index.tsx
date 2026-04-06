
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import SignInForm from "@/components/auth/SignInForm";
import { Alert, AlertDescription } from "@/components/ui/alert";

const IndexPage = () => {
  const navigate = useNavigate();
  const { session, loading, error } = useAuth();

  // Enhanced logging for debugging
  console.log('Index page rendered:', {
    hasSession: !!session,
    loading,
    error,
    userEmail: session?.user?.email,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    if (!loading && session?.user) {
      console.log('Redirecting to dashboard, user is authenticated');
      navigate('/dashboard');
    }
  }, [session, navigate, loading]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 animate-in fade-in duration-300">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-[400px] p-8 animate-in fade-in-50">
        <div className="flex flex-col items-center space-y-6 mb-6">
          <img 
            src="/lovable-uploads/9426cd2c-3e5d-46c0-8df6-12e24c277730.png" 
            alt="Logo" 
            className="h-32 w-auto"
          />
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Central Station
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access your account
            </p>
          </div>
        </div>

        <SignInForm />

        <div className="mt-6 text-center">
          <Button 
            variant="link" 
            onClick={() => navigate('/auth')}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Need to create an account?
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default IndexPage;
