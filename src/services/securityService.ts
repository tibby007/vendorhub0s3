import { supabase } from '@/integrations/supabase/client';
import { securityEventSchema, loginAttemptSchema } from '@/lib/validation';
import { z } from 'zod';

// Rate limiting configuration
const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5, // Max attempts per window
  LOGIN_WINDOW: 15 * 60 * 1000, // 15 minutes
  DEMO_REQUESTS: 10, // Max demo requests per window
  DEMO_WINDOW: 60 * 60 * 1000, // 1 hour
};

// In-memory rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class SecurityService {
  // Rate limiting functionality
  static checkRateLimit(
    identifier: string, 
    maxAttempts: number, 
    windowMs: number
  ): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const key = `${identifier}_${Math.floor(now / windowMs)}`;
    
    const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (current.count >= maxAttempts) {
      return { allowed: false, resetTime: current.resetTime };
    }
    
    current.count++;
    rateLimitStore.set(key, current);
    
    return { allowed: true };
  }

  // Log security events
  static async logSecurityEvent(eventData: z.infer<typeof securityEventSchema>) {
    try {
      const validatedData = securityEventSchema.parse(eventData);
      
      await supabase.functions.invoke('log-security-event', {
        body: validatedData
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Check login rate limit
  static checkLoginRateLimit(email: string, ipAddress?: string): { allowed: boolean; resetTime?: number } {
    const emailKey = `login_email_${email}`;
    const ipKey = `login_ip_${ipAddress || 'unknown'}`;
    
    const emailCheck = this.checkRateLimit(emailKey, RATE_LIMITS.LOGIN_ATTEMPTS, RATE_LIMITS.LOGIN_WINDOW);
    const ipCheck = this.checkRateLimit(ipKey, RATE_LIMITS.LOGIN_ATTEMPTS * 3, RATE_LIMITS.LOGIN_WINDOW);
    
    return {
      allowed: emailCheck.allowed && ipCheck.allowed,
      resetTime: Math.max(emailCheck.resetTime || 0, ipCheck.resetTime || 0)
    };
  }

  // Check demo access rate limit
  static checkDemoRateLimit(ipAddress: string): { allowed: boolean; resetTime?: number } {
    const key = `demo_${ipAddress}`;
    return this.checkRateLimit(key, RATE_LIMITS.DEMO_REQUESTS, RATE_LIMITS.DEMO_WINDOW);
  }

  // Validate login attempt and log it
  static async logLoginAttempt(
    attemptData: z.infer<typeof loginAttemptSchema>,
    success: boolean
  ) {
    try {
      const validatedData = loginAttemptSchema.parse(attemptData);
      
      // Check rate limit
      const rateCheck = this.checkLoginRateLimit(validatedData.email, validatedData.ip_address);
      
      if (!rateCheck.allowed) {
        await this.logSecurityEvent({
          event_type: 'suspicious_activity',
          details: `Rate limit exceeded for email: ${validatedData.email}`,
          ip_address: validatedData.ip_address,
          user_agent: validatedData.user_agent
        });
        
        throw new Error(`Too many login attempts. Try again after ${new Date(rateCheck.resetTime!).toLocaleTimeString()}`);
      }

      // Log the attempt
      await this.logSecurityEvent({
        event_type: success ? 'login_success' : 'login_failure',
        details: `Login attempt for ${validatedData.email}`,
        ip_address: validatedData.ip_address,
        user_agent: validatedData.user_agent
      });

      return { success: true };
    } catch (error) {
      console.error('Login attempt validation failed:', error);
      throw error;
    }
  }

  // Detect suspicious patterns
  static async detectSuspiciousActivity(userId: string, activity: string) {
    const suspiciousPatterns = [
      'rapid_password_changes',
      'multiple_failed_logins',
      'unusual_access_times',
      'role_escalation_attempts'
    ];

    if (suspiciousPatterns.some(pattern => activity.includes(pattern))) {
      await this.logSecurityEvent({
        event_type: 'suspicious_activity',
        user_id: userId,
        details: activity
      });
    }
  }

  // Enhanced demo session security
  static generateSecureDemoToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Validate demo session token
  static validateDemoToken(token: string): boolean {
    // Check token format and strength
    return /^[a-f0-9]{64}$/.test(token);
  }

  // Log demo session activity
  static async logDemoActivity(action: string, sessionId?: string, ipAddress?: string) {
    await this.logSecurityEvent({
      event_type: 'demo_access',
      details: `Demo ${action} - Session: ${sessionId || 'unknown'}`,
      ip_address: ipAddress
    });
  }

  // Cleanup expired demo sessions
  static async cleanupExpiredDemoSessions() {
    try {
      await supabase.functions.invoke('cleanup-demo-sessions');
      
      await this.logSecurityEvent({
        event_type: 'demo_session_cleanup',
        details: 'Automated cleanup of expired demo sessions'
      });
    } catch (error) {
      console.error('Failed to cleanup demo sessions:', error);
    }
  }

  // Get client IP address
  static getClientIP(): string {
    // This is a simplified version - in production you'd want to handle proxies
    return 'client-ip-unavailable';
  }

  // Get user agent
  static getUserAgent(): string {
    return navigator.userAgent || 'unknown';
  }
}

// Auto-cleanup expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);