
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, signOut as firebaseSignOut } from "@/integrations/firebase/authHelpers";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error("Error caught by boundary:", error);
    return { 
      hasError: true, 
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    
    // Log unauthorized access attempts
    if (error.message.includes('unauthorized') || error.message.includes('forbidden')) {
      this.logUnauthorizedAccess(error);
    }

    this.setState({
      error,
      errorInfo
    });
  }

  private async logUnauthorizedAccess(error: Error) {
    try {
      const user = getCurrentUser();
      if (user) {
        await supabase.from('unauthorized_access_attempts').insert({
          user_id: user.uid,
          lead_id: this.extractLeadId(), // You would need to implement this based on your URL structure
          ip_address: window.location.hostname,
          user_agent: navigator.userAgent
        });
      }
    } catch (err) {
      console.error('Failed to log unauthorized access:', err);
    }
  }

  private extractLeadId(): string {
    // Extract lead ID from URL if present
    const pathSegments = window.location.pathname.split('/');
    const leadIdIndex = pathSegments.indexOf('leads') + 1;
    return pathSegments[leadIdIndex] || '00000000-0000-0000-0000-000000000000';
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-6 max-w-lg mx-auto mt-8 animate-in fade-in-50">
          <Alert variant="destructive" className="items-start">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <AlertTitle className="text-lg font-semibold">Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4 text-sm opacity-90">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <pre className="text-xs bg-secondary/10 p-4 rounded-md overflow-auto max-h-[200px] mb-4">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
              <Button 
                onClick={this.handleReset}
                variant="outline"
                className="mt-2 w-full sm:w-auto animate-in fade-in-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Application
              </Button>
            </AlertDescription>
          </Alert>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
