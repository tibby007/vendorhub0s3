import { useContext, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { SubscriptionContext } from '@/contexts/SubscriptionContext';

// Re-export the hook from context for backwards compatibility
export const useSubscriptionManager = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionManager must be used within a SubscriptionProvider');
  }
  return context;
};

// Hook for components that need to set the current session
export const useSubscriptionSession = () => {
  const { refresh } = useSubscriptionManager();
  
  const setSession = (session: Session | null) => {
    // Trigger refresh when session changes
    if (session) {
      refresh(false);
    }
  };

  return { setSession };
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