import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useHookTripwire } from '@/lib/useHookTripwire';

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

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes - production stability
const DEBOUNCE_DELAY = 2000; // 2 seconds - prevent API flooding

// Global session management
let globalSetSession: ((session: Session | null) => void) | null = null;

export const setGlobalSession = (session: Session | null) => {
  if (globalSetSession) {
    globalSetSession(session);
  }
};

// Add instance tracking to prevent multiple initializations
let providerInstanceCount = 0;

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useHookTripwire('SubscriptionProvider');
  const instanceId = useRef(++providerInstanceCount);
  
  // Only log for the first instance to reduce console noise
  if (instanceId.current === 1) {
    console.log('[SubscriptionContext] SubscriptionProvider initializing');
  } else {
    console.warn(`[SubscriptionContext] Multiple provider instances detected (${instanceId.current})`);
  }
  
  const [state, dispatch] = useReducer(subscriptionReducer, initialState);
  const sessionRef = useRef<Session | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isRequestInFlight = useRef(false);
  const initializedRef = useRef(false);

  const isCacheValid = useCallback(() => {
    if (state.lastUpdated === 0) return false;
    return Date.now() - state.lastUpdated < CACHE_DURATION;
  }, [state.lastUpdated]);

  const fetchSubscriptionData = useCallback(async (forceRefresh = false) => {
    const session = sessionRef.current;
    console.log('[SubscriptionContext] fetchSubscriptionData called. forceRefresh:', forceRefresh);
    console.log('[SubscriptionContext] Current session:', session);
    
    // OWNER BYPASS: support@emergestack.dev gets full access without subscription checks
    const userEmail = session?.user?.email;
    if (userEmail === 'support@emergestack.dev') {
      console.log('[SubscriptionContext] OWNER BYPASS - giving full access');
      dispatch({
        type: 'SET_SUBSCRIPTION_DATA',
        payload: {
          subscribed: true,
          tier: 'Premium',
          status: 'active',
          endDate: null,
          billingStatus: 'active',
          planType: 'premium',
          lastUpdated: Date.now(),
          isLoading: false,
          error: null
        }
      });
      return;
    }
    
    // Check for demo mode first - bypass all subscription checks
    // Demo mode can be detected through multiple methods for reliability
    const isDemoCredentials = sessionStorage.getItem('demoCredentials') !== null;
    const isDemoMode = sessionStorage.getItem('isDemoMode') !== null;
    const isDemoSession = sessionStorage.getItem('demoSession') !== null;
    const isAnyDemoMode = isDemoCredentials || isDemoMode || isDemoSession;
    
    if (isAnyDemoMode) {
      console.log('[SubscriptionContext] Demo mode detected - returning mock subscription data');
      const demoSubscriptionData: Partial<SubscriptionState> = {
        subscribed: true,
        tier: 'Pro',
        status: 'active',
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        priceId: 'price_demo',
        billingStatus: 'active',
        planType: 'pro',
        trialEnd: null,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null
      };
      dispatch({ type: 'SET_SUBSCRIPTION_DATA', payload: demoSubscriptionData });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    
    if (!session) {
      console.warn('[SubscriptionContext] Early return: No session present. Skipping subscription fetch.');
      dispatch({ type: 'RESET' });
      return;
    }

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid()) {
      console.log('[SubscriptionContext] Early return: Using cached subscription data.');
      return;
    }

    // Prevent multiple simultaneous requests with additional safeguard
    if (isRequestInFlight.current) {
      console.warn('[SubscriptionContext] Early return: Request already in flight. Skipping.');
      return;
    }
    
    // Additional rate limiting - max 1 request per 5 seconds
    const now = Date.now();
    const lastRequest = sessionStorage.getItem('last_subscription_request');
    if (lastRequest && (now - parseInt(lastRequest)) < 5000) {
      console.warn('[SubscriptionContext] Rate limited: Too many requests. Using cache.');
      return;
    }
    sessionStorage.setItem('last_subscription_request', now.toString());

    dispatch({ type: 'SET_LOADING', payload: true });
    isRequestInFlight.current = true;

    try {
      console.log('[SubscriptionContext] About to call check-subscription function');
      // Fetch subscription data from check-subscription edge function
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      console.log('[SubscriptionContext] check-subscription response:', { subscriptionData, subscriptionError });
      console.log('[SubscriptionContext] DETAILED subscription data:', {
        subscribed: subscriptionData?.subscribed,
        subscription_tier: subscriptionData?.subscription_tier,
        trial_active: subscriptionData?.trial_active,
        subscription_end: subscriptionData?.subscription_end,
        stripe_subscription_id: subscriptionData?.stripe_subscription_id
      });
      
      // Since subscription_tier is 'Basic', this suggests the webhook didn't save Premium correctly
      if (subscriptionData?.subscription_tier === 'Basic' && subscriptionData?.stripe_subscription_id) {
        console.error('🚨 TIER MISMATCH: Paid subscription shows Basic tier - webhook may have failed to extract Premium tier from Stripe metadata');
      }

      if (subscriptionError) {
        console.error('[SubscriptionContext] Subscription error:', subscriptionError);
        // Don't throw error for new users - treat as no subscription
        console.log('[SubscriptionContext] Treating as new user with no subscription');
        const newUserState: Partial<SubscriptionState> = {
          subscribed: false,
          tier: null,
          status: subscriptionData?.needs_setup ? 'expired' : 'loading', // Only show expired if user needs setup
          endDate: null,
          priceId: null,
          billingStatus: null,
          planType: null,
          trialEnd: null,
        };
        dispatch({ type: 'SET_SUBSCRIPTION_DATA', payload: newUserState });
        return;
      }

      // Process subscription data from check-subscription function - NO DIRECT DATABASE CALLS
      if (subscriptionData) {
        const subscriptionState: Partial<SubscriptionState> = {
          subscribed: subscriptionData.subscribed || false,
          tier: subscriptionData.subscription_tier as 'Basic' | 'Pro' | 'Premium' || null,
          status: subscriptionData.trial_active ? 'trial' : (subscriptionData.subscribed ? 'active' : 'expired'),
          endDate: subscriptionData.subscription_end || null,
          priceId: subscriptionData.price_id || null,
          billingStatus: subscriptionData.trial_active ? 'trialing' : (subscriptionData.subscribed ? 'active' : null),
          planType: subscriptionData.subscription_tier?.toLowerCase() || null,
          trialEnd: subscriptionData.trial_active ? subscriptionData.subscription_end : null,
          lastUpdated: Date.now(),
          isLoading: false,
          error: null
        };

        console.log('[SubscriptionContext] Setting subscription state from check-subscription:', subscriptionState);
        dispatch({ type: 'SET_SUBSCRIPTION_DATA', payload: subscriptionState });
        return;
      }

      // No subscription data returned - user needs setup
      console.log('[SubscriptionContext] No subscription data returned from check-subscription function');
      const noSubscriptionState: Partial<SubscriptionState> = {
        subscribed: false,
        tier: null,
        status: 'expired',
        endDate: null,
        priceId: null,
        billingStatus: null,
        planType: null,
        trialEnd: null,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null
      };
      dispatch({ type: 'SET_SUBSCRIPTION_DATA', payload: noSubscriptionState });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[SubscriptionContext] Error fetching subscription data:', err);
      
      // Enhanced error handling - if rate limited, use cached data longer
      if (errorMessage.includes('rate') || errorMessage.includes('limit') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
        console.warn('[SubscriptionContext] Network/rate limit error, extending cache duration');
        if (state.lastUpdated > 0) {
          // Keep using existing data for network/rate limit errors
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }
      }
      
      // For database connection errors, provide graceful fallback
      if (errorMessage.includes('database') || errorMessage.includes('connection')) {
        console.error('[SubscriptionContext] Database error detected, providing trial access');
        const emergencyTrialState: Partial<SubscriptionState> = {
          subscribed: false,
          tier: 'Basic',
          status: 'trial',
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
          priceId: null,
          billingStatus: 'trialing',
          planType: 'basic',
          trialEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        };
        dispatch({ type: 'SET_SUBSCRIPTION_DATA', payload: emergencyTrialState });
        return;
      }
      
      // If we have cached data, keep using it on error
      if (isCacheValid()) {
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        // For new users, provide a clean state that will route to subscription setup
        console.log('[SubscriptionContext] Setting fallback state for new user (network error)');
        const fallbackState: Partial<SubscriptionState> = {
          subscribed: false,
          tier: null,
          status: 'expired', // This will trigger redirect to subscription setup
          endDate: null,
          priceId: null,
          billingStatus: null,
          planType: null,
          trialEnd: null,
        };
        dispatch({ type: 'SET_SUBSCRIPTION_DATA', payload: fallbackState });
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
    console.log('[SubscriptionContext] setSession called. Session:', !!session);
    
    // Prevent rapid session changes during PASSWORD_RECOVERY
    const currentSessionId = sessionRef.current?.user?.id;
    const newSessionId = session?.user?.id;
    
    if (currentSessionId === newSessionId && sessionRef.current && session) {
      console.log('[SubscriptionContext] Same session detected, skipping update to prevent loop');
      return;
    }
    
    sessionRef.current = session;
    if (!session) {
      dispatch({ type: 'RESET' });
    } else {
      // Auto-refresh when session is set (debounced)
      debouncedRefresh(false);
    }
  }, [debouncedRefresh]);

  // Set the global session handler and check for existing session
  useEffect(() => {
    console.log('[SubscriptionContext] Setting up global session handler');
    globalSetSession = setSession;
    
    // Check if there's already a session available (in case AuthContext initialized first)
    if (!initializedRef.current) {
      import('@/integrations/supabase/client').then(({ supabase }) => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session && !sessionRef.current) {
            console.log('[SubscriptionContext] Found existing session, initializing');
            setSession(session);
          }
          initializedRef.current = true;
        });
      });
    }
    
    return () => {
      console.log('[SubscriptionContext] Cleaning up global session handler');
      globalSetSession = null;
    };
  }, [setSession]);

  // Computed properties
  const isTrialUser = state.status === 'trial' || state.billingStatus === 'trialing';
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
