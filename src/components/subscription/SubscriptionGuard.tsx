
import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useSubscriptionManager } from '@/providers/SubscriptionProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, CreditCard, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredTier?: 'Basic' | 'Pro' | 'Premium';
  fallbackMessage?: string;
  showTrialAccess?: boolean;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ 
  children, 
  requiredTier = 'Basic',
  fallbackMessage,
  showTrialAccess = false
}) => {
  const { user } = useAuth();
  const { subscription, refresh, isTrialUser, isActiveSubscriber } = useSubscriptionManager();

  // Check for demo mode - always allow access
  // Demo mode can be detected through multiple methods for reliability
  const isDemoCredentials = sessionStorage.getItem('demoCredentials') !== null;
  const isDemoMode = sessionStorage.getItem('isDemoMode') !== null;
  const isDemoSession = sessionStorage.getItem('demoSession') !== null;
  const isAnyDemoMode = isDemoCredentials || isDemoMode || isDemoSession;
  
  if (isAnyDemoMode) {
    console.log('[SubscriptionGuard] Demo mode detected - allowing access');
    return <>{children}</>;
  }

  if (subscription.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vendor-green-500 mx-auto"></div>
          <p className="text-gray-600">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  // Check if user has required subscription or is in trial period
  const hasSubscription = subscription.subscribed;
  const userTier = subscription.tier;

  // Debug logging
  console.log('[SubscriptionGuard] Debug:', {
    hasSubscription,
    isTrialUser,
    subscriptionStatus: subscription.status,
    billingStatus: subscription.billingStatus,
    tier: userTier,
    requiredTier
  });

  // Tier hierarchy for comparison
  const tierLevels = { 'Basic': 1, 'Pro': 2, 'Premium': 3 };
  const hasRequiredTier = hasSubscription && userTier && 
    tierLevels[userTier as keyof typeof tierLevels] >= tierLevels[requiredTier];

  // Allow access for trial users (they should have basic access during trial)
  // Also allow access if billing status shows active/trialing
  const hasAccess = hasSubscription || isTrialUser || subscription.status === 'trial' || 
                   subscription.billingStatus === 'active' || subscription.billingStatus === 'trialing';

  // If subscription data is not loaded yet and we're not loading, show retry option
  // BUT: Don't show error for new users who legitimately have no subscription yet
  if (!subscription.lastUpdated && !subscription.isLoading && subscription.status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-vendor-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-vendor-gold-600" />
            </div>
            <CardTitle className="text-xl">Unable to Load Subscription</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              We're having trouble loading your subscription information. This might be a temporary issue.
            </p>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                If this persists, you may have reached the API rate limit. Please wait a moment and try again.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 pt-4">
              <Button 
                onClick={() => refresh(true)}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Loading Subscription
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link to="/subscription">
                  Go to Subscription Page
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link to="/dashboard">
                  Return to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    if (showTrialAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-vendor-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-vendor-green-600" />
              </div>
              <CardTitle className="text-xl">Start Your Free Trial</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                {fallbackMessage || "Get started with VendorHub today and explore all our features with a free trial."}
              </p>
              
              <div className="space-y-2 pt-4">
                <Button asChild className="w-full">
                  <Link to="/subscription">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Start Free Trial
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="w-full">
                  <Link to="/auth">
                    Back to Login
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-vendor-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-vendor-gold-600" />
            </div>
            <CardTitle className="text-xl">Subscription Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {fallbackMessage || `This feature requires a ${requiredTier} subscription or higher.`}
            </p>
            
            <div className="space-y-2 pt-4">
              <Button asChild className="w-full">
                <Link to="/subscription">
                  <CreditCard className="w-4 h-4 mr-2" />
                  View Plans
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link to="/dashboard">
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
};

export default SubscriptionGuard;
