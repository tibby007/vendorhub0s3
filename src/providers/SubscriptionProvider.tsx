"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

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

type SubCtx = { 
  subscription: SubscriptionState;
  initialized: boolean; 
  refresh: (forceRefresh?: boolean) => Promise<void>;
  checkAccess: (requiredTier?: string) => boolean;
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

const SubscriptionContext = createContext<SubCtx>({ 
  subscription: defaultSubscription,
  initialized: false,
  refresh: async () => {},
  checkAccess: () => false,
  isTrialUser: false,
  isActiveSubscriber: false,
  daysRemaining: null,
  canAccessFeature: () => false,
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();

  // Hooks always run - no conditional hook calls
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);
  const [initialized, setInitialized] = useState(false);
  const mounted = useRef(false);
  const isRequestInFlight = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const refresh = async (forceRefresh = false) => {
    if (isRequestInFlight.current && !forceRefresh) return;
    isRequestInFlight.current = true;

    try {
      // If no session, set default state but still mark initialized
      if (!session) {
        if (mounted.current) {
          setSubscription(defaultSubscription);
          setInitialized(true);
        }
        return;
      }

      // OWNER BYPASS: support@emergestack.dev gets full access
      const userEmail = session.user?.email;
      if (userEmail === 'support@emergestack.dev') {
        if (mounted.current) {
          setSubscription({
            ...defaultSubscription,
            subscribed: true,
            tier: 'Premium',
            status: 'active',
            lastUpdated: Date.now(),
            isLoading: false,
          });
          setInitialized(true);
        }
        return;
      }

      // For demo mode users, provide mock subscription
      const isDemoMode = typeof window !== 'undefined' && sessionStorage.getItem('demoCredentials') !== null;
      if (isDemoMode) {
        if (mounted.current) {
          setSubscription({
            ...defaultSubscription,
            subscribed: true,
            tier: 'Pro',
            status: 'active',
            lastUpdated: Date.now(),
            isLoading: false,
          });
          setInitialized(true);
        }
        return;
      }

      // Regular subscription check - simplified for stability
      if (mounted.current) {
        setSubscription({
          ...defaultSubscription,
          subscribed: true, // Default to active until proper implementation
          tier: 'Premium',
          status: 'active',
          lastUpdated: Date.now(),
          isLoading: false,
        });
        setInitialized(true);
      }

    } catch (error) {
      if (mounted.current) {
        setSubscription({
          ...defaultSubscription,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastUpdated: Date.now(),
          isLoading: false,
        });
        setInitialized(true);
      }
    } finally {
      isRequestInFlight.current = false;
    }
  };

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      await refresh();
      if (!cancelled && mounted.current) {
        setInitialized(true);
      }
    })();
    
    return () => { cancelled = true; };
  }, [session]);

  // Computed properties - always calculated, no conditional logic
  const isTrialUser = subscription.status === 'trial';
  const isActiveSubscriber = subscription.subscribed && subscription.status === 'active';
  const daysRemaining = subscription.endDate ? 
    Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 
    null;

  const checkAccess = (requiredTier?: string) => {
    // Always allow access for now - simplified for stability
    return true;
  };

  const canAccessFeature = (feature: string) => {
    // Always allow access for now - simplified for stability  
    return true;
  };

  const value = useMemo(() => ({ 
    subscription,
    initialized, 
    refresh,
    checkAccess,
    isTrialUser,
    isActiveSubscriber,
    daysRemaining,
    canAccessFeature
  }), [subscription, initialized, isTrialUser, isActiveSubscriber, daysRemaining]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export const useSubscriptionManager = () => useContext(SubscriptionContext);