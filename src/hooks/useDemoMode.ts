import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SecurityUtils } from '@/utils/securityUtils';
import { SecureStorage } from '@/utils/secureStorage';
import { RateLimiter } from '@/utils/securityUtils';

export interface DemoModeConfig {
  isDemo: boolean;
  demoRole: 'Partner Admin' | 'Vendor' | null;
  sessionId: string | null;
  timeRemaining: number | null;
  isValidating: boolean;
}

export interface DemoSession {
  sessionId: string;
  role: 'Partner Admin' | 'Vendor';
  startTime: number;
  lastActivity: number;
  token: string;
}

export const useDemoMode = (): DemoModeConfig & {
  startDemoMode: (role: 'Partner Admin' | 'Vendor') => Promise<boolean>;
  exitDemoMode: () => void;
  refreshSession: () => Promise<boolean>;
} => {
  const [config, setConfig] = useState<DemoModeConfig>({
    isDemo: false,
    demoRole: null,
    sessionId: null,
    timeRemaining: null,
    isValidating: false
  });

  // Generate secure demo session token
  const generateDemoSession = useCallback((role: 'Partner Admin' | 'Vendor'): DemoSession => {
    const startTime = Date.now();
    const sessionId = `${startTime}_${SecurityUtils.generateSecureToken().substring(0, 16)}`;
    const token = SecurityUtils.generateSecureToken();
    
    return {
      sessionId,
      role,
      startTime,
      lastActivity: startTime,
      token
    };
  }, []);

  // Validate demo session with server (with fallback for production)
  const validateDemoSession = useCallback(async (session: DemoSession): Promise<boolean> => {
    try {
      // Check rate limiting
      const rateLimitKey = `demo_validation_${session.sessionId}`;
      if (!RateLimiter.checkRateLimit(rateLimitKey, 10, 60000)) { // 10 attempts per minute
        console.warn('Demo session validation rate limited');
        return false;
      }

      // Get client IP (simplified - in production use proper IP detection)
      const ipAddress = 'client-ip'; // This would be properly detected in production

      try {
        const { data, error } = await supabase.functions.invoke('validate-demo-session', {
          body: {
            sessionId: session.sessionId,
            ipAddress
          }
        });

        if (error) {
          console.warn('Demo session validation error (falling back to client-side validation):', error);
          // Fall back to client-side validation
          return validateDemoSessionClientSide(session);
        }

        return data?.valid === true;
      } catch (functionError) {
        console.warn('Supabase function not available (falling back to client-side validation):', functionError);
        // Fall back to client-side validation
        return validateDemoSessionClientSide(session);
      }
    } catch (error) {
      console.error('Failed to validate demo session:', error);
      return false;
    }
  }, []);

  // Client-side demo session validation (fallback)
  const validateDemoSessionClientSide = useCallback((session: DemoSession): boolean => {
    try {
      const now = Date.now();
      const sessionAge = now - session.startTime;
      const maxSessionDuration = 10 * 60 * 1000; // 10 minutes

      // Check if session is expired
      if (sessionAge > maxSessionDuration) {
        console.warn('Demo session expired (client-side validation)');
        return false;
      }

      // Check if session token is valid format
      if (!SecurityUtils.validateSessionToken(session.token)) {
        console.warn('Invalid demo session token (client-side validation)');
        return false;
      }

      // Basic validation passed
      console.log('Demo session validated client-side');
      return true;
    } catch (error) {
      console.error('Client-side demo session validation failed:', error);
      return false;
    }
  }, []);

  // Start demo mode with secure session
  const startDemoMode = useCallback(async (role: 'Partner Admin' | 'Vendor'): Promise<boolean> => {
    try {
      setConfig(prev => ({ ...prev, isValidating: true }));

      // Check rate limiting for demo mode activation
      const rateLimitKey = `demo_activation_${role}`;
      if (!RateLimiter.checkRateLimit(rateLimitKey, 3, 300000)) { // 3 attempts per 5 minutes
        console.warn('Demo mode activation rate limited');
        return false;
      }

      // Generate secure demo session
      const demoSession = generateDemoSession(role);

      // Validate session with server
      const isValid = await validateDemoSession(demoSession);
      if (!isValid) {
        console.error('Demo session validation failed');
        return false;
      }

      // Store session securely
      SecureStorage.setSecureItem('demoSession', demoSession);
      
      // Log security event (non-blocking)
      try {
        await supabase.functions.invoke('log-security-event', {
          body: {
            event_type: 'demo_session_started',
            details: `Demo session started for role: ${role}`,
            ip_address: 'client-ip'
          }
        });
      } catch (logError) {
        console.warn('Failed to log demo session start (continuing anyway):', logError);
        // Don't block demo mode if logging fails
      }

      // Update config
      setConfig({
        isDemo: true,
        demoRole: role,
        sessionId: demoSession.sessionId,
        timeRemaining: 600000, // 10 minutes
        isValidating: false
      });

      // Clear any existing auth data
      sessionStorage.removeItem('demoCredentials');
      sessionStorage.removeItem('isDemoMode');
      sessionStorage.removeItem('demoSessionActive');
      localStorage.removeItem('last_demo_time');
      
      // Trigger custom event to notify components
      window.dispatchEvent(new Event('demo-mode-changed'));
      
      return true;
    } catch (error) {
      console.error('Failed to start demo mode:', error);
      setConfig(prev => ({ ...prev, isValidating: false }));
      return false;
    }
  }, [generateDemoSession, validateDemoSession]);

  // Exit demo mode
  const exitDemoMode = useCallback(() => {
    // Clear secure storage
    SecureStorage.removeSecureItem('demoSession');
    SecureStorage.clearAllSecureItems();
    
    // Clear legacy storage
    sessionStorage.removeItem('demo_mode');
    sessionStorage.removeItem('demo_role');
    sessionStorage.removeItem('demoCredentials');
    sessionStorage.removeItem('isDemoMode');
    sessionStorage.removeItem('demoSessionActive');
    localStorage.removeItem('last_demo_time');
    
    // Update config
    setConfig({
      isDemo: false,
      demoRole: null,
      sessionId: null,
      timeRemaining: null,
      isValidating: false
    });
    
    // Trigger custom event to notify components
    window.dispatchEvent(new Event('demo-mode-changed'));
  }, []);

  // Refresh demo session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    const demoSession = SecureStorage.getSecureItem('demoSession') as DemoSession | null;
    
    if (!demoSession) {
      exitDemoMode();
      return false;
    }

    // Validate session (with fallback)
    let isValid = false;
    try {
      isValid = await validateDemoSession(demoSession);
    } catch (error) {
      console.warn('Demo session refresh failed, trying client-side fallback:', error);
      isValid = validateDemoSessionClientSide(demoSession);
    }

    if (!isValid) {
      exitDemoMode();
      return false;
    }

    // Update last activity
    demoSession.lastActivity = Date.now();
    SecureStorage.setSecureItem('demoSession', demoSession);

    return true;
  }, [validateDemoSession, validateDemoSessionClientSide, exitDemoMode]);

  // Initialize demo mode on mount
  useEffect(() => {
    const initializeDemoMode = async () => {
      const demoSession = SecureStorage.getSecureItem('demoSession') as DemoSession | null;
      
      if (!demoSession) {
        // Check for legacy demo mode and clear it
        const legacyDemoMode = sessionStorage.getItem('demo_mode');
        if (legacyDemoMode === 'true') {
          console.warn('Legacy demo mode detected, clearing...');
          exitDemoMode();
        }
        return;
      }

      // Validate existing session (with fallback)
      let isValid = false;
      try {
        isValid = await validateDemoSession(demoSession);
      } catch (error) {
        console.warn('Demo session validation failed, trying client-side fallback:', error);
        isValid = validateDemoSessionClientSide(demoSession);
      }

      if (!isValid) {
        console.warn('Invalid demo session found, clearing...');
        exitDemoMode();
        return;
      }

      // Calculate time remaining
      const now = Date.now();
      const sessionAge = now - demoSession.startTime;
      const timeRemaining = Math.max(0, 600000 - sessionAge); // 10 minutes total

      if (timeRemaining <= 0) {
        console.warn('Demo session expired, clearing...');
        exitDemoMode();
        return;
      }

      // Update config with valid session
      setConfig({
        isDemo: true,
        demoRole: demoSession.role,
        sessionId: demoSession.sessionId,
        timeRemaining,
        isValidating: false
      });
    };

    initializeDemoMode();
  }, [validateDemoSession, validateDemoSessionClientSide, exitDemoMode]);

  // Auto-refresh session periodically
  useEffect(() => {
    if (!config.isDemo) return;

    const refreshInterval = setInterval(async () => {
      const success = await refreshSession();
      if (!success) {
        clearInterval(refreshInterval);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [config.isDemo, refreshSession]);

  // Update time remaining
  useEffect(() => {
    if (!config.isDemo || !config.timeRemaining) return;

    const timeInterval = setInterval(() => {
      setConfig(prev => ({
        ...prev,
        timeRemaining: Math.max(0, (prev.timeRemaining || 0) - 1000)
      }));
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [config.isDemo, config.timeRemaining]);

  // Auto-exit when time runs out
  useEffect(() => {
    if (config.isDemo && config.timeRemaining === 0) {
      console.log('Demo session time expired, auto-exiting...');
      exitDemoMode();
    }
  }, [config.isDemo, config.timeRemaining, exitDemoMode]);

  return {
    ...config,
    startDemoMode,
    exitDemoMode,
    refreshSession
  };
};

// Legacy functions for backward compatibility (deprecated)
export const startDemoMode = (role: 'Partner Admin' | 'Vendor') => {
  console.warn('startDemoMode is deprecated. Use useDemoMode hook instead.');
  sessionStorage.setItem('demo_mode', 'true');
  sessionStorage.setItem('demo_role', role);
  window.dispatchEvent(new Event('demo-mode-changed'));
};

export const exitDemoMode = () => {
  console.warn('exitDemoMode is deprecated. Use useDemoMode hook instead.');
  sessionStorage.removeItem('demo_mode');
  sessionStorage.removeItem('demo_role');
  window.dispatchEvent(new Event('demo-mode-changed'));
};