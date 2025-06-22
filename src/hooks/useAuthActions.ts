
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AuthUser } from '@/types/auth';
import { Session } from '@supabase/supabase-js';

interface UseAuthActionsProps {
  setIsLoading: (loading: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  clearCache: () => void;
  clearProfileCache: () => void;
  refreshSubscription: (session: Session, forceRefresh?: boolean) => Promise<void>;
  session: Session | null;
}

export const useAuthActions = ({
  setIsLoading,
  setUser,
  setSession,
  clearCache,
  clearProfileCache,
  refreshSubscription,
  session
}: UseAuthActionsProps) => {
  
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
      clearCache();
      clearProfileCache();
      
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

  const handleRefreshSubscription = async (forceRefresh = false): Promise<void> => {
    if (session) {
      await refreshSubscription(session, forceRefresh);
    }
  };

  return {
    login,
    logout,
    refreshSubscription: handleRefreshSubscription
  };
};
