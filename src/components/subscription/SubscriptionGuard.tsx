
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, CreditCard, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requiredTier?: 'Basic' | 'Pro' | 'Premium';
  fallbackMessage?: string;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ 
  children, 
  requiredTier = 'Basic',
  fallbackMessage 
}) => {
  const { user, subscriptionData, isLoading, refreshSubscription } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vendor-green-500 mx-auto"></div>
          <p className="text-gray-600">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  // Check if user has required subscription
  const hasSubscription = subscriptionData?.subscribed;
  const userTier = subscriptionData?.subscription_tier;

  // Tier hierarchy for comparison
  const tierLevels = { 'Basic': 1, 'Pro': 2, 'Premium': 3 };
  const hasRequiredTier = hasSubscription && userTier && 
    tierLevels[userTier as keyof typeof tierLevels] >= tierLevels[requiredTier];

  // If subscription data is not loaded yet and we're not loading, show retry option
  if (!subscriptionData && !isLoading) {
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
                onClick={() => refreshSubscription()}
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

  if (!hasSubscription || !hasRequiredTier) {
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
              {fallbackMessage || 
               `This feature requires a ${requiredTier} subscription or higher to access.`}
            </p>
            
            {!hasSubscription ? (
              <p className="text-sm text-gray-500">
                You currently don't have an active subscription.
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Your current plan ({userTier}) doesn't include access to this feature.
              </p>
            )}

            <div className="space-y-2 pt-4">
              <Button asChild className="w-full">
                <Link to="/subscription">
                  <CreditCard className="w-4 h-4 mr-2" />
                  View Subscription Plans
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

  return <>{children}</>;
};

export default SubscriptionGuard;
