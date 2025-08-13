import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User, LoginCredentials, RegisterCredentials } from '../types';

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<{ error?: string }>;
  signUp: (credentials: RegisterCredentials) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    setLoading(true);
    
    try {
      // Fetch real user profile from database
      const { data: userProfile, error } = await supabase
        .from('users')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setUserProfile(null);
        return;
      }

      setUserProfile(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      
      // Use Supabase authentication
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) {
        setLoading(false);
        return { error: error.message };
      }
      return {};
    } catch (error) {
      setLoading(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (credentials: RegisterCredentials) => {
    // Note: User registration is now handled by Netlify functions
    // This method is kept for interface compatibility but should not be used directly
    // Use the specific signup endpoints in BrokerSignup and VendorSignup components instead
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) return { error: error.message };

      // The user will need to verify their email before they can sign in
      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) return { error: error.message };
      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};