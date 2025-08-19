interface LogContext {
  userId?: string;
  action?: string;
  component?: string;
  timestamp?: number;
}

interface SanitizedError {
  message: string;
  code?: string;
  timestamp: number;
  context: LogContext;
}

class SecureLogger {
  private static instance: SecureLogger;
  private isDevelopment: boolean;
  private sensitivePatterns: RegExp[];

  private constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
    
    this.sensitivePatterns = [
      /password[s]?[=:]\s*['\"]?[^'\"\s]{6,}/gi,
      /token[s]?[=:]\s*['\"]?[a-zA-Z0-9-_]{20,}/gi,
      /api[_-]?key[s]?[=:]\s*['\"]?[a-zA-Z0-9-_]{20,}/gi,
      /secret[s]?[=:]\s*['\"]?[a-zA-Z0-9-_]{20,}/gi,
      /bearer\s+[a-zA-Z0-9-_\.]{20,}/gi,
      /authorization[=:]\s*['\"]?bearer\s+[a-zA-Z0-9-_\.]{20,}/gi,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
      /\b\d{3}-\d{2}-\d{4}\b/g,
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    ];
  }

  static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  private sanitizeMessage(message: string): string {
    let sanitized = message;
    
    for (const pattern of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, (match) => {
        if (match.includes('@')) return '[EMAIL_REDACTED]';
        if (match.includes('-') && match.length === 11) return '[SSN_REDACTED]';
        if (match.match(/\d{4}[\s-]/)) return '[CARD_REDACTED]';
        return '[CREDENTIAL_REDACTED]';
      });
    }
    
    return sanitized;
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeMessage(obj);
    }
    
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('password') || 
            lowerKey.includes('secret') || 
            lowerKey.includes('token') || 
            lowerKey.includes('key') ||
            lowerKey.includes('authorization')) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeObject(value);
        }
      }
      return sanitized;
    }
    
    return obj;
  }

  private createSanitizedError(
    error: Error | string, 
    context: LogContext = {}
  ): SanitizedError {
    const message = typeof error === 'string' ? error : error.message;
    const code = typeof error === 'object' && 'code' in error ? error.code : undefined;
    
    return {
      message: this.sanitizeMessage(message),
      code,
      timestamp: Date.now(),
      context: this.sanitizeObject(context)
    };
  }

  info(message: string, context: LogContext = {}): void {
    const sanitizedMessage = this.sanitizeMessage(message);
    const sanitizedContext = this.sanitizeObject(context);
    
    if (this.isDevelopment) {
      console.info(`[INFO] ${sanitizedMessage}`, sanitizedContext);
    }
  }

  warn(message: string, context: LogContext = {}): void {
    const sanitizedMessage = this.sanitizeMessage(message);
    const sanitizedContext = this.sanitizeObject(context);
    
    if (this.isDevelopment) {
      console.warn(`[WARN] ${sanitizedMessage}`, sanitizedContext);
    }
  }

  error(error: Error | string, context: LogContext = {}): void {
    const sanitizedError = this.createSanitizedError(error, context);
    
    if (this.isDevelopment) {
      console.error(`[ERROR] ${sanitizedError.message}`, {
        code: sanitizedError.code,
        context: sanitizedError.context,
        timestamp: new Date(sanitizedError.timestamp).toISOString()
      });
    }
    
    this.logToService(sanitizedError);
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      const sanitizedMessage = this.sanitizeMessage(message);
      const sanitizedData = data ? this.sanitizeObject(data) : undefined;
      console.debug(`[DEBUG] ${sanitizedMessage}`, sanitizedData);
    }
  }

  private async logToService(sanitizedError: SanitizedError): Promise<void> {
    try {
      if (!this.isDevelopment && typeof window !== 'undefined') {
        await fetch('/api/log-security-event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'error',
            details: sanitizedError.message,
            context: sanitizedError.context,
            timestamp: sanitizedError.timestamp
          })
        });
      }
    } catch (loggingError) {
      if (this.isDevelopment) {
        console.warn('Failed to log to service:', loggingError);
      }
    }
  }

  auditLog(action: string, context: LogContext = {}): void {
    const sanitizedContext = this.sanitizeObject({
      ...context,
      action,
      timestamp: Date.now()
    });
    
    if (this.isDevelopment) {
      console.log(`[AUDIT] ${action}`, sanitizedContext);
    }
    
    this.logToService({
      message: `Audit: ${action}`,
      timestamp: Date.now(),
      context: sanitizedContext
    });
  }
}

export const secureLogger = SecureLogger.getInstance();

export const createErrorBoundaryHandler = (component: string) => {
  return (error: Error, errorInfo: any) => {
    secureLogger.error(error, {
      component,
      action: 'component_error',
      errorBoundary: true,
      componentStack: errorInfo?.componentStack ? '[COMPONENT_STACK]' : undefined
    });
  };
};