"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type EnvCtx = { isClient: boolean; isNetlify: boolean; willUseProxy: boolean; hostname: string };
const EnvContext = createContext<EnvCtx>({ isClient: false, isNetlify: false, willUseProxy: false, hostname: "" });

export function EnvProvider({ children }: { children: React.ReactNode }) {
  // Hooks first, no conditionals
  const [isClient, setIsClient] = useState(false);
  const [state, setState] = useState<Omit<EnvCtx, "isClient">>({ isNetlify: false, willUseProxy: false, hostname: "" });

  useEffect(() => {
    setIsClient(true);
    // do detection on client only
    const hostname = window.location.hostname;
    const isNetlify = !!(window as any).__NETLIFY_DEV__ || /netlify\.app$/.test(hostname);
    const willUseProxy = isNetlify; // your rule
    setState({ isNetlify, willUseProxy, hostname });
    // LOG safely here, not during render
    console.info("[Env] ", { hostname, isNetlify, willUseProxy });
  }, []);

  const value = useMemo(() => ({ isClient, ...state }), [isClient, state]);
  return <EnvContext.Provider value={value}>{children}</EnvContext.Provider>;
}

export const useEnv = () => useContext(EnvContext);