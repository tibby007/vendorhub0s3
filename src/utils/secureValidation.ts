import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: string[];
}

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  key: string;
}

class SecureValidator {
  private static instance: SecureValidator;
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  private constructor() {}

  static getInstance(): SecureValidator {
    if (!SecureValidator.instance) {
      SecureValidator.instance = new SecureValidator();
    }
    return SecureValidator.instance;
  }

  sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return DOMPurify.sanitize(input.trim(), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      FORBID_CONTENTS: ['script', 'style'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
    });
  }

  sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  checkRateLimit(config: RateLimitConfig): boolean {
    const now = Date.now();
    const record = this.rateLimitStore.get(config.key);
    
    if (!record || now > record.resetTime) {
      this.rateLimitStore.set(config.key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }
    
    if (record.count >= config.maxAttempts) {
      return false;
    }
    
    record.count++;
    return true;
  }

  validateEmail(email: string): ValidationResult {
    if (!email || typeof email !== 'string') {
      return { success: false, errors: ['Email is required'] };
    }
    
    const sanitizedEmail = this.sanitizeString(email);
    
    if (sanitizedEmail !== email.trim()) {
      return { success: false, errors: ['Email contains invalid characters'] };
    }
    
    const emailSchema = z.string()
      .email('Invalid email format')
      .max(254, 'Email too long')
      .refine((email) => {
        const domain = email.split('@')[1];
        return domain && domain.length <= 253;
      }, 'Invalid email domain');
    
    try {
      const validatedEmail = emailSchema.parse(sanitizedEmail);
      return { success: true, data: validatedEmail };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          errors: error.errors.map(e => e.message) 
        };
      }
      return { success: false, errors: ['Email validation failed'] };
    }
  }

  validatePassword(password: string): ValidationResult {
    if (!password || typeof password !== 'string') {
      return { success: false, errors: ['Password is required'] };
    }
    
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain numbers');
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain special characters (@$!%*?&)');
    }
    
    const commonPasswords = [
      'password', '123456789', 'qwerty', 'abc123', 
      'password123', 'admin', 'letmein', 'welcome'
    ];
    
    if (commonPasswords.some(common => 
      password.toLowerCase().includes(common.toLowerCase()))) {
      errors.push('Password contains common patterns');
    }
    
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    return { success: true, data: password };
  }

  validatePhone(phone: string): ValidationResult {
    if (!phone || typeof phone !== 'string') {
      return { success: false, errors: ['Phone number is required'] };
    }
    
    const sanitizedPhone = this.sanitizeString(phone);
    
    const phoneSchema = z.string()
      .regex(/^\+?[\d\s\-\(\)]{10,15}$/, 'Invalid phone format')
      .transform(phone => phone.replace(/[\s\-\(\)]/g, ''));
    
    try {
      const validatedPhone = phoneSchema.parse(sanitizedPhone);
      return { success: true, data: validatedPhone };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          errors: error.errors.map(e => e.message) 
        };
      }
      return { success: false, errors: ['Phone validation failed'] };
    }
  }

  validateText(text: string, options: {
    minLength?: number;
    maxLength?: number;
    allowEmpty?: boolean;
    fieldName?: string;
  } = {}): ValidationResult {
    const { 
      minLength = 0, 
      maxLength = 1000, 
      allowEmpty = false, 
      fieldName = 'Text' 
    } = options;
    
    if (!allowEmpty && (!text || typeof text !== 'string' || text.trim().length === 0)) {
      return { success: false, errors: [`${fieldName} is required`] };
    }
    
    if (allowEmpty && (!text || typeof text !== 'string')) {
      return { success: true, data: '' };
    }
    
    const sanitizedText = this.sanitizeString(text);
    
    if (sanitizedText.length < minLength) {
      return { 
        success: false, 
        errors: [`${fieldName} must be at least ${minLength} characters`] 
      };
    }
    
    if (sanitizedText.length > maxLength) {
      return { 
        success: false, 
        errors: [`${fieldName} must be less than ${maxLength} characters`] 
      };
    }
    
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:\s*text\/html/gi,
      /vbscript:/gi
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(text)) {
        return { 
          success: false, 
          errors: [`${fieldName} contains potentially unsafe content`] 
        };
      }
    }
    
    return { success: true, data: sanitizedText };
  }

  validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): ValidationResult {
    const { 
      maxSize = 10 * 1024 * 1024, // 10MB
      allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'],
      allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png']
    } = options;
    
    if (!file || !(file instanceof File)) {
      return { success: false, errors: ['Valid file is required'] };
    }
    
    if (file.size > maxSize) {
      return { 
        success: false, 
        errors: [`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`] 
      };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { 
        success: false, 
        errors: [`File type ${file.type} is not allowed`] 
      };
    }
    
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return { 
        success: false, 
        errors: [`File extension ${extension} is not allowed`] 
      };
    }
    
    const suspiciousFilenames = [
      /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, 
      /\.com$/i, /\.pif$/i, /\.vbs$/i, /\.js$/i, 
      /\.jar$/i, /\.php$/i, /\.asp$/i, /\.jsp$/i
    ];
    
    for (const pattern of suspiciousFilenames) {
      if (pattern.test(file.name)) {
        return { 
          success: false, 
          errors: ['File type not allowed for security reasons'] 
        };
      }
    }
    
    return { success: true, data: file };
  }

  validateCSRFToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) return false;
    if (typeof token !== 'string' || typeof expectedToken !== 'string') return false;
    
    return token.length === expectedToken.length && 
           token === expectedToken;
  }
}

export const secureValidator = SecureValidator.getInstance();

export const createSecureFormValidator = <T>(schema: z.ZodSchema<T>) => {
  return (data: any): ValidationResult => {
    try {
      const sanitizedData = secureValidator.sanitizeObject(data);
      const validatedData = schema.parse(sanitizedData);
      
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        };
      }
      return { success: false, errors: ['Validation failed'] };
    }
  };
};