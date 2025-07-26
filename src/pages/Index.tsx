
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import PartnerAdminDashboard from '@/components/dashboard/PartnerAdminDashboard';
import VendorDashboard from '@/components/dashboard/VendorDashboard';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';

const Index = () => {
  const { user, isLoading, subscriptionData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('🚫 No user on dashboard, redirecting to auth');
      navigate('/auth', { replace: true });
    } else if (user) {
      console.log('✅ User authenticated on dashboard:', { 
        id: user.id, 
        role: user.role, 
        email: user.email 
      });
    }
  }, [user, isLoading, navigate]);

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

  if (!user) {
    return null; // Will redirect to auth page
  }

  // Check if user is a demo user (bypass subscription checks)
  const isDemoUser = user.email?.includes('demo-') || user.user_metadata?.demo_session_id;

  const renderDashboard = () => {
    // Debug role information
    console.log('🎯 INDEX.tsx - User role received:', user.role);
    console.log('🎯 INDEX.tsx - Role type:', typeof user.role);
    console.log('🎯 INDEX.tsx - Role length:', user.role?.length);
    console.log('Role bytes:', Array.from(user.role || '').map(c => c.charCodeAt(0)));
    console.log('Expected bytes:', Array.from("Partner Admin").map(c => c.charCodeAt(0)));
    console.log('🎯 INDEX.tsx - Role === "Partner Admin":', user.role === 'Partner Admin');
    console.log('🎯 Rendering dashboard for role:', user.role, 'User:', user.name, 'Email:', user.email);
    
    // Normalize role for comparison
    const normalizedRole = user.role?.trim();
    
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
