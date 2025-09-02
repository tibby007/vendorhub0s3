import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useDemoMode } from '@/hooks/useDemoMode';// import { useHookTripwire } from '@/lib/useHookTripwire'; // Comment out or remove this line

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {  // useHookTripwire('ProtectedRoute'); // And this one
  
  const location = useLocation();
  const { user, loading } = useAuth();
  const { isDemo } = useDemoMode();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vendor-green-500"></div>
      </div>
    );
  }

  if (!isDemo && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isDemo && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
