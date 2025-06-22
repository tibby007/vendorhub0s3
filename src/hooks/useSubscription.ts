
import { useState, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

export const useSubscription = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);

  const refreshSubscription = useCallback(async (session: Session | null) => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      setSubscriptionData(data);
      console.log('Subscription data refreshed:', data);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  }, []);

  const checkSubscriptionAccess = useCallback((requiredTier?: string) => {
    if (!subscriptionData?.subscribed) return false;
    
    if (!requiredTier) return true;
    
    const tierLevels = { 'Basic': 1, 'Pro': 2, 'Premium': 3 };
    const userTierLevel = tierLevels[subscriptionData.subscription_tier as keyof typeof tierLevels] || 0;
    const requiredTierLevel = tierLevels[requiredTier as keyof typeof tierLevels] || 0;
    
    return userTierLevel >= requiredTierLevel;
  }, [subscriptionData]);

  return {
    subscriptionData,
    setSubscriptionData,
    refreshSubscription,
    checkSubscriptionAccess
  };
};
