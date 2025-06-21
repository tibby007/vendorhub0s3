
interface DemoEvent {
  event: string;
  data?: Record<string, any>;
  timestamp: string;
  sessionId: string;
}

interface DemoSession {
  sessionId: string;
  leadData: any;
  startTime: string;
  endTime?: string;
  events: DemoEvent[];
  role: string;
}

export class DemoAnalytics {
  private static SESSION_KEY = 'demo_session';
  private static EVENTS_KEY = 'demo_events';

  static startSession(leadData: any, role: string): string {
    const sessionId = Math.random().toString(36).substring(7);
    const session: DemoSession = {
      sessionId,
      leadData,
      startTime: new Date().toISOString(),
      events: [],
      role
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    this.trackEvent('demo_started', { role });
    
    return sessionId;
  }

  static endSession(): void {
    const session = this.getCurrentSession();
    if (session) {
      session.endTime = new Date().toISOString();
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      this.trackEvent('demo_ended', { 
        duration: this.getSessionDuration(),
        totalEvents: session.events.length
      });
    }
  }

  static trackEvent(event: string, data?: Record<string, any>): void {
    const session = this.getCurrentSession();
    if (!session) return;

    const demoEvent: DemoEvent = {
      event,
      data,
      timestamp: new Date().toISOString(),
      sessionId: session.sessionId
    };

    session.events.push(demoEvent);
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

    // Also store in a separate events array for easy access
    const allEvents = this.getAllEvents();
    allEvents.push(demoEvent);
    localStorage.setItem(this.EVENTS_KEY, JSON.stringify(allEvents));

    console.log('Demo event tracked:', demoEvent);
  }

  static getCurrentSession(): DemoSession | null {
    const sessionData = localStorage.getItem(this.SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  static getAllEvents(): DemoEvent[] {
    const eventsData = localStorage.getItem(this.EVENTS_KEY);
    return eventsData ? JSON.parse(eventsData) : [];
  }

  static getSessionDuration(): number {
    const session = this.getCurrentSession();
    if (!session) return 0;

    const start = new Date(session.startTime);
    const end = session.endTime ? new Date(session.endTime) : new Date();
    return Math.floor((end.getTime() - start.getTime()) / 1000); // in seconds
  }

  static isActiveSession(): boolean {
    const session = this.getCurrentSession();
    if (!session || session.endTime) return false;

    // Check if session is within 30 minutes
    const start = new Date(session.startTime);
    const now = new Date();
    const diffMinutes = (now.getTime() - start.getTime()) / (1000 * 60);
    
    return diffMinutes < 30;
  }

  static getSessionSummary(): any {
    const session = this.getCurrentSession();
    const events = this.getAllEvents();
    
    if (!session) return null;

    return {
      sessionId: session.sessionId,
      leadData: session.leadData,
      role: session.role,
      duration: this.getSessionDuration(),
      totalEvents: session.events.length,
      uniqueEvents: [...new Set(session.events.map(e => e.event))],
      isActive: this.isActiveSession(),
      events: events.filter(e => e.sessionId === session.sessionId)
    };
  }

  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  static exportSessionData(): string {
    const summary = this.getSessionSummary();
    return JSON.stringify(summary, null, 2);
  }
}

// Common demo events
export const DEMO_EVENTS = {
  DEMO_STARTED: 'demo_started',
  DEMO_ENDED: 'demo_ended',
  PAGE_VIEW: 'page_view',
  FEATURE_CLICKED: 'feature_clicked',
  FORM_SUBMITTED: 'form_submitted',
  UPGRADE_PROMPTED: 'upgrade_prompted',
  UPGRADE_CLICKED: 'upgrade_clicked',
  SESSION_EXPIRED: 'session_expired',
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  NAVIGATION: 'navigation'
} as const;
