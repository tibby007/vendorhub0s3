# Security Documentation

## Demo Mode Security Implementation

### Overview
The demo mode system has been completely redesigned to implement secure session validation instead of simple sessionStorage checks. This prevents unauthorized access and provides proper session management.

### Security Features

#### 1. Secure Session Tokens
- **Generation**: Uses cryptographically secure random tokens (64-character hex strings)
- **Validation**: Server-side validation through Supabase Edge Functions
- **Storage**: Encrypted storage using SecureStorage utility
- **Expiration**: Automatic session expiration after 10 minutes

#### 2. Rate Limiting
- **Demo Activation**: 3 attempts per 5 minutes per role
- **Session Validation**: 10 attempts per minute per session
- **IP-based**: Additional IP-based rate limiting for demo requests

#### 3. Session Management
- **Auto-refresh**: Sessions refresh every 30 seconds
- **Activity tracking**: Last activity timestamps
- **Auto-cleanup**: Expired sessions automatically cleared
- **Legacy cleanup**: Old demo mode data automatically removed

#### 4. Security Logging
- **Event tracking**: All demo activities logged to security audit
- **IP tracking**: Client IP addresses recorded
- **Suspicious activity**: Unusual patterns flagged and logged

### Implementation Details

#### Secure Demo Session Structure
```typescript
interface DemoSession {
  sessionId: string;        // timestamp_randomstring format
  role: 'Partner Admin' | 'Vendor';
  startTime: number;        // Unix timestamp
  lastActivity: number;     // Unix timestamp
  token: string;           // 64-character secure token
}
```

#### Session Validation Flow
1. **Client**: Generates secure session with timestamp and random token
2. **Server**: Validates session format and timestamp
3. **Database**: Logs validation attempt and checks for suspicious activity
4. **Response**: Returns validation status and time remaining

#### Rate Limiting Implementation
```typescript
// Demo activation rate limiting
const rateLimitKey = `demo_activation_${role}`;
if (!RateLimiter.checkRateLimit(rateLimitKey, 3, 300000)) {
  // Block activation
}

// Session validation rate limiting
const rateLimitKey = `demo_validation_${sessionId}`;
if (!RateLimiter.checkRateLimit(rateLimitKey, 10, 60000)) {
  // Block validation
}
```

### Security Benefits

#### Before (Vulnerable)
- ❌ Simple sessionStorage checks
- ❌ No server validation
- ❌ No rate limiting
- ❌ No session expiration
- ❌ No security logging
- ❌ Easy to bypass authentication

#### After (Secure)
- ✅ Cryptographically secure tokens
- ✅ Server-side validation
- ✅ Comprehensive rate limiting
- ✅ Automatic session expiration
- ✅ Full security audit logging
- ✅ Proper authentication bypass prevention

### Usage

#### Starting Demo Mode
```typescript
const { startDemoMode, isValidating } = useDemoMode();

const handleStartDemo = async (role: 'Partner Admin' | 'Vendor') => {
  const success = await startDemoMode(role);
  if (success) {
    // Demo started successfully
  } else {
    // Handle failure (rate limited, validation failed, etc.)
  }
};
```

#### Demo Session Timer
```typescript
const { isDemo, timeRemaining, exitDemoMode } = useDemoMode();

// Auto-display timer component
<DemoSessionTimer />
```

#### Exiting Demo Mode
```typescript
const { exitDemoMode } = useDemoMode();

// Clear all demo data and return to normal mode
exitDemoMode();
```

### Environment Variables

Required environment variables for demo mode security:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Environment
NODE_ENV=development
```

### Security Monitoring

#### Logged Events
- `demo_session_started`: When a demo session is initiated
- `demo_session_validation`: Each session validation attempt
- `demo_session_cleanup`: Automatic cleanup of expired sessions
- `suspicious_activity`: Unusual demo access patterns

#### Monitoring Dashboard
Access security logs through Supabase dashboard:
1. Navigate to your Supabase project
2. Go to Database > Tables > security_audit_log
3. Filter by event_type to view demo-related events

### Best Practices

#### For Developers
1. **Always use the hook**: Use `useDemoMode()` hook instead of direct sessionStorage access
2. **Handle failures**: Always handle demo mode start failures gracefully
3. **Show loading states**: Display loading indicators during demo operations
4. **Validate sessions**: Check session validity before performing sensitive operations

#### For Production
1. **Monitor logs**: Regularly review security audit logs
2. **Adjust limits**: Tune rate limiting based on usage patterns
3. **Update tokens**: Rotate demo session tokens periodically
4. **Backup validation**: Implement additional validation layers if needed

### Troubleshooting

#### Common Issues

**Demo mode fails to start**
- Check rate limiting (wait 5 minutes between attempts)
- Verify Supabase function is deployed
- Check network connectivity

**Session expires quickly**
- Sessions expire after 10 minutes
- Use refresh functionality to extend sessions
- Check for timezone issues

**Validation errors**
- Check Supabase function logs
- Verify environment variables
- Check for network issues

### Migration Guide

#### From Legacy Demo Mode
The new secure demo mode automatically:
1. Detects legacy demo mode data
2. Clears old sessionStorage values
3. Migrates to secure session management
4. Maintains backward compatibility during transition

#### Legacy Functions (Deprecated)
```typescript
// ❌ Don't use these anymore
import { startDemoMode, exitDemoMode } from '@/hooks/useDemoMode';

// ✅ Use the hook instead
const { startDemoMode, exitDemoMode } = useDemoMode();
```

### Security Compliance

This implementation addresses:
- **OWASP Top 10**: Session management, authentication bypass
- **GDPR**: Proper data handling and logging
- **SOC 2**: Audit trails and access controls
- **PCI DSS**: Secure session management (if applicable)

### Future Enhancements

Planned security improvements:
1. **Multi-factor authentication** for demo mode
2. **Geolocation restrictions** for demo access
3. **Advanced threat detection** using ML
4. **Real-time security alerts** for suspicious activity
5. **Session recording** for security analysis 