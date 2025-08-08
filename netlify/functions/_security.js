// ===================================================================
// VendorHub OS - Security Utility Module for Netlify Functions
// Provides input validation, CORS handling, and security middleware
// ===================================================================

const crypto = require('crypto');

// Allowed origins configuration
const getAllowedOrigin = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 'http://localhost:5173' : 'https://app.vendorhub-os.com';
};

// Security headers configuration
const getSecurityHeaders = (additionalHeaders = {}) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(),
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  ...additionalHeaders
});

// CORS preflight response
const handleCORS = (allowedMethods = ['POST']) => ({
  statusCode: 200,
  headers: {
    ...getSecurityHeaders(),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': [...allowedMethods, 'OPTIONS'].join(', '),
    'Access-Control-Max-Age': '86400'
  },
  body: ''
});

// Method validation
const validateMethod = (event, allowedMethod = 'POST') => {
  if (event.httpMethod !== allowedMethod) {
    return {
      statusCode: 405,
      headers: getSecurityHeaders(),
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }
  return null;
};

// Input validation schemas
const validationSchemas = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255,
    required: true
  },
  password: {
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    minLength: 8,
    maxLength: 128,
    required: true,
    errorMessage: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
  },
  name: {
    pattern: /^[a-zA-Z\s'-]{1,50}$/,
    maxLength: 50,
    required: true,
    trim: true
  },
  phone: {
    pattern: /^[+]?[\d\s\-\(\)]{10,15}$/,
    maxLength: 20,
    required: false,
    trim: true
  },
  organizationName: {
    pattern: /^[a-zA-Z0-9\s&.,-]{1,100}$/,
    maxLength: 100,
    required: true,
    trim: true
  },
  uuid: {
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    required: true
  },
  subscriptionTier: {
    enum: ['solo', 'pro', 'enterprise'],
    required: false
  },
  userRole: {
    enum: ['broker', 'loan_officer', 'vendor'],
    required: true
  }
};

// Validate single field
const validateField = (value, fieldName, schema) => {
  if (!schema) {
    return { valid: false, error: `Unknown field: ${fieldName}` };
  }

  // Handle required fields
  if (schema.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${fieldName} is required` };
  }

  // Skip validation for optional empty fields
  if (!schema.required && (value === undefined || value === null || value === '')) {
    return { valid: true, value: null };
  }

  // Trim string values if specified
  if (schema.trim && typeof value === 'string') {
    value = value.trim();
  }

  // Length validation
  if (schema.minLength && value.length < schema.minLength) {
    return { valid: false, error: `${fieldName} must be at least ${schema.minLength} characters` };
  }

  if (schema.maxLength && value.length > schema.maxLength) {
    return { valid: false, error: `${fieldName} must be no more than ${schema.maxLength} characters` };
  }

  // Pattern validation
  if (schema.pattern && !schema.pattern.test(value)) {
    return { 
      valid: false, 
      error: schema.errorMessage || `${fieldName} has invalid format` 
    };
  }

  // Enum validation
  if (schema.enum && !schema.enum.includes(value)) {
    return { valid: false, error: `${fieldName} must be one of: ${schema.enum.join(', ')}` };
  }

  return { valid: true, value };
};

// Validate request body
const validateInput = (data, requiredFields) => {
  const errors = [];
  const sanitizedData = {};

  for (const [fieldName, schemaName] of Object.entries(requiredFields)) {
    const schema = validationSchemas[schemaName];
    const result = validateField(data[fieldName], fieldName, schema);
    
    if (!result.valid) {
      errors.push(result.error);
    } else {
      sanitizedData[fieldName] = result.value;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: sanitizedData
  };
};

// Rate limiting (simple in-memory implementation)
const rateLimitStore = new Map();

const checkRateLimit = (identifier, maxAttempts = 5, windowMinutes = 15) => {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  const key = `${identifier}:${Math.floor(now / windowMs)}`;
  
  const attempts = rateLimitStore.get(key) || 0;
  
  if (attempts >= maxAttempts) {
    return {
      allowed: false,
      retryAfter: Math.ceil((windowMs - (now % windowMs)) / 1000)
    };
  }
  
  rateLimitStore.set(key, attempts + 1);
  
  // Cleanup old entries
  if (Math.random() < 0.1) { // 10% chance to cleanup
    for (const [k] of rateLimitStore.entries()) {
      const keyTime = parseInt(k.split(':')[1]) * windowMs;
      if (now - keyTime > windowMs * 2) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  return { allowed: true };
};

// Generate secure token
const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('base64url');
};

// Hash token for storage
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Error response helper
const errorResponse = (statusCode, message, additionalData = {}) => ({
  statusCode,
  headers: getSecurityHeaders(),
  body: JSON.stringify({
    error: message,
    timestamp: new Date().toISOString(),
    ...additionalData
  })
});

// Success response helper
const successResponse = (data, statusCode = 200) => ({
  statusCode,
  headers: getSecurityHeaders(),
  body: JSON.stringify({
    success: true,
    data,
    timestamp: new Date().toISOString()
  })
});

// Security middleware wrapper
const withSecurity = (handler, options = {}) => {
  const {
    method = 'POST',
    rateLimit = { maxAttempts: 5, windowMinutes: 15 },
    validation = null
  } = options;

  return async (event, context) => {
    try {
      // Handle CORS preflight
      if (event.httpMethod === 'OPTIONS') {
        return handleCORS(Array.isArray(method) ? method : [method]);
      }

      // Validate HTTP method
      const methodError = validateMethod(event, method);
      if (methodError) return methodError;

      // Rate limiting
      if (rateLimit) {
        const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
        const rateLimitResult = checkRateLimit(
          clientIP, 
          rateLimit.maxAttempts, 
          rateLimit.windowMinutes
        );
        
        if (!rateLimitResult.allowed) {
          return errorResponse(429, 'Too Many Requests', {
            retryAfter: rateLimitResult.retryAfter
          });
        }
      }

      // Parse and validate input
      let requestData = {};
      if (event.body) {
        try {
          requestData = JSON.parse(event.body);
        } catch (parseError) {
          return errorResponse(400, 'Invalid JSON in request body');
        }
      }

      // Input validation
      if (validation) {
        const validationResult = validateInput(requestData, validation);
        if (!validationResult.valid) {
          return errorResponse(400, 'Validation failed', {
            errors: validationResult.errors
          });
        }
        requestData = validationResult.data;
      }

      // Call the actual handler with sanitized data
      return await handler(event, context, requestData);

    } catch (error) {
      console.error('Security middleware error:', error);
      return errorResponse(500, 'Internal server error');
    }
  };
};

module.exports = {
  getSecurityHeaders,
  handleCORS,
  validateMethod,
  validateInput,
  validationSchemas,
  checkRateLimit,
  generateSecureToken,
  hashToken,
  errorResponse,
  successResponse,
  withSecurity
};