
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthFormProvider } from "@/contexts/auth/AuthFormContext";
import { AppRoutes } from "@/routes/AppRoutes";
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./App.css";

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
      gcTime: 10 * 60 * 1000, // Keep unused data for 10 minutes
      retry: 1,
      refetchOnWindowFocus: false
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AuthFormProvider>
              <AppRoutes />
              <Toaster />
            </AuthFormProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
