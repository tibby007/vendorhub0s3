import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mockDataService } from '@/services/mockDataService';
import { secureSessionManager } from '@/utils/secureSessionManager';
import { secureLogger } from '@/utils/secureLogger';

interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: 'Partner Admin' | 'Vendor' | 'Super Admin';
  avatar_url?: string;
  created_at: string;
  user_metadata?: any;
  partnerId?: string;
}

interface DemoContextType {
  isDemo: boolean;
  demoUser: DemoUser | null;
  demoRole: string | null;
  sessionId: string | null;
  timeRemaining: number | null;
  isLoading: boolean;
  startDemoSession: (email: string) => Promise<boolean>;
  endDemoSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemo, setIsDemo] = useState(false);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [demoRole, setDemoRole] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing demo session on mount
  useEffect(() => {
    const checkDemoSession = async () => {
      try {
        const demoSession = await secureSessionManager.getSecureItem('demoSession');
        const isDemoMode = await secureSessionManager.getSecureItem('isDemoMode');
        
        if (demoSession && isDemoMode) {
          setIsDemo(true);
          setDemoUser(demoSession.user);
          setDemoRole(demoSession.demoRole);
          setSessionId(demoSession.sessionId);
          
          // Calculate remaining time (10 minutes max)
          const elapsed = Date.now() - demoSession.startTime;
          const remaining = Math.max(0, 600000 - elapsed); // 10 minutes in ms
          setTimeRemaining(remaining);
          
          if (remaining === 0) {
            await endDemoSession();
          }
        }
      } catch (error) {
        secureLogger.error('Failed to check demo session', {
          component: 'DemoContext',
          action: 'check_session_error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkDemoSession();
  }, []);

  // Timer for demo session countdown
  useEffect(() => {
    if (isDemo && timeRemaining && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev > 1000) {
            return prev - 1000;
          } else {
            endDemoSession();
            return null;
          }
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isDemo, timeRemaining]);

  const startDemoSession = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Get demo user data
      const userData = await mockDataService.getUser(email);
      if (!userData) {
        throw new Error('Demo user not found');
      }

      const sessionData = {
        user: userData,
        isDemo: true,
        demoRole: userData.role,
        sessionId: `demo_${Date.now()}`,
        startTime: Date.now()
      };

      // Store session data
      await secureSessionManager.setSecureItem('demoSession', sessionData);
      await secureSessionManager.setSecureItem('isDemoMode', true);
      await secureSessionManager.setSecureItem('demoCredentials', {
        email: userData.email,
        name: userData.name,
        role: userData.role
      });

      // Update state
      setIsDemo(true);
      setDemoUser(userData);
      setDemoRole(userData.role);
      setSessionId(sessionData.sessionId);
      setTimeRemaining(600000); // 10 minutes

      secureLogger.auditLog('demo_session_started', {
        component: 'DemoContext',
        action: 'start_session',
        userId: userData.id,
        role: userData.role,
        sessionId: sessionData.sessionId
      });

      return true;
    } catch (error) {
      secureLogger.error('Failed to start demo session', {
        component: 'DemoContext',
        action: 'start_session_error'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const endDemoSession = async (): Promise<void> => {
    try {
      secureLogger.auditLog('demo_session_ended', {
        component: 'DemoContext',
        action: 'end_session',
        sessionId
      });

      // Clear all demo data
      await secureSessionManager.removeSecureItem('demoSession');
      await secureSessionManager.removeSecureItem('isDemoMode');
      await secureSessionManager.removeSecureItem('demoCredentials');

      // Reset state
      setIsDemo(false);
      setDemoUser(null);
      setDemoRole(null);
      setSessionId(null);
      setTimeRemaining(null);

      // Redirect to demo login
      if (typeof window !== 'undefined') {
        window.location.href = '/demo-login';
      }
    } catch (error) {
      secureLogger.error('Failed to end demo session', {
        component: 'DemoContext',
        action: 'end_session_error'
      });
    }
  };

  const refreshSession = async (): Promise<void> => {
    if (sessionId) {
      // Extend session by resetting timer
      setTimeRemaining(600000); // Reset to 10 minutes
      
      const sessionData = await secureSessionManager.getSecureItem('demoSession');
      if (sessionData) {
        sessionData.startTime = Date.now();
        await secureSessionManager.setSecureItem('demoSession', sessionData);
      }

      secureLogger.info('Demo session refreshed', {
        component: 'DemoContext',
        action: 'refresh_session',
        sessionId
      });
    }
  };

  const value: DemoContextType = {
    isDemo,
    demoUser,
    demoRole,
    sessionId,
    timeRemaining,
    isLoading,
    startDemoSession,
    endDemoSession,
    refreshSession
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};