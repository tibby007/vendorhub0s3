"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

type AuthCtx = { session: Session | null; loading: boolean };
const AuthContext = createContext<AuthCtx>({ session: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 1) All hooks declared unconditionally, top-level only
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 2) Run effects, guard bodies (not hook calls)
  useEffect(() => {
    let active = true;

    // Initial session
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    // Listener
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!active) return;
      setSession(s ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, loading }), [session, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);