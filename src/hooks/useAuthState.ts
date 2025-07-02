
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSubscriptionWithCache } from '@/hooks/useSubscriptionWithCache';
import { AuthUser } from '@/types/auth';

export const useAuthState = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { upsertUserProfile, clearProfileCache } = useUserProfile();
  const { 
    subscriptionData, 
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refreshSubscription, 
    checkSubscriptionAccess,
    clearCache
  } = useSubscriptionWithCache();

  useEffect(() => {
    let mounted = true;
    let profileProcessing = false;
    let authProcessingTimer: NodeJS.Timeout | null = null;
    let lastProcessedEvent = '';
    let lastProcessedTime = 0;

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      // Prevent rapid successive identical events
      const now = Date.now();
      const eventKey = `${event}-${session?.user?.id || 'null'}`;
      
      if (eventKey === lastProcessedEvent && now - lastProcessedTime < 1000) {
        console.log('⏭️ Skipping duplicate auth event:', event);
        return;
      }
      
      lastProcessedEvent = eventKey;
      lastProcessedTime = now;
      
      console.log('🔐 Auth state changed:', event, session?.user?.email);
      
      if (!mounted) return;

      // Clear any pending auth processing
      if (authProcessingTimer) {
        clearTimeout(authProcessingTimer);
      }

      // Debounce auth processing to prevent loops
      authProcessingTimer = setTimeout(async () => {
        if (!mounted) return;

        setSession(session);
        
        if (session?.user && !profileProcessing) {
          profileProcessing = true;
          
          try {
            console.log('👤 Processing successful auth for user:', session.user.email);
            
            // Enrich user profile with error handling
            const enrichedUser = await upsertUserProfile(session.user);
            if (mounted) {
              setUser(enrichedUser);
              console.log('✅ User profile loaded:', enrichedUser);
              
              // Refresh subscription data in background with longer delay
              setTimeout(() => {
                if (mounted && session) {
                  refreshSubscription(session, false);
                }
              }, 1000);
            }
          } catch (err: any) {
            console.error('❌ Error in auth state change:', err);
            if (mounted) {
              // Still set the user even if profile update fails
              setUser(session.user as AuthUser);
              console.log('⚠️ Using fallback user data due to profile error');
              
              // Show a toast for persistent errors only
              if (!err.message?.includes('Failed to fetch')) {
                toast({
                  title: "Profile Loading Issue",
                  description: "Using basic profile data. Some features may be limited.",
                  variant: "destructive",
                });
              }
            }
          } finally {
            profileProcessing = false;
          }
        } else {
          if (mounted) {
            console.log('🚪 User logged out or no session');
            setUser(null);
            clearCache();
            clearProfileCache();
          }
        }
        
        // Always set loading to false after processing
        if (mounted) {
          setIsLoading(false);
        }
      }, 100); // 100ms debounce
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session with retry logic
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        if (mounted) {
          if (session) {
            console.log('🔄 Initial session found:', session.user?.email);
            handleAuthStateChange('INITIAL_SESSION', session);
          } else {
            console.log('❌ No initial session found');
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('❌ Failed to initialize auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Add a small delay before initializing to prevent race conditions
    setTimeout(initializeAuth, 50);

    return () => {
      mounted = false;
      if (authProcessingTimer) {
        clearTimeout(authProcessingTimer);
      }
      subscription.unsubscribe();
    };
  }, [upsertUserProfile, refreshSubscription, clearCache, clearProfileCache]);

  return {
    user,
    session,
    subscriptionData,
    isLoading,
    setUser,
    setSession,
    refreshSubscription,
    checkSubscriptionAccess,
    clearCache,
    clearProfileCache
  };
};
