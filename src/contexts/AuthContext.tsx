
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { AuthUser, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { upsertUserProfile } = useUserProfile();
  const { 
    subscriptionData, 
    setSubscriptionData, 
    refreshSubscription, 
    checkSubscriptionAccess 
  } = useSubscription();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        
        if (session?.user) {
          // Use setTimeout to defer the async operation and prevent blocking
          setTimeout(async () => {
            try {
              const enrichedUser = await upsertUserProfile(session.user);
              setUser(enrichedUser);
              console.log('User profile loaded:', enrichedUser);
              
              // Check subscription status after setting user
              setTimeout(() => {
                refreshSubscription(session);
              }, 500);
            } catch (err) {
              console.error('Error in auth state change:', err);
              setUser(session.user as AuthUser);
            }
          }, 0);
        } else {
          setUser(null);
          setSubscriptionData(null);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        // User data will be fetched by the auth state change handler
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [upsertUserProfile, refreshSubscription, setSubscriptionData]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
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
    
    setIsLoading(false);
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    
    setUser(null);
    setSession(null);
    setSubscriptionData(null);
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const handleRefreshSubscription = async () => {
    await refreshSubscription(session);
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
