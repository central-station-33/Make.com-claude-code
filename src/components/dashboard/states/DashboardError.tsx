
import { AppSidebar } from "@/components/AppSidebar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface DashboardErrorProps {
  error: Error;
}

const DashboardError = ({ error }: DashboardErrorProps) => {
  const queryClient = useQueryClient();

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  const getErrorMessage = (error: Error) => {
    if (error.message.includes("Please sign in")) {
      return "Please sign in to access the dashboard";
    }
    if (error.message.includes("Database error")) {
      return "There was an error loading your data. Please try again.";
    }
    return error.message || "An unexpected error occurred";
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-2xl">
          <Alert variant="destructive" className="animate-fade-in">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">{getErrorMessage(error)}</p>
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="mt-2 hover:bg-primary/10 transition-colors"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </main>
    </div>
  );
};

export default DashboardError;
