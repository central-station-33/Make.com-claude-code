
import { ReactNode, useEffect } from 'react';
import { useLoadingTracking } from '@/hooks/useLoadingTracking';
import { Loader2 } from 'lucide-react';

interface LoadingBoundaryProps {
  children: ReactNode;
  isLoading: boolean;
  error?: Error | null;
  componentPath: string;
}

export const LoadingBoundary = ({
  children,
  isLoading,
  error,
  componentPath
}: LoadingBoundaryProps) => {
  const { startLoading, endLoading } = useLoadingTracking(componentPath);

  useEffect(() => {
    if (isLoading) {
      startLoading();
    } else {
      endLoading(!error, error);
    }
  }, [isLoading, error, startLoading, endLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Error: {error.message}</p>
      </div>
    );
  }

  return <>{children}</>;
};
