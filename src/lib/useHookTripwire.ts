import { useRef } from "react";

export function useHookTripwire(name: string) {
  const countRef = useRef(0);
  const renderCountRef = useRef(0);
  
  countRef.current++;
  renderCountRef.current++;
  
  if (import.meta.env.DEV) {
    // Only log on first render to reduce noise
    if (renderCountRef.current === 1) {
      console.debug(`✅ [HOOK-TRIPWIRE] ${name} - Component initialized successfully`);
    }
    
    // Warn about excessive re-renders
    if (renderCountRef.current > 5) {
      console.warn(`⚠️ [HOOK-TRIPWIRE] ${name} - High re-render count: ${renderCountRef.current}. Check for hook order violations!`);
    }
    
    // Error on excessive re-renders
    if (renderCountRef.current > 15) {
      console.error(`🚨 [HOOK-TRIPWIRE] ${name} - CRITICAL: Excessive re-renders (${renderCountRef.current})! Possible hook order violation:`, new Error().stack);
    }
  }
}