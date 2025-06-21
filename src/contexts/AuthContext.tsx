
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthUser extends User {
  role?: string;
  name?: string;
  partnerId?: string;
}

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  subscriptionData: SubscriptionData | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSubscription: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createMissingUserProfile = async (authUser: User) => {
    try {
      console.log('Creating missing user profile for:', authUser.id);
      const { error } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: 'Partner Admin' // Default role
        });

      if (error) {
        console.error('Error creating missing user profile:', error);
        return null;
      }

      // Return the created user data
      return {
        role: 'Partner Admin',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        partner_id: null
      };
    } catch (error) {
      console.error('Error in createMissingUserProfile:', error);
      return null;
    }
  };

  const fetchUserProfile = async (authUser: User) => {
    try {
      console.log('Fetching user profile for:', authUser.id);
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user data:', error);
        // If user doesn't exist, try to create the profile
        if (error.code === 'PGRST116') { // No rows returned
          console.log('User profile not found, creating one...');
          const createdUserData = await createMissingUserProfile(authUser);
          
          if (createdUserData) {
            return {
              ...authUser,
              role: createdUserData.role,
              name: createdUserData.name,
              partnerId: createdUserData.partner_id,
            } as AuthUser;
          }
        }
        // Fallback to basic auth user data
        return authUser as AuthUser;
      }

      if (!userData) {
        console.log('No user data found, creating profile...');
        const createdUserData = await createMissingUserProfile(authUser);
        
        if (createdUserData) {
          return {
            ...authUser,
            role: createdUserData.role,
            name: createdUserData.name,
            partnerId: createdUserData.partner_id,
          } as AuthUser;
        }
        return authUser as AuthUser;
      }

      return {
        ...authUser,
        role: userData.role,
        name: userData.name,
        partnerId: userData.partner_id,
      } as AuthUser;
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      return authUser as AuthUser;
    }
  };

  const refreshSubscription = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      setSubscriptionData(data);
      console.log('Subscription data refreshed:', data);
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  };

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
              const enrichedUser = await fetchUserProfile(session.user);
              setUser(enrichedUser);
              console.log('User profile loaded:', enrichedUser);
              
              // Check subscription status after setting user
              setTimeout(() => {
                refreshSubscription();
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
  }, []);

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

  const value = {
    user,
    session,
    subscriptionData,
    login,
    logout,
    refreshSubscription,
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
