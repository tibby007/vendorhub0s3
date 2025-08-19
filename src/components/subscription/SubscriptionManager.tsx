
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, ExternalLink, CreditCard, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SubscriptionManager = () => {
  const { user, session, subscriptionData, refreshSubscription } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const checkSubscription = async () => {
    if (!session) return;
    
    setIsCheckingSubscription(true);
    try {
      await refreshSubscription(true); // Force refresh
      setRetryCount(0); // Reset retry count on success
      toast({
        title: "Subscription Status Refreshed",
        description: "Your subscription information has been updated.",
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setRetryCount(prev => prev + 1);
      
      toast({
        title: "Error",
        description: "Failed to check subscription status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!session) return;
    
    // Check for demo mode - show demo message
    const isDemoMode = sessionStorage.getItem('demoCredentials') !== null;
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Customer portal would open here in live mode with billing management options.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session && !subscriptionData && retryCount < 3) {
      // Auto-retry with exponential backoff
      const timeout = setTimeout(() => {
        checkSubscription();
      }, Math.pow(2, retryCount) * 1000);

      return () => clearTimeout(timeout);
    }
  }, [session, subscriptionData, retryCount]);

  if (!user) {
    return null;
  }

  const showRetryOption = retryCount >= 2 && !subscriptionData;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Subscription Status
          <Button
            variant="outline"
            size="sm"
            onClick={checkSubscription}
            disabled={isCheckingSubscription}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingSubscription ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showRetryOption && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              We're having trouble loading your subscription information. 
              <Button 
                variant="link" 
                className="p-0 ml-1 h-auto"
                onClick={() => {
                  setRetryCount(0);
                  checkSubscription();
                }}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {subscriptionData ? (
          <>
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <Badge variant={subscriptionData.subscribed ? "default" : subscriptionData.subscription_end ? "secondary" : "destructive"}>
                {subscriptionData.subscribed ? "Active" : subscriptionData.subscription_end ? "Trial" : "No Plan"}
              </Badge>
            </div>
            
            {subscriptionData.subscription_tier && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Plan:</span>
                <Badge variant="outline">
                  VendorHub {subscriptionData.subscription_tier}
                </Badge>
              </div>
            )}
            
            {subscriptionData.subscription_end && (
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {subscriptionData.subscribed ? "Next Billing:" : "Trial Ends:"}
                </span>
                <span className={`text-sm ${subscriptionData.subscribed ? 'text-gray-600' : 'text-orange-600 font-medium'}`}>
                  {new Date(subscriptionData.subscription_end).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {subscriptionData.subscribed ? (
              <Button
                onClick={openCustomerPortal}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Subscription
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => window.location.href = '/subscription'}
                className="w-full"
                variant="default"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade to Paid Plan
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">
              {isCheckingSubscription ? "Checking subscription..." : "Loading subscription information..."}
            </p>
            {isCheckingSubscription && (
              <div className="mt-2">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionManager;
