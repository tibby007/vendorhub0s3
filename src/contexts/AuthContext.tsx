
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { mockPartnerUser } from '@/data/mockPartnerData';
import { mockVendorUser } from '@/data/mockVendorData';
import { SecureStorage } from '@/utils/secureStorage';
import { setGlobalSession } from '@/contexts/SubscriptionContext';
import { secureLogout } from '@/utils/secureLogout';
import { secureSessionManager } from '@/utils/secureSessionManager';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  user_metadata?: any; // For compatibility
  partnerId?: string; // For compatibility
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

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  subscriptionData: SubscriptionData | null;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSubscription: (forceRefresh?: boolean) => Promise<void>;
  checkSubscriptionAccess: (requiredTier: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Mock subscription data for demo mode
  const mockSubscriptionData: SubscriptionData = {
    subscriptionStatus: 'active',
    planType: 'pro', 
    trialDaysRemaining: 0,
    subscribed: true,
    subscription_tier: 'Pro',
    subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
  };

  useEffect(() => {
    console.log('🔄 AuthContext initializing auth listener');
    
    let isCleanedUp = false;
    let authSubscription: any = null;

    // Check for existing session first
    const initializeAuth = async () => {
      if (isCleanedUp) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 Initial session check:', !!session);
        
        if (!isCleanedUp && session?.user) {
          const authUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
            role: session.user.user_metadata?.role || 'Partner Admin',
            avatar_url: session.user.user_metadata?.avatar_url,
            created_at: session.user.created_at,
            user_metadata: session.user.user_metadata
          };
          setUser(authUser);
          setSession(session);
          setTimeout(() => {
            if (!isCleanedUp) setGlobalSession(session);
          }, 100);
          console.log('✅ Initial user set:', authUser);
        } else if (!isCleanedUp) {
          console.log('🚫 No initial session found');
        }
      } catch (error) {
        if (!isCleanedUp) {
          console.error('Error checking initial session:', error);
        }
      } finally {
        if (!isCleanedUp) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up real authentication listener with guards to prevent infinite loops
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isCleanedUp) return;
      
      console.log('🔐 Auth state change:', event, !!session);
      
      // Prevent infinite loops by checking if session actually changed
      if (event === 'INITIAL_SESSION' && !session) {
        if (!isCleanedUp) setLoading(false);
        return;
      }
      
      if (!isCleanedUp) setSession(session);
      
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session?.user && !isCleanedUp) {
        try {
          // Use users table instead of user_profiles since it doesn't exist
          const authUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
            role: session.user.user_metadata?.role || 'Partner Admin',
            avatar_url: session.user.user_metadata?.avatar_url,
            created_at: session.user.created_at,
            user_metadata: session.user.user_metadata
          };
          setUser(authUser);
          console.log('✅ User set for', event + ':', authUser);
        } catch (error) {
          if (!isCleanedUp) {
            console.error('Error setting user data:', error);
            const fallbackUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
              role: 'Partner Admin',
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
              user_metadata: session.user.user_metadata
            };
            setUser(fallbackUser);
            console.log('✅ Fallback user set for', event + ':', fallbackUser);
          }
        }
        
        // Set global session after user is set successfully
        setTimeout(() => {
          if (!isCleanedUp) setGlobalSession(session);
        }, 100);
      } else if (event === 'SIGNED_OUT' && !isCleanedUp) {
        setUser(null);
        setGlobalSession(null);
        console.log('🚫 User signed out');
      }
      
      if (!isCleanedUp) setLoading(false);
    });
    
    authSubscription = subscription;

    return () => {
      console.log('🧹 Cleaning up auth listener');
      isCleanedUp = true;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Separate effect for demo mode initialization
  useEffect(() => {
    const initializeDemoMode = () => {
      const demoCredentials = sessionStorage.getItem('demoCredentials');
      if (demoCredentials) {
        try {
          const credentials = JSON.parse(demoCredentials);
          if (credentials.isDemoMode && credentials.role) {
            console.log('🎭 Demo credentials detected, setting up demo user:', credentials.role);
            
            const mockUser = credentials.role === 'Partner Admin' ? 
              { ...mockPartnerUser, user_metadata: {}, partnerId: 'demo-partner-123' } : 
              { ...mockVendorUser, user_metadata: {} };
            
            setUser(mockUser);
            setSession(null);
            setSubscriptionData(mockSubscriptionData);
            setLoading(false);
            console.log('✅ Demo user set:', mockUser);
          }
        } catch (error) {
          console.warn('Failed to parse demo credentials:', error);
        }
      }
    };

    // Initialize on mount
    initializeDemoMode();
  }, []);

  // Listen for demo mode changes
  useEffect(() => {
    const handleDemoModeChange = () => {
      console.log('🔄 Demo mode changed event received');
      // Force re-evaluation by checking storage directly
      const demoCredentials = sessionStorage.getItem('demoCredentials');
      if (demoCredentials) {
        try {
          const credentials = JSON.parse(demoCredentials);
          if (credentials.isDemoMode && credentials.role) {
            console.log('🎭 Demo mode activated via event, setting up user for role:', credentials.role);
            const mockUser = credentials.role === 'Partner Admin' ? 
              { ...mockPartnerUser, user_metadata: {}, partnerId: 'demo-partner-123' } : 
              { ...mockVendorUser, user_metadata: {} };
            
            setUser(mockUser);
            setSession(null);
            setSubscriptionData(mockSubscriptionData);
            setLoading(false);
            console.log('✅ Demo user set via event:', mockUser);
          }
        } catch (error) {
          console.warn('Failed to parse demo credentials:', error);
        }
      } else {
        console.log('🚫 Demo mode deactivated via event');
        if (user && (user.email === 'partner@demo.com' || user.email === 'vendor@demo.com')) {
          setUser(null);
          setSubscriptionData(null);
          setLoading(false);
        }
      }
    };

    window.addEventListener('demo-mode-changed', handleDemoModeChange);
    return () => window.removeEventListener('demo-mode-changed', handleDemoModeChange);
  }, []);

  // Load subscription data when user changes - fixed dependency array
  useEffect(() => {
    if (user?.email && !subscriptionData) {
      // Only load if we don't already have subscription data
      refreshSubscription();
    } else if (!user?.email && subscriptionData) {
      setSubscriptionData(null);
    }
  }, [user?.email]); // Removed refreshSubscription to prevent circular dependency

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser({
      id: data.user.id,
      email: data.user.email || '',
      name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || '',
      role: data.user.user_metadata?.role || 'Vendor',
      avatar_url: data.user.user_metadata?.avatar_url,
      created_at: data.user.created_at,
      user_metadata: data.user.user_metadata
    });
    setSession(data.session);
    // Debounce session sync for login
    setTimeout(() => setGlobalSession(data.session), 100);
  };

  const logout = async () => {
    // Prevent concurrent logout attempts
    if (isLoggingOut) {
      console.log('⏳ Logout already in progress, skipping');
      return;
    }

    try {
      setIsLoggingOut(true);
      setLoading(true);
      
      // Clear state immediately to prevent further operations
      setUser(null);
      setSession(null);
      setSubscriptionData(null);
      
      // Then call secure logout which will handle redirect
      await secureLogout.logout({
        clearAllSessions: true,
        reason: 'user_initiated',
        redirectTo: '/auth'
      });
      
      // Don't set loading to false here - we're redirecting anyway
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state even on error
      setUser(null);
      setSession(null);
      setSubscriptionData(null);
      setLoading(false);
      setIsLoggingOut(false);
    }
  };

  const signOut = logout; // Alias for compatibility

  const refreshSubscription = useCallback(async (forceRefresh?: boolean) => {
    if (!user?.email) return;
    
    // Check for demo mode
    const demoCredentials = sessionStorage.getItem('demoCredentials');
    if (demoCredentials) {
      setSubscriptionData(mockSubscriptionData);
      return;
    }
    
    try {
      console.log('🔄 Refreshing subscription data for:', user.email);
      
      // Try to get subscription data from subscribers table
      const { data: subscriber, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (subscriber) {
        console.log('✅ Found subscriber data:', subscriber);
        const subscriptionEnd = subscriber.subscription_end ? new Date(subscriber.subscription_end) : null;
        const now = new Date();
        const isActive = subscriber.subscribed && subscriptionEnd && subscriptionEnd > now;
        const isTrialing = !subscriber.subscribed && subscriptionEnd && subscriptionEnd > now;
        
        setSubscriptionData({
          subscriptionStatus: isActive ? 'active' : isTrialing ? 'trialing' : 'inactive',
          planType: subscriber.subscription_tier?.toLowerCase() || 'basic',
          trialDaysRemaining: isTrialing && subscriptionEnd ? Math.ceil((subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
          subscribed: subscriber.subscribed || false,
          subscription_tier: subscriber.subscription_tier || 'Basic',
          subscription_end: subscriber.subscription_end,
          status: subscriber.subscribed ? 'active' : 'trialing'
        });
      } else {
        console.log('❌ No subscriber data found, setting default');
        // Set a basic subscription state for users without subscriber data
        setSubscriptionData({
          subscriptionStatus: 'active',
          planType: 'premium', // Default for existing users
          trialDaysRemaining: 0,
          subscribed: true,
          subscription_tier: 'Premium',
          subscription_end: null,
          status: 'active'
        });
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      // Set fallback subscription data
      setSubscriptionData({
        subscriptionStatus: 'active',
        planType: 'premium',
        trialDaysRemaining: 0,
        subscribed: true,
        subscription_tier: 'Premium',
        subscription_end: null,
        status: 'active'
      });
    }
  }, [user?.email]);

  const checkSubscriptionAccess = (requiredTier: string) => {
    // Always allow access in demo mode
    const demoCredentials = sessionStorage.getItem('demoCredentials');
    if (demoCredentials) return true;
    
    // Real subscription check would go here
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      subscriptionData,
      loading, 
      isLoading: loading,
      login,
      logout,
      signOut, 
      refreshSubscription,
      checkSubscriptionAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
