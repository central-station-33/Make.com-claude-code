
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface AuthErrorStateProps {
  error: Error;
  onRetry?: () => void;
}

export const AuthErrorState = ({ error, onRetry }: AuthErrorStateProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Alert variant="destructive" className="w-full max-w-md animate-in fade-in duration-300">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">{error.message}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};
