
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, ExternalLink, CreditCard } from 'lucide-react';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  price_id?: string;
}

const SubscriptionManager = () => {
  const { user, session } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  const checkSubscription = async () => {
    if (!session) return;
    
    setIsCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setSubscriptionData(data);
      console.log('Subscription data updated:', data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast({
        title: "Error",
        description: "Failed to check subscription status",
        variant: "destructive",
      });
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!session) return;
    
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
        description: "Failed to open customer portal",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      checkSubscription();
    }
  }, [session]);

  if (!user) {
    return null;
  }

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
        {subscriptionData ? (
          <>
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <Badge variant={subscriptionData.subscribed ? "default" : "secondary"}>
                {subscriptionData.subscribed ? "Active" : "No Subscription"}
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
                <span className="font-medium">Next Billing:</span>
                <span className="text-sm text-gray-600">
                  {new Date(subscriptionData.subscription_end).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {subscriptionData.subscribed && (
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
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">Loading subscription information...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionManager;
