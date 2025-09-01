
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AuthUser } from '@/types/auth';
import { useRef, useEffect } from 'react';

interface UseAuthActionsProps {
  setIsLoading: (loading: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: unknown | null) => void; // avoid explicit any
  clearCache: () => void;
  clearProfileCache: () => void;
  refreshSubscription: (forceRefresh?: boolean) => Promise<void>;
  session: unknown | null;
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
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const login = async (email: string, password: string) => {
    if (isMountedRef.current) {
      setIsLoading(true);
    }
    
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
        
        if (isMountedRef.current) {
          setIsLoading(false);
        }
        throw error;
      }
      
      console.log('✅ Login successful for:', data.user?.email);
      
      // Don't set isLoading to false here - let the auth state change handler do it
    } catch (error) {
      console.error('❌ Login error:', error);
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out user');
      
      // Clear all local storage and session storage
      localStorage.clear();
      sessionStorage.clear();
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('❌ Logout error:', error);
        throw error;
      }
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setUser(null);
        setSession(null);
        clearCache();
        clearProfileCache();
        
        // State cleanup handled by providers
      }
      
      if (isMountedRef.current) {
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out",
        });
      }
      
      // Force a page reload to ensure complete state cleanup
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      if (isMountedRef.current) {
        toast({
          title: "Logout Error",
          description: "There was an error logging out. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRefreshSubscription = async (forceRefresh = false): Promise<void> => {
    await refreshSubscription(forceRefresh);
  };

  return {
    login,
    logout,
    refreshSubscription: handleRefreshSubscription
  };
};
