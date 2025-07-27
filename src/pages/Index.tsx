
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useSubscriptionManager } from '@/hooks/useSubscriptionManager';
import { useNavigate, useLocation } from 'react-router-dom';
import { shouldRedirectToSubscription } from '@/utils/subscriptionUtils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import PartnerAdminDashboard from '@/components/dashboard/PartnerAdminDashboard';
import VendorDashboard from '@/components/dashboard/VendorDashboard';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';

const Index = () => {
  const { user, isLoading } = useAuth();
  const { isDemo, demoRole } = useDemoMode();
  const { subscription } = useSubscriptionManager();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // In demo mode, don't redirect to auth
    if (isDemo && demoRole) {
      console.log('🎭 Demo mode active on dashboard, role:', demoRole);
      return;
    }
    
    if (!isLoading && !user) {
      console.log('🚫 No user on dashboard, redirecting to auth');
      navigate('/auth', { replace: true });
    } else if (user) {
      console.log('✅ User authenticated on dashboard:', { 
        id: user.id, 
        role: user.role, 
        email: user.email 
      });
      
      // Check if user should be redirected to subscription setup
      // For new users or users without subscription, redirect to subscription page
      if (!isDemo && !subscription.subscribed && subscription.status !== 'trial' && subscription.status !== 'loading') {
        console.log('🆕 User needs subscription setup, redirecting to subscription');
        navigate('/subscription', { replace: true });
        return;
      }
    }
  }, [user, isLoading, navigate, isDemo, demoRole, subscription, location.pathname]);

  if (isLoading) {
    console.log('⏳ Dashboard loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vendor-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading VendorHub...</p>
        </div>
      </div>
    );
  }

  // In demo mode, allow access even without a real user
  if (!user && !isDemo) {
    return null; // Will redirect to auth page
  }

  // Check if user is a demo user (bypass subscription checks)
  const isDemoUser = isDemo || user?.email?.includes('demo-') || user?.user_metadata?.demo_session_id;

  const renderDashboard = () => {
    // In demo mode, use demo role, otherwise use user_metadata.role or user.role
    const currentRole = isDemo ? demoRole : user?.user_metadata?.role || user?.role;
    const currentName = user?.user_metadata?.name || user?.name;
    
    // Debug role information
    console.log('🎯 INDEX.tsx - Demo mode:', isDemo);
    console.log('🎯 INDEX.tsx - Demo role:', demoRole);
    console.log('🎯 INDEX.tsx - User role:', user?.user_metadata?.role || user?.role);
    console.log('🎯 INDEX.tsx - Current role:', currentRole);
    console.log('🎯 Rendering dashboard for role:', currentRole, 'User:', currentName, 'Email:', user?.email);
    
    // Normalize role for comparison
    const normalizedRole = currentRole?.trim();
    
    switch (normalizedRole) {
      case 'Super Admin':
        console.log('📊 Loading Super Admin dashboard');
        return <SuperAdminDashboard />;
      case 'Partner Admin':
        // Partner Admin features require subscription (unless demo)
        if (isDemoUser) {
          return <PartnerAdminDashboard />;
        }
        // For new Partner Admins, show trial access with prominent subscription prompt
        return (
          <SubscriptionGuard 
            requiredTier="Basic"
            fallbackMessage="Welcome to VendorHub! Start your free trial to access the full partner management dashboard and begin adding vendors."
            showTrialAccess={true}
          >
            <PartnerAdminDashboard />
          </SubscriptionGuard>
        );
      case 'Vendor':
        // Vendor features require subscription (unless demo)
        if (isDemoUser) {
          return <VendorDashboard />;
        }
        return (
          <SubscriptionGuard 
            requiredTier="Basic"
            fallbackMessage="Vendor features require your partner to have an active subscription. Please contact your partner administrator."
          >
            <VendorDashboard />
          </SubscriptionGuard>
        );
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Unknown Role</h1>
              <p className="text-gray-600">Please contact your administrator.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
};

export default Index;
