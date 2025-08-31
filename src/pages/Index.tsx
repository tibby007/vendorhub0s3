
import React, { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useSubscriptionManager } from '@/hooks/useSubscriptionManager';
import { useNavigate, useLocation } from 'react-router-dom';
import { shouldRedirectToSubscription } from '@/utils/subscriptionUtils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import PartnerAdminDashboard from '@/components/dashboard/PartnerAdminDashboard';
import VendorDashboard from '@/components/dashboard/VendorDashboard';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { supabase } from '@/integrations/supabase/client';
import { secureLogger } from '@/utils/secureLogger';
import { useHookTripwire } from '@/lib/useHookTripwire';

const Index = () => {
  // CRITICAL: ALL HOOKS MUST BE CALLED UNCONDITIONALLY IN SAME ORDER EVERY RENDER
  useHookTripwire('Index-Dashboard');
  const { user, isLoading } = useAuth();
  const { isDemo, demoRole } = useDemoMode();
  const { subscription } = useSubscriptionManager();
  const navigate = useNavigate();
  const location = useLocation();

  // All hooks called BEFORE any conditional logic or early returns
  useEffect(() => {
    // Check for subscription success parameter
    const urlParams = new URLSearchParams(location.search);
    const subscriptionSuccess = urlParams.get('subscription');
    const sessionId = urlParams.get('session_id');
    
    // In demo mode, don't redirect to auth
    if (isDemo && demoRole) {
      secureLogger.info('Demo mode active on dashboard', {
        component: 'Index',
        action: 'demo_mode_active',
        demoRole
      });
      return;
    }
    
    if (!isLoading && !user) {
      secureLogger.info('No user on dashboard, redirecting to auth', {
        component: 'Index',
        action: 'no_user_redirect'
      });
      navigate('/auth', { replace: true });
    } else if (user) {
      secureLogger.info('User authenticated on dashboard', {
        component: 'Index',
        action: 'user_authenticated',
        userId: user.id,
        userRole: user.role
      });
      
      // If user just completed subscription, don't redirect them back
      if (subscriptionSuccess === 'success' || sessionId) {
        secureLogger.info('User just completed subscription checkout', {
          component: 'Index',
          action: 'subscription_checkout_complete',
          sessionId: !!sessionId
        });
        // Clean up URL params and force subscription refresh
        navigate('/dashboard', { replace: true });
        // Force refresh subscription data after successful payment
        setTimeout(async () => {
          secureLogger.info('Post-checkout: Refreshing subscription context', {
            component: 'Index',
            action: 'post_checkout_refresh'
          });
          // Trigger subscription context refresh
          window.location.reload(); // Simple reload to refresh all contexts
        }, 2000); // Wait 2 seconds for webhook to process
        return;
      }
      
      // If subscription hasn't been checked yet (initial load), trigger a refresh
      if (subscription.status === 'loading' && subscription.lastUpdated === 0) {
        // Prevent infinite loops - max 3 attempts
        const attemptCount = sessionStorage.getItem('subscription_check_attempts') || '0';
        if (parseInt(attemptCount) >= 3) {
          secureLogger.warn('Max subscription check attempts reached, allowing dashboard access', {
            component: 'Index',
            action: 'max_attempts_reached'
          });
          sessionStorage.removeItem('subscription_check_attempts');
          return;
        }
        sessionStorage.setItem('subscription_check_attempts', (parseInt(attemptCount) + 1).toString());
        
        // Small delay to ensure session is available
        setTimeout(async () => {
          // Skip subscription check in demo mode
          const isDemoMode = sessionStorage.getItem('demoCredentials') !== null;
          if (isDemoMode) {
            secureLogger.info('Demo mode detected - skipping subscription check', {
              component: 'Index',
              action: 'demo_mode_bypass'
            });
            sessionStorage.removeItem('subscription_check_attempts');
            return;
          }
          
          secureLogger.info('Triggering subscription refresh', {
            component: 'Index',
            action: 'subscription_refresh'
          });
          // Use a direct supabase call since context sync might be broken
          try {
            const { data, error } = await supabase.functions.invoke('check-subscription');
            // Clear attempt counter on success
            sessionStorage.removeItem('subscription_check_attempts');
            // Only redirect BROKERS if they have no subscription AND no active trial
            // CRITICAL: Vendors should NEVER be redirected to subscription page
            // OWNER BYPASS: support@emergestack.dev NEVER gets redirected to subscription
            const userRole = user.user_metadata?.role || user.role;
            const isBrokerRole = userRole === 'Partner Admin' || userRole === 'Broker Admin';
            const isOwner = user.email === 'support@emergestack.dev';
            
            if (!isOwner && isBrokerRole && (error || (!data?.subscribed && !data?.trial_active))) {
              secureLogger.info('New broker detected, redirecting to subscription', {
                component: 'Index',
                action: 'new_broker_subscription_redirect',
                userRole
              });
              navigate('/subscription', { replace: true });
            } else if (isOwner) {
              secureLogger.info('OWNER LOGIN - bypassing all subscription checks', {
                component: 'Index',
                action: 'owner_bypass_subscription',
                userRole,
                email: user.email
              });
            } else if (!isBrokerRole) {
              secureLogger.info('Non-broker user, allowing dashboard access', {
                component: 'Index', 
                action: 'vendor_dashboard_access',
                userRole
              });
            } else if (data?.trial_active) {
              secureLogger.info('User has active trial, staying on dashboard', {
                component: 'Index',
                action: 'trial_user_dashboard_access'
              });
            } else if (data?.subscribed) {
              secureLogger.info('User has active subscription, staying on dashboard', {
                component: 'Index',
                action: 'subscribed_user_dashboard_access'
              });
            }
          } catch (err) {
            secureLogger.error('Subscription check failed', {
              component: 'Index',
              action: 'subscription_check_error'
            });
            // Allow access on persistent errors to prevent blocking
            secureLogger.warn('Allowing dashboard access due to persistent errors', {
              component: 'Index',
              action: 'error_fallback_access'
            });
          }
        }, 1000);
        return;
      }
      
      // Check if BROKER should be redirected to subscription setup after subscription loads
      // CRITICAL: Only brokers need subscription setup - vendors are invited by brokers
      // OWNER BYPASS: support@emergestack.dev NEVER gets redirected to subscription
      const userRole = user.user_metadata?.role || user.role;
      const isBrokerRole = userRole === 'Partner Admin' || userRole === 'Broker Admin';
      const isOwner = user.email === 'support@emergestack.dev';
      
      if (!isOwner && isBrokerRole && !subscription.isLoading && !isDemo && !subscription.subscribed && subscription.status === 'expired') {
        secureLogger.info('Broker needs subscription setup, redirecting to subscription', {
          component: 'Index',
          action: 'expired_broker_subscription_redirect',
          userRole
        });
        navigate('/subscription', { replace: true });
        return;
      } else if (!isBrokerRole && !subscription.isLoading && !subscription.subscribed) {
        secureLogger.info('Non-broker user with no subscription - allowing dashboard access', {
          component: 'Index',
          action: 'vendor_no_subscription_access',
          userRole
        });
      }
    }
  }, [user, isLoading, navigate, isDemo, demoRole, location.search]); // Remove subscription states to prevent infinite loops

  if (isLoading || subscription.isLoading) {
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
    
    // SUPERADMIN CHECK: support@emergestack.dev is the owner and bypasses ALL subscription logic
    const isOwner = user?.email === 'support@emergestack.dev';
    
    // Debug role information
    console.log('🎯 INDEX.tsx - Demo mode:', isDemo);
    console.log('🎯 INDEX.tsx - Demo role:', demoRole);
    console.log('🎯 INDEX.tsx - User metadata role:', user?.user_metadata?.role);
    console.log('🎯 INDEX.tsx - User database role:', user?.role);
    console.log('🎯 INDEX.tsx - Current role:', currentRole);
    console.log('🎯 INDEX.tsx - Is owner:', isOwner);
    console.log('🎯 INDEX.tsx - User object:', user);
    console.log('🎯 Rendering dashboard for role:', currentRole, 'User:', currentName, 'Email:', user?.email);
    
    // Normalize role for comparison
    const normalizedRole = currentRole?.trim();
    
    // OWNER BYPASS: support@emergestack.dev gets superadmin access regardless of role
    if (isOwner) {
      console.log('👑 OWNER LOGIN - Loading Super Admin dashboard (bypassing all subscription checks)');
      return <SuperAdminDashboard />;
    }
    
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
