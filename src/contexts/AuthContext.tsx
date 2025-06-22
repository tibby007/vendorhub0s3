
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
  checkSubscriptionAccess: (requiredTier?: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const upsertUserProfile = async (authUser: User) => {
    try {
      console.log('Upserting user profile for:', authUser.id);
      
      // First check if user exists
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking existing user:', selectError);
      }

      let userData;
      
      if (existingUser) {
        console.log('User profile already exists, using existing data:', existingUser);
        userData = existingUser;
      } else {
        // Create new profile with proper defaults
        const defaultRole = authUser.user_metadata?.role || 'Partner Admin';
        const defaultName = authUser.user_metadata?.name || 
                           authUser.email?.split('@')[0] || 
                           'User';

        console.log('Creating new user profile with:', { defaultRole, defaultName });
        
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email || '',
            name: defaultName,
            role: defaultRole,
            partner_id: defaultRole === 'Partner Admin' ? crypto.randomUUID() : null
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          // If insert fails due to conflict, try to fetch existing user again
          if (insertError.code === '23505') {
            console.log('Conflict detected, fetching existing user...');
            const { data: conflictUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single();
            userData = conflictUser;
          } else {
            throw insertError;
          }
        } else {
          userData = newUser;
        }
      }

      // Return enriched user data
      return {
        ...authUser,
        role: userData?.role || authUser.user_metadata?.role || 'Partner Admin',
        name: userData?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        partnerId: userData?.partner_id,
      } as AuthUser;

    } catch (err) {
      console.error('Error in upsertUserProfile:', err);
      // Fallback to user metadata if available
      return {
        ...authUser,
        role: authUser.user_metadata?.role || 'Partner Admin',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        partnerId: null,
      } as AuthUser;
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

  const checkSubscriptionAccess = (requiredTier?: string) => {
    if (!subscriptionData?.subscribed) return false;
    
    if (!requiredTier) return true;
    
    const tierLevels = { 'Basic': 1, 'Pro': 2, 'Premium': 3 };
    const userTierLevel = tierLevels[subscriptionData.subscription_tier as keyof typeof tierLevels] || 0;
    const requiredTierLevel = tierLevels[requiredTier as keyof typeof tierLevels] || 0;
    
    return userTierLevel >= requiredTierLevel;
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
              const enrichedUser = await upsertUserProfile(session.user);
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
