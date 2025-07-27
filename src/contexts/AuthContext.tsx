
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { mockPartnerUser } from '@/data/mockPartnerData';
import { mockVendorUser } from '@/data/mockVendorData';
import { SecureStorage } from '@/utils/secureStorage';

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
    console.log('🔄 AuthContext effect triggered:', { 
      currentUserEmail: user?.email, 
      loading 
    });

    // Check for demo credentials directly (simple check without circular dependency)
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
          setLoading(false);
          console.log('✅ Demo user set:', mockUser);
          return;
        }
      } catch (error) {
        console.warn('Failed to parse demo credentials:', error);
      }
    }

    // If not in demo mode, clear demo user
    if (!demoCredentials && user && (user.email === 'partner@demo.com' || user.email === 'vendor@demo.com')) {
      console.log('🚫 Clearing demo user, not in demo mode');
      setUser(null);
      setLoading(false);
      return;
    }

    // Handle real authentication only if not in demo mode
    if (!demoCredentials) {
      console.log('🔐 Setting up real auth listener');
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth state change:', event, !!session);
        setSession(session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Use users table instead of user_profiles since it doesn't exist
            const authUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
              role: session.user.user_metadata?.role || 'Vendor',
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
              user_metadata: session.user.user_metadata
            };
            setUser(authUser);
            console.log('✅ Real user set:', authUser);
          } catch (error) {
            console.error('Error setting user data:', error);
            const fallbackUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
              role: 'Vendor',
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
              user_metadata: session.user.user_metadata
            };
            setUser(fallbackUser);
            console.log('✅ Fallback user set:', fallbackUser);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          console.log('🚫 User signed out');
        }
        setLoading(false);
      });

      return () => {
        console.log('🧹 Cleaning up auth listener');
        subscription.unsubscribe();
      };
    }
  }, [user]);

  // Listen for demo mode changes
  useEffect(() => {
    const handleDemoModeChange = () => {
      console.log('🔄 Demo mode changed event received');
      // Force re-evaluation by checking storage directly
      const demoSession = SecureStorage.getSecureItem('demoSession');
      if (demoSession && demoSession.role) {
        console.log('🎭 Demo mode activated via event, setting up user for role:', demoSession.role);
        const mockUser = demoSession.role === 'Partner Admin' ? 
          { ...mockPartnerUser, user_metadata: {}, partnerId: 'demo-partner-123' } : 
          { ...mockVendorUser, user_metadata: {} };
        
        setUser(mockUser);
        setSession(null);
        setLoading(false);
        console.log('✅ Demo user set via event:', mockUser);
      } else if (!demoSession) {
        console.log('🚫 Demo mode deactivated via event');
        if (user && (user.email === 'partner@demo.com' || user.email === 'vendor@demo.com')) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    window.addEventListener('demo-mode-changed', handleDemoModeChange);
    return () => window.removeEventListener('demo-mode-changed', handleDemoModeChange);
  }, [user]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    console.log('🚪 Logout triggered');
    
    // Check if this is a demo session
    const demoCredentials = sessionStorage.getItem('demoCredentials');
    if (demoCredentials) {
      console.log('🎭 Clearing demo mode');
      // Clear all demo mode storage
      sessionStorage.removeItem('demo_mode');
      sessionStorage.removeItem('demo_role'); 
      sessionStorage.removeItem('demoCredentials');
      sessionStorage.removeItem('isDemoMode');
      sessionStorage.removeItem('demoSessionActive');
      localStorage.removeItem('last_demo_time');
      
      // Clear demo user
      setUser(null);
      setSession(null);
      
      // Navigate to demo page
      window.location.href = '/demo';
      return;
    }
    
    console.log('🔐 Performing real logout');
    await supabase.auth.signOut();
  };

  const signOut = logout; // Alias for compatibility

  const refreshSubscription = async (forceRefresh?: boolean) => {
    // Mock implementation for demo mode
    const demoCredentials = sessionStorage.getItem('demoCredentials');
    if (demoCredentials) return;
    // Real implementation would refresh subscription here
  };

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
      subscriptionData: sessionStorage.getItem('demoCredentials') ? mockSubscriptionData : null,
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
