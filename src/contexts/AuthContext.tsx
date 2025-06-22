import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSubscriptionWithCache } from '@/hooks/useSubscriptionWithCache';
import { AuthUser, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);

  const { upsertUserProfile } = useUserProfile();
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

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email);
      
      if (!mounted) return;

      setSession(session);
      
      if (session?.user) {
        try {
          console.log('👤 Processing successful auth for user:', session.user.email);
          
          // Keep loading true while processing user profile
          setIsLoading(true);
          setIsProfileLoaded(false);
          
          // Enrich user profile
          const enrichedUser = await upsertUserProfile(session.user);
          if (mounted) {
            setUser(enrichedUser);
            setIsProfileLoaded(true);
            console.log('✅ User profile loaded:', enrichedUser);
            
            // Only set loading to false after both session and profile are ready
            setIsLoading(false);
            
            // Refresh subscription data in background
            setTimeout(() => {
              if (mounted && session) {
                refreshSubscription(session, false);
              }
            }, 100);
          }
        } catch (err) {
          console.error('❌ Error in auth state change:', err);
          if (mounted) {
            // Still set the user even if profile update fails
            setUser(session.user as AuthUser);
            setIsProfileLoaded(true);
            setIsLoading(false);
            console.log('⚠️ Using fallback user data due to profile error');
          }
        }
      } else {
        if (mounted) {
          console.log('🚪 User logged out or no session');
          setUser(null);
          setIsProfileLoaded(false);
          setIsLoading(false);
          clearCache();
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
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
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [upsertUserProfile, refreshSubscription, clearCache]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      console.log('🔑 Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Login error:', error);
        
        let errorMessage = "Login failed. Please check your credentials.";
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before logging in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
        } else if (error.message.includes('signups not allowed')) {
          errorMessage = 'New signups are currently disabled. Please contact support.';
        } else {
          errorMessage = error.message;
        }
        
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        setIsLoading(false);
        throw error;
      }
      
      console.log('✅ Login successful for:', data.user?.email);
      
      // Don't set isLoading to false here - let the auth state change handler do it
      // after the profile is loaded
    } catch (error) {
      console.error('❌ Login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out user');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Logout error:', error);
        throw error;
      }
      
      setUser(null);
      setSession(null);
      setIsProfileLoaded(false);
      clearCache();
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      toast({
        title: "Logout Error",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshSubscription = async (forceRefresh = false) => {
    if (session) {
      await refreshSubscription(session, forceRefresh);
    }
  };

  const value = {
    user,
    session,
    subscriptionData,
    login,
    logout,
    refreshSubscription: handleRefreshSubscription,
    checkSubscriptionAccess,
    isLoading: isLoading || !isProfileLoaded // Keep loading until both session and profile are ready
  };

  return (
    <AuthContext.Provider value={value}>
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
