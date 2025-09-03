"use client";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionState {
  subscribed: boolean;
  tier: 'Basic' | 'Pro' | 'Premium' | null;
  status: 'active' | 'trial' | 'trialing' | 'expired' | 'loading' | 'error';
  endDate: string | null;
  priceId: string | null;
  billingStatus: 'active' | 'trialing' | 'past_due' | null;
  planType: string | null;
  trialEnd: string | null;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

interface SubscriptionData {
  subscriptionStatus: 'active' | 'trialing' | 'inactive';
  planType: 'basic' | 'pro' | 'premium';
  trialDaysRemaining: number;
  subscribed: boolean;
  subscription_tier: 'Basic' | 'Pro' | 'Premium';
  subscription_end: string | null;
  status?: string;
}

type SubCtx = { 
  subscription: SubscriptionState;
  subscriptionData: SubscriptionData | null;
  initialized: boolean; 
  refresh: (forceRefresh?: boolean) => Promise<void>;
  refreshSubscription: (forceRefresh?: boolean) => Promise<void>;
  checkAccess: (requiredTier?: string) => boolean;
  checkSubscriptionAccess: (requiredTier: string) => boolean;
  isTrialUser: boolean;
  isActiveSubscriber: boolean;
  daysRemaining: number | null;
  canAccessFeature: (feature: string) => boolean;
};

const defaultSubscription: SubscriptionState = {
  subscribed: false,
  tier: null,
  status: 'loading',
  endDate: null,
  priceId: null,
  billingStatus: null,
  planType: null,
  trialEnd: null,
  lastUpdated: 0,
  isLoading: true,
  error: null,
};

const mockSubscriptionData: SubscriptionData = {
  subscriptionStatus: 'active',
  planType: 'pro', 
  trialDaysRemaining: 0,
  subscribed: true,
  subscription_tier: 'Pro',
  subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
};

const defaultContext: SubCtx = { 
  subscription: defaultSubscription,
  subscriptionData: null,
  initialized: false,
  refresh: async () => {},
  refreshSubscription: async () => {},
  checkAccess: () => true, // Default to allowing access
  checkSubscriptionAccess: () => true,
  isTrialUser: false,
  isActiveSubscriber: false,
  daysRemaining: null,
  canAccessFeature: () => true,
};

const SubscriptionContext = createContext<SubCtx>(defaultContext);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { session, user } = useAuth();

  // CRITICAL: All hooks declared unconditionally at top level
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [initialized, setInitialized] = useState(false);
  const mountedRef = useRef(false);
  const isRequestInFlight = useRef(false);
  const lastRequestTime = useRef(0);

  // Mount tracking
  useEffect(() => {
    mountedRef.current = true;
    console.log('🔄 SubscriptionProvider mounted');
    return () => {
      mountedRef.current = false;
      console.log('🧩 SubscriptionProvider unmounted');
    };
  }, []);
  
  // Safe state setters that check if component is still mounted
  const safeSetSubscription = useCallback((newState: SubscriptionState) => {
    if (mountedRef.current) {
      setSubscription(newState);
    }
  }, []);
  
  const safeSetSubscriptionData = useCallback((newData: SubscriptionData | null) => {
    if (mountedRef.current) {
      setSubscriptionData(newData);
    }
  }, []);
  
  const safeSetInitialized = useCallback((value: boolean) => {
    if (mountedRef.current) {
      setInitialized(value);
    }
  }, []);

  // Rate limiting to prevent excessive requests
  const isRateLimited = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    return timeSinceLastRequest < 5000; // 5 second minimum between requests
  }, []);

  const refresh = useCallback(async (forceRefresh = false) => {
    // Prevent concurrent requests and rate limiting
    if (isRequestInFlight.current && !forceRefresh) {
      console.log('⏳ Subscription refresh already in progress');
      return;
    }
    
    if (!forceRefresh && isRateLimited()) {
      console.log('🚫 Rate limited: Skipping subscription refresh');
      return;
    }
    
    isRequestInFlight.current = true;
    lastRequestTime.current = Date.now();

    try {
      console.log('🔄 Refreshing subscription data');
      
      // If no session, set default state but still mark initialized
      if (!session || !user) {
        console.log('🚫 No session/user found - setting default state');
        safeSetSubscription({
          ...defaultSubscription,
          status: 'loading',
          isLoading: false
        });
        safeSetSubscriptionData(null);
        safeSetInitialized(true);
        return;
      }

      // OWNER BYPASS: support@emergestack.dev gets full access
      const userEmail = user.email;
      if (userEmail === 'support@emergestack.dev') {
        console.log('🔑 Owner bypass activated for:', userEmail);
        safeSetSubscription({
          ...defaultSubscription,
          subscribed: true,
          tier: 'Premium',
          status: 'active',
          lastUpdated: Date.now(),
          isLoading: false,
        });
        safeSetSubscriptionData({
          ...mockSubscriptionData,
          subscription_tier: 'Premium',
          planType: 'premium'
        });
        safeSetInitialized(true);
        return;
      }

      // Demo mode check
      const isDemoMode = typeof window !== 'undefined' && 
        (sessionStorage.getItem('demoCredentials') !== null || 
         user.email === 'partner@demo.com' || 
         user.email === 'vendor@demo.com');
         
      if (isDemoMode) {
        console.log('🎭 Demo mode - providing mock subscription');
        safeSetSubscription({
          ...defaultSubscription,
          subscribed: true,
          tier: 'Pro',
          status: 'active',
          lastUpdated: Date.now(),
          isLoading: false,
        });
        safeSetSubscriptionData(mockSubscriptionData);
        safeSetInitialized(true);
        return;
      }

      // DEVELOPMENT MODE: Provide trial access for testing
      if (import.meta.env.DEV) {
        console.log('🔧 Development mode - providing trial access for testing');
        const trialEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days from now
        
        const devSubscription = {
          ...defaultSubscription,
          subscribed: false,
          tier: 'Pro' as const,
          status: 'trial' as const,
          trialEnd: trialEndDate,
          endDate: trialEndDate,
          lastUpdated: Date.now(),
          isLoading: false,
        };
        
        const devSubscriptionData = {
          subscriptionStatus: 'trialing' as const,
          planType: 'pro' as const,
          trialDaysRemaining: 3,
          subscribed: false,
          subscription_tier: 'Pro' as const,
          subscription_end: trialEndDate,
          status: 'trialing'
        };
        
        console.log('[SubscriptionProvider] DEV - Setting subscription:', devSubscription);
        console.log('[SubscriptionProvider] DEV - Setting subscription data:', devSubscriptionData);
        
        safeSetSubscription(devSubscription);
        safeSetSubscriptionData(devSubscriptionData);
        safeSetInitialized(true);
        return;
      }

      // Production subscription check using check-subscription function
      try {
        const { data: checkResult, error } = await supabase.functions.invoke('check-subscription', {
          body: { userEmail }
        });
        
        if (error) {
          throw error;
        }
        
        if (checkResult) {
          console.log('✅ Check-subscription result:', checkResult);
          
          const subData: SubscriptionData = {
            subscriptionStatus: checkResult.trial_active ? 'trialing' : checkResult.subscribed ? 'active' : 'inactive',
            planType: checkResult.subscription_tier?.toLowerCase() as 'basic' | 'pro' | 'premium' || 'pro',
            trialDaysRemaining: checkResult.trial_active ? checkResult.remaining_days : 0,
            subscribed: checkResult.subscribed || false,
            subscription_tier: checkResult.subscription_tier as 'Basic' | 'Pro' | 'Premium' || 'Pro',
            subscription_end: checkResult.subscription_end,
            status: checkResult.trial_active ? 'trialing' : checkResult.subscribed ? 'active' : 'inactive'
          };
          
          safeSetSubscriptionData(subData);
          safeSetSubscription({
            ...defaultSubscription,
            subscribed: subData.subscribed,
            tier: subData.subscription_tier,
            status: subData.subscriptionStatus === 'trialing' ? 'trial' : subData.subscriptionStatus === 'inactive' ? 'expired' : subData.subscriptionStatus,
            trialEnd: checkResult.subscription_end,
            endDate: checkResult.trial_active ? checkResult.subscription_end : checkResult.subscription_end,
            lastUpdated: Date.now(),
            isLoading: false,
          });
          
          console.log('🔄 Subscription state updated:', {
            trial_active: checkResult.trial_active,
            subscribed: checkResult.subscribed,
            status: subData.subscriptionStatus,
            trialEnd: checkResult.subscription_end,
            trialDaysRemaining: subData.trialDaysRemaining
          });
        } else {
          console.log('❌ No subscriber found - setting premium default for existing users');
          // Default for existing users without subscriber record
          safeSetSubscriptionData({
            subscriptionStatus: 'active',
            planType: 'premium',
            trialDaysRemaining: 0,
            subscribed: true,
            subscription_tier: 'Premium',
            subscription_end: null,
            status: 'active'
          });
          safeSetSubscription({
            ...defaultSubscription,
            subscribed: true,
            tier: 'Premium',
            status: 'active',
            lastUpdated: Date.now(),
            isLoading: false,
          });
        }
        
        safeSetInitialized(true);
      } catch (dbError) {
        console.error('Database error, providing fallback access:', dbError);
        // Fallback to premium access on database errors
        safeSetSubscriptionData({
          subscriptionStatus: 'active',
          planType: 'premium',
          trialDaysRemaining: 0,
          subscribed: true,
          subscription_tier: 'Premium',
          subscription_end: null,
          status: 'active'
        });
        safeSetSubscription({
          ...defaultSubscription,
          subscribed: true,
          tier: 'Premium',
          status: 'active',
          lastUpdated: Date.now(),
          isLoading: false,
        });
        safeSetInitialized(true);
      }

    } catch (error) {
      console.error('Subscription refresh failed:', error);
      safeSetSubscription({
        ...defaultSubscription,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: Date.now(),
        isLoading: false,
      });
      safeSetInitialized(true);
    } finally {
      isRequestInFlight.current = false;
    }
  }, [session, user, isRateLimited, safeSetSubscription, safeSetSubscriptionData, safeSetInitialized]);

  // Initialize subscription when session changes - using ref to avoid dependency loops
  const sessionIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    const currentSessionId = session?.access_token || null;
    const currentUserId = user?.id || null;
    
    // Only refresh if session or user actually changed
    if (currentSessionId !== sessionIdRef.current || currentUserId !== userIdRef.current) {
      sessionIdRef.current = currentSessionId;
      userIdRef.current = currentUserId;
      
      console.log('🔄 Session/User changed, refreshing subscription');
      refresh(false); // Don't force refresh on session changes
    }
  }, [session?.access_token, user?.id]); // Only depend on the actual values that matter

  // Computed properties - always calculated, no conditional logic
  const isTrialUser = subscription.status === 'trial' || subscription.status === 'trialing' || subscription.billingStatus === 'trialing';
  const isActiveSubscriber = subscription.subscribed && subscription.status === 'active';
  
  // Debug logging for computed properties
  useEffect(() => {
    if (initialized) {
      console.log('[SubscriptionProvider] Computed properties:', {
        isTrialUser,
        isActiveSubscriber,
        status: subscription.status,
        billingStatus: subscription.billingStatus,
        subscribed: subscription.subscribed,
        tier: subscription.tier,
        trialEnd: subscription.trialEnd,
        endDate: subscription.endDate
      });
    }
  }, [isTrialUser, isActiveSubscriber, subscription, initialized]);
  
  const daysRemaining = useMemo(() => {
    const endDateStr = subscription.endDate || subscriptionData?.subscription_end;
    if (!endDateStr) return null;
    
    const endDate = new Date(endDateStr);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }, [subscription.endDate, subscriptionData?.subscription_end]);

  const checkAccess = useCallback((requiredTier?: string) => {
    if (!subscription.subscribed && subscription.status !== 'trial') return false;
    if (!requiredTier) return true;
    
    const tierLevels = { 'Basic': 1, 'Pro': 2, 'Premium': 3 };
    const userTierLevel = tierLevels[subscription.tier as keyof typeof tierLevels] || 0;
    const requiredTierLevel = tierLevels[requiredTier as keyof typeof tierLevels] || 0;
    
    return userTierLevel >= requiredTierLevel;
  }, [subscription.subscribed, subscription.tier, subscription.status]);
  
  const checkSubscriptionAccess = useCallback((requiredTier: string) => {
    return checkAccess(requiredTier);
  }, [checkAccess]);

  const canAccessFeature = useCallback((feature: string) => {
    const featureMap: Record<string, string[]> = {
      'basic_features': ['Basic', 'Pro', 'Premium'],
      'advanced_features': ['Pro', 'Premium'],
      'premium_features': ['Premium'],
    };
    
    const allowedTiers = featureMap[feature] || ['Basic', 'Pro', 'Premium'];
    return subscription.tier ? allowedTiers.includes(subscription.tier) : false;
  }, [subscription.tier]);
  
  // Refresh subscription alias for backward compatibility
  const refreshSubscription = useCallback((forceRefresh?: boolean) => {
    return refresh(forceRefresh);
  }, [refresh]);

  const value = useMemo(() => ({ 
    subscription,
    subscriptionData,
    initialized, 
    refresh,
    refreshSubscription,
    checkAccess,
    checkSubscriptionAccess,
    isTrialUser,
    isActiveSubscriber,
    daysRemaining,
    canAccessFeature
  }), [subscription, subscriptionData, initialized, refresh, refreshSubscription, checkAccess, checkSubscriptionAccess, isTrialUser, isActiveSubscriber, daysRemaining, canAccessFeature]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export const useSubscriptionManager = () => {
  const context = useContext(SubscriptionContext);
  
  // CRITICAL: Never throw during render - return stable fallback  
  if (!context) {
    console.warn('useSubscriptionManager used outside SubscriptionProvider - returning fallback');
    return {
      subscription: defaultSubscription,
      subscriptionData: null,
      initialized: false,
      refresh: async () => {},
      refreshSubscription: async () => {},
      checkAccess: () => true,
      checkSubscriptionAccess: () => true,
      isTrialUser: false,
      isActiveSubscriber: false,
      daysRemaining: null,
      canAccessFeature: () => true,
    };
  }
  
  return context;
};

// Backward compatibility hook
export const useSubscription = () => {
  const { subscriptionData, refreshSubscription, checkSubscriptionAccess, isTrialUser, daysRemaining, subscription } = useSubscriptionManager();
  return {
    subscriptionData,
    refreshSubscription,
    checkSubscriptionAccess,
    isTrialUser,
    daysRemaining,
    subscription
  };
};