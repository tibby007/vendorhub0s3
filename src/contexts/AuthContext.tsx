
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { mockPartnerUser, mockVendorUser } from '@/data/mockPartnerData';
import { useDemoMode } from '@/hooks/useDemoMode';

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

interface MockSubscriptionData {
  subscriptionStatus: 'active';
  planType: 'pro';
  trialDaysRemaining: 0;
  subscribed: true;
  subscription_tier: 'pro';
  subscription_end: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  subscriptionData: MockSubscriptionData | null;
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
  const { isDemo, demoRole } = useDemoMode();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock subscription data for demo mode
  const mockSubscriptionData: MockSubscriptionData = {
    subscriptionStatus: 'active',
    planType: 'pro', 
    trialDaysRemaining: 0,
    subscribed: true,
    subscription_tier: 'pro',
    subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
  };

  useEffect(() => {
    // Handle demo mode
    if (isDemo && demoRole) {
      const mockUser = demoRole === 'Partner Admin' ? 
        { ...mockPartnerUser, user_metadata: {}, partnerId: 'demo-partner-123' } : 
        { ...mockVendorUser, user_metadata: {} };
      setUser(mockUser);
      setSession(null); // No real session in demo mode
      setLoading(false);
      return;
    }

    // Handle real authentication
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Use users table instead of user_profiles since it doesn't exist
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
            role: session.user.user_metadata?.role || 'Vendor',
            avatar_url: session.user.user_metadata?.avatar_url,
            created_at: session.user.created_at,
            user_metadata: session.user.user_metadata
          });
        } catch (error) {
          console.error('Error setting user data:', error);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
            role: 'Vendor',
            avatar_url: session.user.user_metadata?.avatar_url,
            created_at: session.user.created_at,
            user_metadata: session.user.user_metadata
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isDemo, demoRole]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    if (isDemo) {
      // Clear demo mode
      sessionStorage.removeItem('demo_mode');
      sessionStorage.removeItem('demo_role');
      setUser(null);
      setSession(null);
      return;
    }
    
    await supabase.auth.signOut();
  };

  const signOut = logout; // Alias for compatibility

  const refreshSubscription = async (forceRefresh?: boolean) => {
    // Mock implementation for demo mode
    if (isDemo) return;
    // Real implementation would refresh subscription here
  };

  const checkSubscriptionAccess = (requiredTier: string) => {
    // Always allow access in demo mode
    if (isDemo) return true;
    // Real implementation would check subscription access
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      subscriptionData: isDemo ? mockSubscriptionData : null,
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
