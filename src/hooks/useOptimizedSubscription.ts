import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { secureLogger } from '@/utils/secureLogger';
import { useMemo } from 'react';

interface SubscriptionData {
  subscribed: boolean;
  tier: 'Basic' | 'Pro' | 'Premium' | null;
  status: 'active' | 'trial' | 'expired' | 'loading' | 'error';
  endDate: string | null;
  priceId: string | null;
  billingStatus: 'active' | 'trialing' | 'past_due' | null;
  planType: string | null;
  trialEnd: string | null;
  isTrialActive: boolean;
}

const fetchSubscriptionData = async (): Promise<SubscriptionData> => {
  try {
    const { data, error } = await supabase.functions.invoke('check-subscription');
    
    if (error) {
      secureLogger.error('Subscription fetch error', {
        component: 'useOptimizedSubscription',
        action: 'fetch_error'
      });
      throw error;
    }

    return {
      subscribed: data?.subscribed || false,
      tier: data?.subscription_tier || null,
      status: data?.trial_active ? 'trial' : data?.subscribed ? 'active' : 'expired',
      endDate: data?.subscription_end || null,
      priceId: data?.price_id || null,
      billingStatus: data?.subscribed ? 'active' : data?.trial_active ? 'trialing' : null,
      planType: data?.subscription_tier?.toLowerCase() || null,
      trialEnd: data?.subscription_end || null,
      isTrialActive: data?.trial_active || false
    };
  } catch (error) {
    secureLogger.error('Failed to fetch subscription data', {
      component: 'useOptimizedSubscription',
      action: 'fetch_exception'
    });
    throw error;
  }
};

export const useOptimizedSubscription = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const subscriptionQuery = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: fetchSubscriptionData,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      errorMessage: 'Failed to load subscription data'
    }
  });

  const subscription = useMemo(() => {
    if (subscriptionQuery.isLoading) {
      return {
        subscribed: false,
        tier: null,
        status: 'loading' as const,
        endDate: null,
        priceId: null,
        billingStatus: null,
        planType: null,
        trialEnd: null,
        isLoading: true,
        error: null,
        isTrialActive: false
      };
    }

    if (subscriptionQuery.error) {
      return {
        subscribed: false,
        tier: null,
        status: 'error' as const,
        endDate: null,
        priceId: null,
        billingStatus: null,
        planType: null,
        trialEnd: null,
        isLoading: false,
        error: 'Failed to load subscription',
        isTrialActive: false
      };
    }

    return {
      ...subscriptionQuery.data!,
      isLoading: false,
      error: null
    };
  }, [subscriptionQuery.data, subscriptionQuery.isLoading, subscriptionQuery.error]);

  const refreshSubscription = async (forceRefresh = false) => {
    if (forceRefresh) {
      await queryClient.invalidateQueries({ queryKey: ['subscription', user?.id] });
    }
    return subscriptionQuery.refetch();
  };

  const checkAccess = (requiredTier?: string): boolean => {
    if (!requiredTier) return true;
    if (!subscription.subscribed && !subscription.isTrialActive) return false;
    
    const tierHierarchy = { Basic: 1, Pro: 2, Premium: 3 };
    const userTierLevel = tierHierarchy[subscription.tier as keyof typeof tierHierarchy] || 0;
    const requiredTierLevel = tierHierarchy[requiredTier as keyof typeof tierHierarchy] || 0;
    
    return userTierLevel >= requiredTierLevel;
  };

  const canAccessFeature = (feature: string): boolean => {
    const featureRequirements = {
      'vendor_upload': 'Pro',
      'advanced_analytics': 'Pro', 
      'white_label': 'Premium',
      'api_access': 'Premium'
    };

    const required = featureRequirements[feature as keyof typeof featureRequirements];
    return checkAccess(required);
  };

  const daysRemaining = useMemo(() => {
    if (!subscription.endDate) return null;
    const endDate = new Date(subscription.endDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [subscription.endDate]);

  return {
    subscription,
    refresh: refreshSubscription,
    checkAccess,
    canAccessFeature,
    isTrialUser: subscription.isTrialActive,
    isActiveSubscriber: subscription.subscribed,
    daysRemaining,
    invalidateCache: () => queryClient.invalidateQueries({ queryKey: ['subscription'] })
  };
};