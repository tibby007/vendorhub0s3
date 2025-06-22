import { useState, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

interface CachedSubscriptionData extends SubscriptionData {
  cachedAt: number;
  expiresAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY = 1000; // 1 second

export const useSubscriptionWithCache = () => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cache = useRef<CachedSubscriptionData | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isRequestInFlight = useRef(false);

  const getCachedData = useCallback((): SubscriptionData | null => {
    if (!cache.current) return null;
    
    const now = Date.now();
    if (now > cache.current.expiresAt) {
      cache.current = null;
      return null;
    }
    
    return {
      subscribed: cache.current.subscribed,
      subscription_tier: cache.current.subscription_tier,
      subscription_end: cache.current.subscription_end,
    };
  }, []);

  const setCachedData = useCallback((data: SubscriptionData) => {
    const now = Date.now();
    cache.current = {
      ...data,
      cachedAt: now,
      expiresAt: now + CACHE_DURATION,
    };
  }, []);

  const fetchSubscriptionData = useCallback(async (session: Session | null, forceRefresh = false) => {
    if (!session) {
      setSubscriptionData(null);
      setError(null);
      return;
    }

    // Check cache first unless forced refresh
    if (!forceRefresh) {
      const cachedData = getCachedData();
      if (cachedData) {
        setSubscriptionData(cachedData);
        setError(null);
        return;
      }
    }

    // Prevent multiple simultaneous requests
    if (isRequestInFlight.current) {
      console.log('Subscription check already in progress, skipping...');
      return;
    }

    setIsLoading(true);
    setError(null);
    isRequestInFlight.current = true;

    try {
      const { data, error: apiError } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (apiError) {
        throw new Error(apiError.message || 'Failed to check subscription');
      }

      // Cache and set the data
      setCachedData(data);
      setSubscriptionData(data);
      console.log('Subscription data refreshed and cached:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error checking subscription:', err);
      setError(errorMessage);
      
      // If we have cached data and this is just a refresh error, keep using cached data
      const cachedData = getCachedData();
      if (cachedData && !forceRefresh) {
        console.log('Using cached subscription data due to error');
        setSubscriptionData(cachedData);
        setError(null); // Don't show error if we have cached data
      }
    } finally {
      setIsLoading(false);
      isRequestInFlight.current = false;
    }
  }, [getCachedData, setCachedData]);

  const debouncedRefresh = useCallback((session: Session | null, forceRefresh = false) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      fetchSubscriptionData(session, forceRefresh);
    }, DEBOUNCE_DELAY);
  }, [fetchSubscriptionData]);

  const refreshSubscription = useCallback((session: Session | null, forceRefresh = false) => {
    // For immediate refresh (force), don't debounce
    if (forceRefresh) {
      fetchSubscriptionData(session, true);
    } else {
      debouncedRefresh(session, false);
    }
  }, [fetchSubscriptionData, debouncedRefresh]);

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
    isLoading,
    error,
    refreshSubscription,
    checkSubscriptionAccess,
    clearCache: () => { cache.current = null; },
  };
};
