
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PrivateRouteProps {
  children?: React.ReactNode;
  requireAdmin?: boolean;
}

export const PrivateRoute = ({ requireAdmin = false }: PrivateRouteProps) => {
  const { session, userRole } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  console.log('PrivateRoute check:', {
    hasSession: !!session,
    userRole,
    requireAdmin,
    currentPath: location.pathname,
  });

  if (!session) {
    console.log('No session found, redirecting to auth');
    toast({
      title: "Session Expired",
      description: "Please sign in again to continue",
      variant: "destructive",
    });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireAdmin && userRole !== 'admin') {
    console.log('Access denied - not an admin');
    toast({
      title: "Access Denied",
      description: "You don't have permission to access this page",
      variant: "destructive",
    });
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
