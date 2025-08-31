import { supabase } from '@/integrations/supabase/client';
import { secureSessionManager } from './secureSessionManager';
import { secureLogger } from './secureLogger';
import { csrfProtection } from './csrfProtection';

interface LogoutOptions {
  clearAllSessions?: boolean;
  redirectTo?: string;
  reason?: 'user_initiated' | 'session_timeout' | 'security_logout' | 'demo_cleanup';
}

class SecureLogout {
  private static instance: SecureLogout;
  private logoutInProgress = false;

  private constructor() {}

  static getInstance(): SecureLogout {
    if (!SecureLogout.instance) {
      SecureLogout.instance = new SecureLogout();
    }
    return SecureLogout.instance;
  }

  async logout(options: LogoutOptions = {}): Promise<void> {
    const {
      clearAllSessions = false,
      redirectTo = '/auth',
      reason = 'user_initiated'
    } = options;

    if (this.logoutInProgress) {
      secureLogger.warn('Logout already in progress', { action: 'logout_duplicate' });
      return;
    }

    this.logoutInProgress = true;

    try {
      const isDemo = await this.isDemoMode();
      
      if (!isDemo) {
        secureLogger.auditLog('logout_started', {
          reason,
          action: 'logout'
        });
      }

      await this.clearClientSideData();

      if (isDemo) {
        await this.handleDemoLogout(redirectTo);
      } else {
        await this.handleRealLogout(clearAllSessions, redirectTo);
      }

      if (!isDemo) {
        secureLogger.auditLog('logout_completed', {
          reason,
          action: 'logout'
        });
      }

    } catch (error) {
      const isDemo = await this.isDemoMode();
      
      if (!isDemo) {
        secureLogger.error('Logout failed', {
          reason,
          action: 'logout_error'
        });
      }
      
      await this.forceLogout(redirectTo);
    } finally {
      this.logoutInProgress = false;
    }
  }

  private async isDemoMode(): Promise<boolean> {
    try {
      const demoCredentials = await secureSessionManager.getSecureItem('demoCredentials');
      const isDemoMode = await secureSessionManager.getSecureItem('isDemoMode');
      
      const legacyDemo = sessionStorage.getItem('demoCredentials') || 
                        sessionStorage.getItem('isDemoMode') ||
                        sessionStorage.getItem('demo_mode');

      return !!(demoCredentials || isDemoMode || legacyDemo);
    } catch (error) {
      return false;
    }
  }

  private async clearClientSideData(): Promise<void> {
    try {
      await secureSessionManager.clearAllSecureItems();
      
      await csrfProtection.clearToken();
      
      const keysToRemove = [
        'demo_mode', 'demo_role', 'demoCredentials', 'isDemoMode',
        'demoRole', 'demoSessionActive', 'demo_session', 'selectedPlan',
        'subscription_check_attempts', 'last_subscription_request'
      ];

      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      });

      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.startsWith('secure_') || key.startsWith('demo_') || key.startsWith('temp_')) {
          sessionStorage.removeItem(key);
        }
      });

      const localKeys = Object.keys(localStorage);
      localKeys.forEach(key => {
        if (key.startsWith('last_demo_') || key.startsWith('demo_') || key.startsWith('temp_')) {
          localStorage.removeItem(key);
        }
      });

      this.clearTimers();

    } catch (error) {
      secureLogger.error('Failed to clear client-side data', {
        action: 'clear_client_data'
      });
    }
  }

  private clearTimers(): void {
    try {
      const highestTimeoutId = setTimeout(() => {}, 0);
      for (let i = 0; i <= highestTimeoutId; i++) {
        clearTimeout(i);
      }

      const highestIntervalId = setInterval(() => {}, 9999);
      for (let i = 0; i <= highestIntervalId; i++) {
        clearInterval(i);
      }
    } catch (error) {
      secureLogger.warn('Failed to clear all timers', {
        action: 'clear_timers'
      });
    }
  }

  private async handleDemoLogout(redirectTo: string): Promise<void> {
    console.log('[SecureLogout] Demo logout - skipping all API calls');
    
    // Skip all API calls in demo mode - just clear data and redirect
    // Use requestAnimationFrame to ensure DOM updates are complete
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.location.href = '/demo-login';
      }, 50);
    });
  }

  private async handleRealLogout(clearAllSessions: boolean, redirectTo: string): Promise<void> {
    try {
      const signOutOptions = clearAllSessions ? { scope: 'global' } : { scope: 'local' };
      
      const { error } = await supabase.auth.signOut(signOutOptions);
      
      if (error) {
        throw error;
      }

      secureLogger.auditLog('supabase_logout_success', {
        scope: signOutOptions.scope,
        action: 'supabase_logout'
      });

      await this.notifyServerLogout();

      // Use requestAnimationFrame to ensure DOM updates are complete before redirect
      requestAnimationFrame(() => {
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 50);
      });

    } catch (error) {
      secureLogger.error('Real logout failed', {
        action: 'real_logout_error'
      });
      throw error;
    }
  }

  private async notifyServerLogout(): Promise<void> {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ timestamp: Date.now() })
      });
    } catch (error) {
      secureLogger.warn('Failed to notify server of logout', {
        action: 'server_logout_notification'
      });
    }
  }

  private async forceLogout(redirectTo: string): Promise<void> {
    const isDemo = await this.isDemoMode();
    
    if (!isDemo) {
      secureLogger.warn('Force logout initiated', { action: 'force_logout' });
    }
    
    try {
      await this.clearClientSideData();
    } catch (error) {
      if (!isDemo) {
        secureLogger.error('Force logout - failed to clear data', {
          action: 'force_logout_clear_failed'
        });
      }
    }

    sessionStorage.clear();
    localStorage.clear();

    // In demo mode, redirect to demo login instead
    window.location.href = isDemo ? '/demo-login' : redirectTo;
  }

  async scheduleAutoLogout(inactivityPeriod: number = 1800000): Promise<void> {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        this.logout({
          reason: 'session_timeout',
          redirectTo: '/auth?reason=timeout'
        });
      }, inactivityPeriod);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    window.addEventListener('beforeunload', () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    });
  }

  async emergencyLogout(): Promise<void> {
    secureLogger.auditLog('emergency_logout', { action: 'emergency_logout' });
    await this.forceLogout('/auth?reason=emergency');
  }
}

export const secureLogout = SecureLogout.getInstance();

export const useSecureLogout = () => {
  return {
    logout: secureLogout.logout.bind(secureLogout),
    emergencyLogout: secureLogout.emergencyLogout.bind(secureLogout),
    scheduleAutoLogout: secureLogout.scheduleAutoLogout.bind(secureLogout)
  };
};