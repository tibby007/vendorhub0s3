"use client";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionState {
  subscribed: boolean;
  tier: 'Basic' | 'Pro' | 'Premium' | null;
  status: 'active' | 'trial' | 'expired' | 'loading' | 'error';
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

      // DEVELOPMENT MODE: Always provide Pro access
      if (import.meta.env.DEV) {
        console.log('🔧 Development mode - providing Pro access');
        safeSetSubscription({
          ...defaultSubscription,
          subscribed: true,
          tier: 'Pro',
          status: 'active',
          lastUpdated: Date.now(),
          isLoading: false,
        });
        safeSetSubscriptionData({
          ...mockSubscriptionData,
          subscription_tier: 'Pro',
          planType: 'pro'
        });
        safeSetInitialized(true);
        return;
      }

      // Production subscription check using Supabase
      try {
        const { data: subscriber, error } = await supabase
          .from('subscribers')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (subscriber) {
          console.log('✅ Found subscriber data:', subscriber.email);
          const subscriptionEnd = subscriber.subscription_end ? new Date(subscriber.subscription_end) : null;
          const now = new Date();
          const isActive = subscriber.subscribed && subscriptionEnd && subscriptionEnd > now;
          const isTrialing = !subscriber.subscribed && subscriptionEnd && subscriptionEnd > now;
          
          const subData: SubscriptionData = {
            subscriptionStatus: isActive ? 'active' : isTrialing ? 'trialing' : 'inactive',
            planType: subscriber.subscription_tier?.toLowerCase() as 'basic' | 'pro' | 'premium' || 'basic',
            trialDaysRemaining: isTrialing && subscriptionEnd ? Math.ceil((subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
            subscribed: subscriber.subscribed || false,
            subscription_tier: subscriber.subscription_tier as 'Basic' | 'Pro' | 'Premium' || 'Basic',
            subscription_end: subscriber.subscription_end,
            status: subscriber.subscribed ? 'active' : 'trialing'
          };
          
          safeSetSubscriptionData(subData);
          safeSetSubscription({
            ...defaultSubscription,
            subscribed: subData.subscribed,
            tier: subData.subscription_tier,
            status: subData.subscriptionStatus,
            lastUpdated: Date.now(),
            isLoading: false,
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

  // Initialize subscription when session changes
  useEffect(() => {
    let cancelled = false;
    
    const initializeSubscription = async () => {
      if (cancelled || !mountedRef.current) return;
      
      console.log('🔄 Initializing subscription for session change');
      await refresh();
      
      if (!cancelled && mountedRef.current && !initialized) {
        safeSetInitialized(true);
      }
    };
    
    initializeSubscription();
    
    return () => {
      cancelled = true;
    };
  }, [session, user, refresh, initialized, safeSetInitialized]);

  // Computed properties - always calculated, no conditional logic
  const isTrialUser = subscription.status === 'trial' || subscription.billingStatus === 'trialing';
  const isActiveSubscriber = subscription.subscribed && subscription.status === 'active';
  
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
  const { subscriptionData, refreshSubscription, checkSubscriptionAccess } = useSubscriptionManager();
  return {
    subscriptionData,
    refreshSubscription,
    checkSubscriptionAccess
  };
};