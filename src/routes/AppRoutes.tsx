
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Lazy load components
const AuthPage = lazy(() => import(/* webpackChunkName: "auth" */ '@/components/auth/AuthPage'));
const DashboardPage = lazy(() => import(/* webpackChunkName: "dashboard" */ '@/pages/Dashboard'));
const Settings = lazy(() => import(/* webpackChunkName: "settings" */ '@/pages/Settings'));
const Profile = lazy(() => import(/* webpackChunkName: "profile" */ '@/pages/Profile'));
const IndexPage = lazy(() => import(/* webpackChunkName: "index" */ '@/pages/Index'));
const LeadDetails = lazy(() => import(/* webpackChunkName: "lead-details" */ '@/pages/LeadDetails'));
const SalesFunnel = lazy(() => import(/* webpackChunkName: "sales-funnel" */ '@/pages/SalesFunnel'));
const Marketing = lazy(() => import(/* webpackChunkName: "marketing" */ '@/pages/Marketing'));
const Communications = lazy(() => import(/* webpackChunkName: "communications" */ '@/pages/Communications'));
const TheWire = lazy(() => import(/* webpackChunkName: "the-wire" */ '@/pages/TheWire'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="text-center space-y-4 animate-in fade-in duration-300">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  
  // Log auth state for debugging private routes
  console.log('PrivateRoute check:', {
    hasSession: !!session,
    loading,
    userEmail: session?.user?.email
  });
  
  if (loading) {
    return <PageLoader />;
  }
  
  if (!session) {
    console.log('No session, redirecting to auth');
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export const AppRoutes = () => {
  const { session, loading } = useAuth();

  // Log overall routing state
  console.log('AppRoutes auth state:', {
    hasSession: !!session,
    loading,
    userEmail: session?.user?.email
  });

  // Show loading state while checking auth
  if (loading) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={session ? <Navigate to="/dashboard" replace /> : <IndexPage />} 
        />
        
        <Route 
          path="/auth" 
          element={session ? <Navigate to="/dashboard" replace /> : <AuthPage />} 
        />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/leads/:id" 
          element={
            <PrivateRoute>
              <LeadDetails />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/sales-funnel" 
          element={
            <PrivateRoute>
              <SalesFunnel />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/marketing" 
          element={
            <PrivateRoute>
              <Marketing />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/communications" 
          element={
            <PrivateRoute>
              <Communications />
            </PrivateRoute>
          } 
        />

        <Route
          path="/the-wire"
          element={
            <PrivateRoute>
              <TheWire />
            </PrivateRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
