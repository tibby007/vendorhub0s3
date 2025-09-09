import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useRoleCheck } from '@/hooks/useRoleCheck';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const { user, loading } = useAuth();
  const { isDemo } = useDemoMode();
  const { isSuperAdmin, isPartnerAdmin, isVendor, currentRole } = useRoleCheck();

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

  // Check role permissions using the proper role checking logic
  if (!isDemo && allowedRoles.length > 0 && user) {
    const hasPermission = allowedRoles.some(role => {
      switch (role) {
        case 'Super Admin':
          return isSuperAdmin();
        case 'Partner Admin':
          return isPartnerAdmin();
        case 'Vendor':
          return isVendor();
        default:
          return currentRole === role;
      }
    });
    
    if (!hasPermission) {
      console.log('🚫 ProtectedRoute - Access denied. Required roles:', allowedRoles, 'Current role:', currentRole, 'User email:', user?.email);
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
