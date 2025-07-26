import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionState {
  // Unified data structure
  subscribed: boolean;
  tier: 'Basic' | 'Pro' | 'Premium' | null;
  status: 'active' | 'trial' | 'expired' | 'loading' | 'error';
  endDate: string | null;
  priceId: string | null;
  
  // Partner table data (for billing)
  billingStatus: 'active' | 'trialing' | 'past_due' | null;
  planType: string | null;
  trialEnd: string | null;
  
  // Meta information
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

interface SubscriptionManager {
  subscription: SubscriptionState;
  refresh: (forceRefresh?: boolean) => Promise<void>;
  checkAccess: (requiredTier?: string) => boolean;
  invalidateCache: () => void;
  isTrialUser: boolean;
  isActiveSubscriber: boolean;
  daysRemaining: number | null;
  canAccessFeature: (feature: string) => boolean;
}

type SubscriptionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUBSCRIPTION_DATA'; payload: Partial<SubscriptionState> }
  | { type: 'INVALIDATE_CACHE' }
  | { type: 'RESET' };

const initialState: SubscriptionState = {
  subscribed: false,
  tier: null,
  status: 'loading',
  endDate: null,
  priceId: null,
  billingStatus: null,
  planType: null,
  trialEnd: null,
  lastUpdated: 0,
  isLoading: false,
  error: null,
};

function subscriptionReducer(state: SubscriptionState, action: SubscriptionAction): SubscriptionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_SUBSCRIPTION_DATA':
      return { 
        ...state, 
        ...action.payload, 
        lastUpdated: Date.now(),
        isLoading: false,
        error: null 
      };
    case 'INVALIDATE_CACHE':
      return { ...state, lastUpdated: 0 };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export const SubscriptionContext = createContext<SubscriptionManager | undefined>(undefined);

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 1000; // 1 second

// Global session management
let globalSetSession: ((session: Session | null) => void) | null = null;

export const setGlobalSession = (session: Session | null) => {
  if (globalSetSession) {
    globalSetSession(session);
  }
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(subscriptionReducer, initialState);
  const sessionRef = useRef<Session | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isRequestInFlight = useRef(false);

  const isCacheValid = useCallback(() => {
    if (state.lastUpdated === 0) return false;
    return Date.now() - state.lastUpdated < CACHE_DURATION;
  }, [state.lastUpdated]);

  const fetchSubscriptionData = useCallback(async (forceRefresh = false) => {
    const session = sessionRef.current;
    if (!session) {
      dispatch({ type: 'RESET' });
      return;
    }

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      return;
    }

    // Prevent multiple simultaneous requests
    if (isRequestInFlight.current) {
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    isRequestInFlight.current = true;

    try {
      // Fetch subscription data from check-subscription edge function
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (subscriptionError) {
        throw new Error(subscriptionError.message || 'Failed to check subscription');
      }

      // Fetch partner data for billing info
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('billing_status, plan_type, trial_end, current_period_end')
        .eq('id', session.user.user_metadata?.partner_id)
        .maybeSingle();

      if (partnerError && partnerError.code !== 'PGRST116') {
        console.warn('Failed to fetch partner data:', partnerError);
      }

      // Determine status based on subscription data
      let status: SubscriptionState['status'] = 'loading';
      if (subscriptionData?.subscribed) {
        status = 'active';
      } else if (partnerData?.billing_status === 'trialing') {
        status = 'trial';
      } else {
        status = 'expired';
      }

      const newState: Partial<SubscriptionState> = {
        subscribed: subscriptionData?.subscribed || false,
        tier: subscriptionData?.subscription_tier as 'Basic' | 'Pro' | 'Premium' || null,
        status,
        endDate: subscriptionData?.subscription_end || null,
        priceId: subscriptionData?.price_id || null,
        billingStatus: partnerData?.billing_status as 'active' | 'trialing' | 'past_due' || null,
        planType: partnerData?.plan_type || null,
        trialEnd: partnerData?.trial_end || null,
      };

      dispatch({ type: 'SET_SUBSCRIPTION_DATA', payload: newState });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching subscription data:', err);
      
      // If we have cached data, keep using it on error
      if (isCacheValid()) {
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      }
    } finally {
      isRequestInFlight.current = false;
    }
  }, [isCacheValid]);

  const debouncedRefresh = useCallback((forceRefresh = false) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSubscriptionData(forceRefresh);
    }, DEBOUNCE_DELAY);
  }, [fetchSubscriptionData]);

  const refresh = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      await fetchSubscriptionData(true);
    } else {
      debouncedRefresh(false);
    }
  }, [fetchSubscriptionData, debouncedRefresh]);

  const checkAccess = useCallback((requiredTier?: string) => {
    if (!state.subscribed) return false;
    if (!requiredTier) return true;
    
    const tierLevels = { 'Basic': 1, 'Pro': 2, 'Premium': 3 };
    const userTierLevel = tierLevels[state.tier as keyof typeof tierLevels] || 0;
    const requiredTierLevel = tierLevels[requiredTier as keyof typeof tierLevels] || 0;
    
    return userTierLevel >= requiredTierLevel;
  }, [state.subscribed, state.tier]);

  const invalidateCache = useCallback(() => {
    dispatch({ type: 'INVALIDATE_CACHE' });
  }, []);

  // Set current session and auto-refresh when session changes
  const setSession = useCallback((session: Session | null) => {
    sessionRef.current = session;
    if (!session) {
      dispatch({ type: 'RESET' });
    } else {
      // Auto-refresh when session is set
      refresh(false);
    }
  }, [refresh]);

  // Set the global session handler
  useEffect(() => {
    globalSetSession = setSession;
    return () => {
      globalSetSession = null;
    };
  }, [setSession]);

  // Computed properties
  const isTrialUser = state.billingStatus === 'trialing';
  const isActiveSubscriber = state.subscribed && state.status === 'active';
  
  const daysRemaining = React.useMemo(() => {
    const endDateStr = state.endDate || state.trialEnd;
    if (!endDateStr) return null;
    
    const endDate = new Date(endDateStr);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }, [state.endDate, state.trialEnd]);

  const canAccessFeature = useCallback((feature: string) => {
    // Define feature access based on tiers
    const featureMap: Record<string, string[]> = {
      'basic_features': ['Basic', 'Pro', 'Premium'],
      'advanced_features': ['Pro', 'Premium'],
      'premium_features': ['Premium'],
    };
    
    const allowedTiers = featureMap[feature] || [];
    return state.tier ? allowedTiers.includes(state.tier) : false;
  }, [state.tier]);

  const value: SubscriptionManager = {
    subscription: state,
    refresh,
    checkAccess,
    invalidateCache,
    isTrialUser,
    isActiveSubscriber,
    daysRemaining,
    canAccessFeature,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscriptionManager = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionManager must be used within a SubscriptionProvider');
  }
  return context;
};
