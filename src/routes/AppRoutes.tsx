
import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';

// Lazy load components
const ResetPasswordPage = lazy(() => import(/* webpackChunkName: "reset-password" */ '@/pages/ResetPassword'));
const DashboardPage = lazy(() => import(/* webpackChunkName: "dashboard" */ '@/pages/Dashboard'));
const Settings = lazy(() => import(/* webpackChunkName: "settings" */ '@/pages/Settings'));
const Profile = lazy(() => import(/* webpackChunkName: "profile" */ '@/pages/Profile'));
const IndexPage = lazy(() => import(/* webpackChunkName: "index" */ '@/pages/Index'));
const LeadDetails = lazy(() => import(/* webpackChunkName: "lead-details" */ '@/pages/LeadDetails'));
const SalesFunnel = lazy(() => import(/* webpackChunkName: "sales-funnel" */ '@/pages/SalesFunnel'));
const Marketing = lazy(() => import(/* webpackChunkName: "marketing" */ '@/pages/Marketing'));
const Communications = lazy(() => import(/* webpackChunkName: "communications" */ '@/pages/Communications'));
const InRangeHub = lazy(() => import(/* webpackChunkName: "inrange-hub" */ '@/pages/InRangeHub'));
const InRangeLeads = lazy(() => import(/* webpackChunkName: "inrange-leads" */ '@/pages/InRangeLeads'));
const InRangeLeadDetail = lazy(() => import(/* webpackChunkName: "inrange-detail" */ '@/pages/InRangeLeadDetail'));
const InRangeAddLead = lazy(() => import(/* webpackChunkName: "inrange-add" */ '@/pages/InRangeAddLead'));
const InRangeImportCSV = lazy(() => import(/* webpackChunkName: "inrange-import" */ '@/pages/InRangeImportCSV'));
const InRangeLists = lazy(() => import(/* webpackChunkName: "inrange-lists" */ '@/pages/InRangeLists'));
const InRangeTeam = lazy(() => import(/* webpackChunkName: "inrange-team" */ '@/pages/InRangeTeam'));
const RentalLeads = lazy(() => import(/* webpackChunkName: "rental-leads" */ '@/pages/RentalLeads'));
const RentalLeadDetail = lazy(() => import(/* webpackChunkName: "rental-lead-detail" */ '@/pages/RentalLeadDetail'));
const LandlordLeads = lazy(() => import(/* webpackChunkName: "landlord-leads" */ '@/pages/LandlordLeads'));
const LandlordLeadDetail = lazy(() => import(/* webpackChunkName: "landlord-lead-detail" */ '@/pages/LandlordLeadDetail'));
const Brands = lazy(() => import(/* webpackChunkName: "brands" */ '@/pages/Brands'));
const ExclusiveProperty = lazy(() => import(/* webpackChunkName: "exclusive-property" */ '@/pages/ExclusiveProperty'));

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

  return <AppLayout>{children}</AppLayout>;
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
        
        {/* AuthPage.tsx was a near-duplicate of IndexPage's own sign-in
            card; removed in favor of a single login page at "/". */}
        <Route path="/auth" element={<Navigate to="/" replace />} />

        {/* No session or PrivateRoute gate: Supabase's client establishes a
            recovery session from the emailed link's URL on load, which is
            what this page needs, regardless of any pre-existing session. */}
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

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
          path="/inrange"
          element={
            <PrivateRoute>
              <InRangeHub />
            </PrivateRoute>
          }
        />
        <Route
          path="/inrange/leads"
          element={
            <PrivateRoute>
              <InRangeLeads />
            </PrivateRoute>
          }
        />
        <Route
          path="/inrange/add"
          element={
            <PrivateRoute>
              <InRangeAddLead />
            </PrivateRoute>
          }
        />
        <Route
          path="/brands"
          element={
            <PrivateRoute>
              <Brands />
            </PrivateRoute>
          }
        />
        <Route
          path="/team"
          element={
            <PrivateRoute>
              <InRangeTeam />
            </PrivateRoute>
          }
        />
        <Route
          path="/inrange/import"
          element={
            <PrivateRoute>
              <InRangeImportCSV />
            </PrivateRoute>
          }
        />
        <Route
          path="/inrange/lists"
          element={
            <PrivateRoute>
              <InRangeLists />
            </PrivateRoute>
          }
        />
        <Route
          path="/inrange/:id"
          element={
            <PrivateRoute>
              <InRangeLeadDetail />
            </PrivateRoute>
          }
        />

        {/* Rental Leasing module */}
        <Route
          path="/leasing/renters"
          element={
            <PrivateRoute>
              <RentalLeads />
            </PrivateRoute>
          }
        />
        <Route
          path="/leasing/renters/:id"
          element={
            <PrivateRoute>
              <RentalLeadDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/leasing/landlords"
          element={
            <PrivateRoute>
              <LandlordLeads />
            </PrivateRoute>
          }
        />
        <Route
          path="/leasing/landlords/:id"
          element={
            <PrivateRoute>
              <LandlordLeadDetail />
            </PrivateRoute>
          }
        />

        {/* Exclusive Leasing module (e.g. Solace). RLS limits data to brokers + property team. */}
        <Route
          path="/exclusives/:slug"
          element={
            <PrivateRoute>
              <ExclusiveProperty />
            </PrivateRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
