
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiresSubscription?: boolean;
  requiredTier?: 'Basic' | 'Pro' | 'Premium';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  requiresSubscription = false,
  requiredTier = 'Basic'
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vendor-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Check if user is a demo user (bypass subscription checks)
  const isDemoUser = user.email?.includes('demo-') || user.user_metadata?.demo_session_id;

  if (requiresSubscription && !isDemoUser) {
    return (
      <SubscriptionGuard requiredTier={requiredTier}>
        {children}
      </SubscriptionGuard>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
