import { SecureStorage } from './secureStorage';

export const DEMO_EVENTS = {
  SESSION_STARTED: 'demo_session_started',
  SESSION_EXPIRED: 'demo_session_expired',
  SESSION_ENDED: 'demo_session_ended',
  PAGE_VIEW: 'demo_page_view',
  FEATURE_USED: 'demo_feature_used',
  UPGRADE_PROMPTED: 'demo_upgrade_prompted',
  UPGRADE_CLICKED: 'demo_upgrade_clicked',
  REGISTRATION_SUCCESS: 'demo_registration_success',
  REGISTRATION_FAILED: 'demo_registration_failed',
  LOGIN_ATTEMPT: 'demo_login_attempt',
  SESSION_WARNING: 'demo_session_warning'
} as const;

interface DemoSessionData {
  sessionId: string;
  userId?: string;
  userRole: string;
  startTime: number;
  lastActivity: number;
  events: DemoEvent[];
  userData: any;
  isActive: boolean;
}

interface DemoEvent {
  type: string;
  data: any;
  timestamp: number;
}

export class DemoAnalytics {
  private static SESSION_KEY = 'demo_session';
  private static SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  private static WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

  static startSession(userData: any, userRole: string): string {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    
    const sessionData: DemoSessionData = {
      sessionId,
      userRole,
      startTime: now,
      lastActivity: now,
      events: [],
      userData: this.sanitizeUserData(userData),
      isActive: true
    };

    SecureStorage.setSecureItem(this.SESSION_KEY, sessionData);
    console.log('Demo session started:', sessionId);
    
    // Track session start event
    this.trackEvent(DEMO_EVENTS.SESSION_STARTED, {
      sessionId,
      userRole,
      userData: sessionData.userData
    });

    return sessionId;
  }

  static isActiveSession(): boolean {
    const session = this.getCurrentSession();
    if (!session) return false;
    
    const now = Date.now();
    const sessionAge = now - session.lastActivity;
    
    if (sessionAge > this.SESSION_DURATION) {
      this.endSession();
      return false;
    }
    
    return session.isActive;
  }

  static getCurrentSession(): DemoSessionData | null {
    return SecureStorage.getSecureItem(this.SESSION_KEY);
  }

  static updateActivity(): void {
    const session = this.getCurrentSession();
    if (!session) return;
    
    session.lastActivity = Date.now();
    SecureStorage.setSecureItem(this.SESSION_KEY, session);
  }

  static trackEvent(eventType: string, data: any = {}): void {
    const session = this.getCurrentSession();
    if (!session) return;
    
    const event: DemoEvent = {
      type: eventType,
      data: this.sanitizeEventData(data),
      timestamp: Date.now()
    };
    
    session.events.push(event);
    session.lastActivity = Date.now();
    
    // Keep only last 100 events to prevent storage overflow
    if (session.events.length > 100) {
      session.events = session.events.slice(-100);
    }
    
    SecureStorage.setSecureItem(this.SESSION_KEY, session);
    console.log('Demo event tracked:', eventType, data);
  }

  static getSessionTimeRemaining(): number {
    const session = this.getCurrentSession();
    if (!session) return 0;
    
    const now = Date.now();
    const elapsed = now - session.lastActivity;
    const remaining = this.SESSION_DURATION - elapsed;
    
    return Math.max(0, remaining);
  }

  static shouldShowWarning(): boolean {
    const remaining = this.getSessionTimeRemaining();
    return remaining > 0 && remaining <= this.WARNING_THRESHOLD;
  }

  static endSession(): void {
    const session = this.getCurrentSession();
    if (session) {
      this.trackEvent(DEMO_EVENTS.SESSION_ENDED, {
        sessionDuration: Date.now() - session.startTime,
        totalEvents: session.events.length
      });
      
      // Send analytics data to server before ending session
      this.sendAnalyticsToServer(session);
    }
    
    SecureStorage.removeSecureItem(this.SESSION_KEY);
    console.log('Demo session ended');
  }

  static getSessionStats(): any {
    const session = this.getCurrentSession();
    if (!session) return null;
    
    const now = Date.now();
    const duration = now - session.startTime;
    const eventCounts = session.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      sessionId: session.sessionId,
      userRole: session.userRole,
      duration,
      totalEvents: session.events.length,
      eventCounts,
      isActive: this.isActiveSession()
    };
  }

  private static generateSessionId(): string {
    return 'demo_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  }

  private static sanitizeUserData(userData: any): any {
    if (!userData) return {};
    
    // Remove sensitive fields and sanitize others
    const sanitized = { ...userData };
    delete sanitized.password;
    delete sanitized.csrfToken;
    
    // Sanitize string fields
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].substring(0, 100); // Limit string length
      }
    });
    
    return sanitized;
  }

  private static sanitizeEventData(data: any): any {
    if (!data) return {};
    
    const sanitized = { ...data };
    
    // Remove potentially sensitive fields
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.credentials;
    
    // Limit data size
    const jsonString = JSON.stringify(sanitized);
    if (jsonString.length > 1000) {
      return { truncated: true, originalSize: jsonString.length };
    }
    
    return sanitized;
  }

  private static async sendAnalyticsToServer(session: DemoSessionData): Promise<void> {
    try {
      // In a real implementation, you would send this to your analytics endpoint
      const analyticsData = {
        sessionId: session.sessionId,
        userRole: session.userRole,
        duration: Date.now() - session.startTime,
        events: session.events.map(event => ({
          type: event.type,
          timestamp: event.timestamp,
          data: event.data
        })),
        userData: session.userData
      };
      
      console.log('Demo analytics data ready for server:', analyticsData);
      
      // TODO: Send to analytics endpoint
      // await fetch('/api/demo-analytics', {
      //   method: 'POST',
      //   body: JSON.stringify(analyticsData)
      // });
      
    } catch (error) {
      console.error('Failed to send demo analytics:', error);
    }
  }
}

// Auto-update activity on user interactions
if (typeof window !== 'undefined') {
  const events = ['click', 'keydown', 'scroll', 'mousemove'];
  let lastActivity = 0;
  
  events.forEach(eventType => {
    document.addEventListener(eventType, () => {
      const now = Date.now();
      // Throttle activity updates to once per 30 seconds
      if (now - lastActivity > 30000) {
        DemoAnalytics.updateActivity();
        lastActivity = now;
      }
    }, { passive: true });
  });
}
