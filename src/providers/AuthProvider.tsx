"use client";
import React, { createContext, useContext, useEffect, useMemo, useState, useRef, useCallback } from "react";
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { mockPartnerUser } from '@/data/mockPartnerData';
import { mockVendorUser } from '@/data/mockVendorData';

// Extended AuthUser interface for compatibility
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  user_metadata?: Record<string, unknown>;
  partnerId?: string;
}

type AuthCtx = { 
  session: Session | null; 
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
};

// Stable default context to prevent hook violations
const defaultAuthContext: AuthCtx = {
  session: null,
  user: null,
  loading: true,
  login: async () => {
    console.warn('AuthProvider not initialized - login unavailable');
    window.location.href = '/auth';
  },
  logout: async () => {
    console.log('🚪 Default logout - clearing session and redirecting');
    sessionStorage.clear();
    localStorage.removeItem('sb-kfdlxorqopnibuzexoko-auth-token');
    window.location.href = '/auth';
  },
  signOut: async () => {
    console.log('🚪 Default signOut - clearing session and redirecting');
    sessionStorage.clear();
    localStorage.removeItem('sb-kfdlxorqopnibuzexoko-auth-token');
    window.location.href = '/auth';
  },
};

const AuthContext = createContext<AuthCtx>(defaultAuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // CRITICAL: All hooks declared unconditionally at top level - never conditional
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(false);
  const isLoggingOutRef = useRef(false);
  
  // SAFE SETTER: Only set state if component is still mounted
  const safeSetSession = useCallback((newSession: Session | null) => {
    if (mountedRef.current) {
      setSession(newSession);
    }
  }, []);
  
  const safeSetUser = useCallback((newUser: AuthUser | null) => {
    if (mountedRef.current) {
      setUser(newUser);
    }
  }, []);
  
  const safeSetLoading = useCallback((newLoading: boolean) => {
    if (mountedRef.current) {
      setLoading(newLoading);
    }
  }, []);

  // Mount tracking effect
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Session initialization effect
  useEffect(() => {
    let cancelled = false;
    console.log('🔄 AuthProvider initializing session check');

    // Check for demo mode first
    const initializeDemoMode = () => {
      const demoCredentials = sessionStorage.getItem('demoCredentials');
      if (demoCredentials && !cancelled && mountedRef.current) {
        try {
          const credentials = JSON.parse(demoCredentials);
          if (credentials.isDemoMode && credentials.role) {
            console.log('🎭 Demo mode detected during auth init:', credentials.role);
            const mockUser = credentials.role === 'Partner Admin' ? 
              { ...mockPartnerUser, user_metadata: {}, partnerId: 'demo-partner-123' } : 
              { ...mockVendorUser, user_metadata: {} };
            
            safeSetUser(mockUser);
            safeSetSession(null); // Demo mode doesn't use real sessions
            safeSetLoading(false);
            return true; // Demo mode handled
          }
        } catch (error) {
          console.warn('Failed to parse demo credentials:', error);
        }
      }
      return false; // Not demo mode
    };

    // Initialize demo mode or real auth
    if (initializeDemoMode()) {
      return () => { cancelled = true; };
    }

    // Real auth initialization
    const initializeRealAuth = async () => {
      try {
        console.log('🔍 Getting initial session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
        }
        
        if (!cancelled && mountedRef.current) {
          console.log('✅ Initial session check:', !!session);
          safeSetSession(session);
          
          if (session?.user) {
            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
              role: session.user.user_metadata?.role || 'Partner Admin',
              avatar_url: session.user.user_metadata?.avatar_url,
              created_at: session.user.created_at,
              user_metadata: session.user.user_metadata
            };
            safeSetUser(authUser);
          } else {
            console.log('🚫 No initial session found');
            safeSetUser(null);
          }
          
          safeSetLoading(false);
        }
      } catch (error) {
        if (!cancelled && mountedRef.current) {
          console.error('Failed to get initial session:', error);
          safeSetLoading(false);
        }
      }
    };

    initializeRealAuth();

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (cancelled || !mountedRef.current) return;
      
      console.log('🔐 Auth state change:', event, !!newSession);
      
      safeSetSession(newSession);
      
      if (event === 'SIGNED_IN' && newSession?.user) {
        const authUser: AuthUser = {
          id: newSession.user.id,
          email: newSession.user.email || '',
          name: newSession.user.user_metadata?.name || newSession.user.email?.split('@')[0] || '',
          role: newSession.user.user_metadata?.role || 'Partner Admin',
          avatar_url: newSession.user.user_metadata?.avatar_url,
          created_at: newSession.user.created_at,
          user_metadata: newSession.user.user_metadata
        };
        safeSetUser(authUser);
      } else if (event === 'SIGNED_OUT') {
        safeSetUser(null);
      }
      
      if (event !== 'INITIAL_SESSION') {
        safeSetLoading(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [safeSetSession, safeSetUser, safeSetLoading]);

  // Demo mode change listener
  useEffect(() => {
    const handleDemoModeChange = () => {
      if (!mountedRef.current) return;
      
      console.log('🔄 Demo mode change event received');
      const demoCredentials = sessionStorage.getItem('demoCredentials');
      
      if (demoCredentials) {
        try {
          const credentials = JSON.parse(demoCredentials);
          if (credentials.isDemoMode && credentials.role) {
            console.log('🎭 Activating demo mode via event:', credentials.role);
            const mockUser = credentials.role === 'Partner Admin' ? 
              { ...mockPartnerUser, user_metadata: {}, partnerId: 'demo-partner-123' } : 
              { ...mockVendorUser, user_metadata: {} };
            
            safeSetUser(mockUser);
            safeSetSession(null);
            safeSetLoading(false);
          }
        } catch (error) {
          console.warn('Failed to parse demo credentials:', error);
        }
      } else {
        console.log('🚫 Deactivating demo mode via event');
        if (user && (user.email === 'partner@demo.com' || user.email === 'vendor@demo.com')) {
          safeSetUser(null);
          safeSetSession(null);
          safeSetLoading(false);
        }
      }
    };

    window.addEventListener('demo-mode-changed', handleDemoModeChange);
    return () => {
      window.removeEventListener('demo-mode-changed', handleDemoModeChange);
    };
  }, [user, safeSetUser, safeSetSession, safeSetLoading]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    if (isLoggingOutRef.current) return;
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    if (mountedRef.current && data.user) {
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || '',
        role: data.user.user_metadata?.role || 'Vendor',
        avatar_url: data.user.user_metadata?.avatar_url,
        created_at: data.user.created_at,
        user_metadata: data.user.user_metadata
      };
      safeSetUser(authUser);
      safeSetSession(data.session);
    }
  }, [safeSetUser, safeSetSession]);

  // Logout function
  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) {
      console.log('⏳ Logout already in progress');
      return;
    }
    
    isLoggingOutRef.current = true;
    
    try {
      console.log('🚪 Starting logout process');
      
      // Clear state immediately
      safeSetUser(null);
      safeSetSession(null);
      safeSetLoading(true);
      
      // Check for demo mode
      const demoCredentials = sessionStorage.getItem('demoCredentials');
      if (demoCredentials) {
        console.log('🎭 Demo logout - clearing demo data');
        sessionStorage.removeItem('demoCredentials');
        sessionStorage.removeItem('isDemoMode');
        setTimeout(() => {
          window.location.href = '/demo-login';
        }, 100);
        return;
      }
      
      // Real logout
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      
      // Force redirect after logout
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
      
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect on error
      setTimeout(() => {
        window.location.href = '/auth';
      }, 100);
    } finally {
      isLoggingOutRef.current = false;
    }
  }, [safeSetUser, safeSetSession, safeSetLoading]);

  // SignOut alias
  const signOut = useCallback(() => logout(), [logout]);

  // Memoized context value
  const value = useMemo(() => ({ 
    session, 
    user,
    loading,
    login,
    logout,
    signOut
  }), [session, user, loading, login, logout, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // CRITICAL: Never throw during render - return stable fallback with working logout
  if (!context) {
    console.warn('useAuth used outside AuthProvider - returning safe fallback');
    return {
      ...defaultAuthContext,
      logout: async () => {
        console.log('🚪 Fallback logout - redirecting to auth');
        // Safe logout that just redirects
        sessionStorage.clear();
        window.location.href = '/auth';
      },
      signOut: async () => {
        console.log('🚪 Fallback signOut - redirecting to auth'); 
        sessionStorage.clear();
        window.location.href = '/auth';
      }
    };
  }
  
  return context;
};