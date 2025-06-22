
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const { user, subscriptionData, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vendor-green-500"></div>
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
