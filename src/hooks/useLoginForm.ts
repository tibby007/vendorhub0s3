
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
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Check for demo mode and auto-populate credentials
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isDemoMode = urlParams.get('demo') === 'true';
    
    if (isDemoMode) {
      const storedCredentials = sessionStorage.getItem('demoCredentials');
      if (storedCredentials) {
        try {
          const credentials = JSON.parse(storedCredentials);
          setEmail(credentials.email);
          setPassword(credentials.password);
          
          toast.info('Demo Credentials Loaded', {
            description: 'Your demo credentials have been automatically filled in.',
          });
        } catch (error) {
          console.error('Error parsing stored demo credentials:', error);
        }
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

        toast.success('Demo Login Successful!', {
          description: `Welcome to your VendorHub demo experience.`,
        });
      } else {
        toast.success('Login Successful!', {
          description: 'Welcome back to VendorHub.',
        });
      }
      
      // Navigate to dashboard
      navigate('/dashboard');
      
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
    handleLogin
  };
};
