
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSubscriptionManager } from '@/hooks/useSubscriptionManager';
import { AuthUser } from '@/types/auth';

export const useAuthState = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionProcessed, setSessionProcessed] = useState(false);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);

  const { upsertUserProfile, clearProfileCache } = useUserProfile();
  const { 
    subscription, 
    refresh: refreshSubscription, 
    checkAccess: checkSubscriptionAccess,
    invalidateCache: clearCache
  } = useSubscriptionManager();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth event:', event, session?.user?.id || 'no-user');

      // CRITICAL: Prevent duplicate processing
      const currentSessionId = session?.user?.id || null;
      if (event === 'INITIAL_SESSION' && currentSessionId === lastSessionId && sessionProcessed) {
        console.log('🚫 Skipping duplicate INITIAL_SESSION');
        return;
      }

      // CRITICAL: Always set loading false on any auth event
      setIsLoading(false);

      if (session?.user) {
        setLastSessionId(currentSessionId);
        setSessionProcessed(true);
        setSession(session);
        setUser(session.user);
        
        // Skip profile upsert for now to prevent timeout
        console.log('✅ User authenticated, skipping profile upsert');
      } else {
        setLastSessionId(null);
        setSessionProcessed(true);
        setSession(null);
        setUser(null);
        console.log('🚪 No session found');
      }
    });

    return () => subscription.unsubscribe();
  }, [sessionProcessed, lastSessionId]);

  // CRITICAL: Force loading to false after 10 seconds max
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      console.log('⏰ Loading timeout reached, forcing loading to false');
      setIsLoading(false);
    }, 10000);

    return () => clearTimeout(loadingTimeout);
  }, []);

  // Create legacy interface for subscriptionData
  const subscriptionData = subscription.subscribed ? {
    subscribed: subscription.subscribed,
    subscription_tier: subscription.tier,
    subscription_end: subscription.endDate,
  } : null;

  return {
    user,
    session,
    subscriptionData,
    isLoading,
    setUser,
    setSession,
    refreshSubscription: (session: Session | null, forceRefresh?: boolean) => {
      refreshSubscription(forceRefresh || false);
    },
    checkSubscriptionAccess,
    clearCache,
    clearProfileCache
  };
};
