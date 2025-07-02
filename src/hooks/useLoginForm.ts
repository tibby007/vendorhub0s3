
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DemoAnalytics, DEMO_EVENTS } from '@/utils/demoAnalytics';

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
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('Starting login process for:', email);
      
      // Track demo login attempt if it's a demo session
      if (isDemoSession || email.includes('demo-')) {
        DemoAnalytics.trackEvent(DEMO_EVENTS.LOGIN_ATTEMPT, {
          email,
          isDemoUser: true
        });
      }

      await login(email, password);
      
      // If we get here, login was successful
      console.log('Login completed successfully');
      
      // Check if this is a demo user
      const isDemoUser = email.includes('demo-');
      
      if (isDemoUser) {
        console.log('Demo user logged in successfully');
        
        // Track successful demo login
        DemoAnalytics.trackEvent(DEMO_EVENTS.LOGIN_SUCCESS, {
          email,
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
      
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Track failed demo login
      if (isDemoSession || email.includes('demo-')) {
        DemoAnalytics.trackEvent(DEMO_EVENTS.REGISTRATION_FAILED, {
          error: error.message,
          email
        });
        
        // For demo users, suggest getting new credentials
        if (email.includes('demo-')) {
          setTimeout(() => {
            toast.info('Need new demo credentials?', {
              description: 'Click here to register for a fresh demo session',
              action: {
                label: 'New Demo',
                onClick: () => navigate('/demo-credentials')
              },
              duration: 10000
            });
          }, 2000);
        }
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
