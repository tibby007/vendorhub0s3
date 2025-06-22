
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

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;

        setSession(session);
        
        if (session?.user) {
          try {
            // Set loading to false immediately when we have a session
            setIsLoading(false);
            
            // Enrich user profile without blocking the UI
            const enrichedUser = await upsertUserProfile(session.user);
            if (mounted) {
              setUser(enrichedUser);
              console.log('User profile loaded:', enrichedUser);
              
              // Check subscription status in background without blocking
              setTimeout(() => {
                if (mounted && session) {
                  refreshSubscription(session, false);
                }
              }, 100);
            }
          } catch (err) {
            console.error('Error in auth state change:', err);
            if (mounted) {
              // Still set the user even if profile update fails
              setUser(session.user as AuthUser);
              setIsLoading(false);
              
              // Try subscription check anyway
              setTimeout(() => {
                if (mounted && session) {
                  refreshSubscription(session, false);
                }
              }, 100);
            }
          }
        } else {
          if (mounted) {
            setUser(null);
            setIsLoading(false);
            clearCache();
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        if (mounted) {
          setIsLoading(false);
        }
        return;
      }
      
      if (mounted) {
        if (session) {
          setSession(session);
          // User data will be fetched by the auth state change handler
        } else {
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      
      setUser(null);
      setSession(null);
      clearCache();
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error('Logout error:', error);
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
    isLoading
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
