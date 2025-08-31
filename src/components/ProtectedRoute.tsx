
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useHookTripwire } from '@/lib/useHookTripwire';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  useHookTripwire('ProtectedRoute');
  
  // STABLE HOOKS: Always call all hooks in same order, regardless of state
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

  // Allow access in demo mode or if user is authenticated
  if (!isDemo && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role-based access (skip in demo mode)
  if (!isDemo && allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
