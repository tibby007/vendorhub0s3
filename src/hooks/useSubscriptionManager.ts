import { Session } from '@supabase/supabase-js';
import { useSubscriptionManager as useSubscriptionManagerProvider } from '@/providers/SubscriptionProvider';

// Main hook for accessing subscription data
export const useSubscriptionManager = () => {
  return useSubscriptionManagerProvider();
};

// Legacy hook interface for backwards compatibility
export const useSubscription = () => {
  const { subscription, refresh, checkAccess } = useSubscriptionManager();
  
  const refreshSubscription = (session: Session | null) => {
    if (session) {
      refresh(false);
    }
  };

  const checkSubscriptionAccess = (requiredTier?: string) => {
    return checkAccess(requiredTier);
  };

  return {
    subscriptionData: subscription.subscribed ? {
      subscribed: subscription.subscribed,
      subscription_tier: subscription.tier,
      subscription_end: subscription.endDate,
    } : null,
    setSubscriptionData: () => {}, // No-op for backwards compatibility
    refreshSubscription,
    checkSubscriptionAccess,
  };
};