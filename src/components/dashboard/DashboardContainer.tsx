
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "../AppSidebar";
import Dashboard from "./Dashboard";
import DashboardLoading from "./states/DashboardLoading";
import { AgentPerformanceSection } from "@/components/owner/dashboard/AgentPerformanceSection";
import { useToast } from "@/hooks/use-toast";
import { LoadingBoundary } from "@/components/common/LoadingBoundary";

const DashboardContainer = () => {
  const { session, loading, userRole } = useAuth();
  const { toast } = useToast();

  // Enhanced logging for debugging
  console.log('Dashboard container render:', {
    hasSession: !!session,
    loading,
    userRole,
    userEmail: session?.user?.email,
    timestamp: new Date().toISOString()
  });

  // Show loading state while auth is being checked
  if (loading) {
    return <DashboardLoading />;
  }

  // If no session, return null as AppRoutes will handle redirect
  if (!session) {
    console.log('No session in dashboard, redirecting...');
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-8 animate-in fade-in duration-300">
          <LoadingBoundary
            isLoading={false}
            componentPath="DashboardContainer"
          >
            {userRole === 'owner' && (
              <div className="mb-6">
                <h1 className="text-3xl font-semibold tracking-tight">Owner Dashboard</h1>
                <p className="text-muted-foreground mt-2">Manage your team and monitor performance</p>
              </div>
            )}
            <Dashboard />
            {userRole === 'owner' && (
              <AgentPerformanceSection 
                data={[]}
                isLoading={false}
              />
            )}
          </LoadingBoundary>
        </div>
      </main>
    </div>
  );
};

export default DashboardContainer;
