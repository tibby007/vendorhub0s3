import { useRef } from "react";

export function useHookTripwire(name: string) {
  const countRef = useRef(0);
  const renderCountRef = useRef(0);
  
  countRef.current++;
  renderCountRef.current++;
  
  if (import.meta.env.DEV) {
    // You should see the same count across renders of the same component path
    console.debug(`[HOOK-TRIPWIRE] ${name} - Hook #1 (tripwire) called. Total renders: ${renderCountRef.current}`);
    
    // If this number changes unexpectedly, it indicates hook order violation
    if (renderCountRef.current > 1) {
      console.warn(`[HOOK-TRIPWIRE] ${name} - Component re-rendered ${renderCountRef.current} times. Check for hook order violations!`);
    }
    
    // Add stack trace for debugging in severe cases
    if (renderCountRef.current > 10) {
      console.error(`[HOOK-TRIPWIRE] ${name} - Excessive re-renders (${renderCountRef.current})! Possible hook order violation:`, new Error().stack);
    }
  }
}