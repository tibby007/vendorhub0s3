
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DemoAnalytics, DEMO_EVENTS } from '@/utils/demoAnalytics';
import { SecurityService } from '@/services/securityService';

export const useLoginForm = (isDemoSession?: boolean) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoCredentials, setDemoCredentials] = useState<{ email: string; password: string; role: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Check for demo mode and auto-populate credentials
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isDemoMode = urlParams.get('demo') === 'true';
    
    // Always check for stored demo credentials, not just when URL param is present
    const storedCredentials = sessionStorage.getItem('demoCredentials');
    if (storedCredentials) {
      try {
        const credentials = JSON.parse(storedCredentials);
        if (credentials.isDemoMode) {
          setDemoCredentials(credentials);
          setEmail(credentials.email);
          setPassword(credentials.password);
          
          if (isDemoMode) {
            toast.info('Demo Credentials Loaded', {
              description: 'Your demo credentials have been automatically filled in.',
            });
          }
        }
      } catch (error) {
        console.error('Error parsing stored demo credentials:', error);
      }
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim();
    
    if (!normalizedEmail || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Starting login process for:', normalizedEmail);
      
      // Security: Check rate limits and log attempt
      const ipAddress = SecurityService.getClientIP();
      const userAgent = SecurityService.getUserAgent();
      
      console.log('🔒 Logging login attempt for:', normalizedEmail);
      
      try {
        await SecurityService.logLoginAttempt({
          email: normalizedEmail,
          ip_address: ipAddress,
          user_agent: userAgent
        }, false); // Will be updated to true on success
      } catch (securityError) {
        console.warn('Security logging failed, but continuing with login:', securityError);
        // Don't block login for security logging failures
      }
      
      // Track demo login attempt if it's a demo session
      if (isDemoSession || normalizedEmail.includes('demo-')) {
        DemoAnalytics.trackEvent(DEMO_EVENTS.LOGIN_ATTEMPT, {
          email: normalizedEmail,
          isDemoUser: true
        });
      }

      await login(normalizedEmail, password);
      
      // If we get here, login was successful
      console.log('Login completed successfully');
      
      // Log successful login
      try {
        await SecurityService.logLoginAttempt({
          email: normalizedEmail,
          ip_address: ipAddress,
          user_agent: userAgent
        }, true);
      } catch (securityError) {
        console.warn('Failed to log successful login, but continuing:', securityError);
        // Don't block user flow for security logging failures
      }
      
      // Check if this is a demo user
      const isDemoUser = normalizedEmail.includes('demo-');
      
      if (isDemoUser) {
        console.log('Demo user logged in successfully');
        
        // Track successful demo login
        DemoAnalytics.trackEvent(DEMO_EVENTS.LOGIN_SUCCESS, {
          email: normalizedEmail,
          isDemoUser: true
        });

        // Clear stored credentials after successful login
        sessionStorage.removeItem('demoCredentials');
        setDemoCredentials(null);

        toast.success('Demo Login Successful!', {
          description: `Welcome to your VendorHub demo experience.`,
        });
      } else {
        toast.success('Login Successful!', {
          description: 'Welcome back to VendorHub.',
        });
      }
      
      // Navigate to dashboard with more robust redirect
      console.log('🔄 Navigating to dashboard after successful login');
      
      // For demo users, add emergency redirect in case profile loading hangs
      if (isDemoUser) {
        console.log('⚡ Setting emergency redirect for demo user');
        // Immediate redirect
        setTimeout(() => navigate('/dashboard', { replace: true }), 100);
        // Emergency backup redirect
        setTimeout(() => {
          console.log('🚨 Emergency redirect triggered');
          window.location.href = '/dashboard';
        }, 3000);
      } else {
        setTimeout(() => navigate('/dashboard', { replace: true }), 100);
      }
      
    } catch (error: unknown) {
      console.error('Login failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';

      // Provide clear, user-friendly error messages
      let friendly = errorMessage;
      if (errorMessage.includes('Database error querying schema')) {
        friendly = 'We are experiencing a temporary database issue. This is not your fault. Please try again in a few minutes while we fix it.';
      } else if (errorMessage.includes('Invalid login credentials')) {
        friendly = 'Invalid email or password. Please check your credentials and try again.';
      } else if (errorMessage.toLowerCase().includes('too many')) {
        friendly = 'Too many login attempts. Please wait a few minutes before trying again.';
      }

      toast.error('Login failed', { description: friendly });
      
      // Track failed demo login
      if (isDemoSession || normalizedEmail.includes('demo-')) {
        DemoAnalytics.trackEvent(DEMO_EVENTS.REGISTRATION_FAILED, {
          error: errorMessage,
          email: normalizedEmail
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleLogin,
    demoCredentials
  };
};
