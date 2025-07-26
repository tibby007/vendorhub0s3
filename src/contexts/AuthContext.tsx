
import React, { createContext, useContext } from 'react';
import { AuthContextType } from '@/types/auth';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthActions } from '@/hooks/useAuthActions';
import { useSubscriptionManager } from '@/hooks/useSubscriptionManager';
import { setGlobalSession } from '@/contexts/SubscriptionContext';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authState = useAuthState();
  const { refresh: refreshSubscription } = useSubscriptionManager();
  
  // Update subscription session when auth session changes
  React.useEffect(() => {
    setGlobalSession(authState.session);
  }, [authState.session]);
  
  const authActions = useAuthActions({
    setIsLoading: () => {}, // This will be handled by the auth state hook
    setUser: authState.setUser,
    setSession: authState.setSession,
    clearCache: authState.clearCache,
    clearProfileCache: authState.clearProfileCache,
    refreshSubscription: async (session, forceRefresh) => {
      await refreshSubscription(forceRefresh || false);
    },
    session: authState.session
  });

  const value = {
    user: authState.user,
    session: authState.session,
    subscriptionData: authState.subscriptionData,
    login: authActions.login,
    logout: authActions.logout,
    refreshSubscription: (forceRefresh?: boolean) => refreshSubscription(forceRefresh || false),
    checkSubscriptionAccess: authState.checkSubscriptionAccess,
    isLoading: authState.isLoading
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
