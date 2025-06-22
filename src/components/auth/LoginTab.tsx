
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DemoAnalytics, DEMO_EVENTS } from '@/utils/demoAnalytics';

interface LoginTabProps {
  isDemoSession?: boolean;
}

const LoginTab = ({ isDemoSession }: LoginTabProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
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

  const handleSendMagicLink = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    setIsSendingMagicLink(true);

    try {
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/auth`
        : 'https://vendorhubos.com/auth';

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('Magic link error:', error);
        toast.error('Failed to send magic link', {
          description: error.message
        });
        return;
      }

      toast.success('Magic Link Sent!', {
        description: 'Check your email for a magic link to sign in.'
      });

    } catch (error: any) {
      console.error('Magic link error:', error);
      toast.error('Failed to send magic link', {
        description: 'Please try again later.'
      });
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    setIsSendingPasswordReset(true);

    try {
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/auth`
        : 'https://vendorhubos.com/auth';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('Password reset error:', error);
        toast.error('Failed to send password reset email', {
          description: error.message
        });
        return;
      }

      toast.success('Password Reset Email Sent!', {
        description: 'Check your email for instructions to reset your password.'
      });

    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error('Failed to send password reset email', {
        description: 'Please try again later.'
      });
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  // Check if we're in demo mode from URL or session storage
  const isInDemoMode = isDemoSession || 
                       new URLSearchParams(location.search).get('demo') === 'true' ||
                       sessionStorage.getItem('demoSessionActive') === 'true';

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">
          {isInDemoMode ? 'Demo Login' : 'Sign in to your account'}
        </CardTitle>
        <CardDescription>
          {isInDemoMode 
            ? 'Use the demo credentials provided to access your demo session'
            : 'Enter your email and password to sign in'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isInDemoMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Access</h4>
            <p className="text-xs text-blue-700">
              {email && password ? 
                'Demo credentials have been automatically filled in. Click "Access Demo" to continue.' :
                'Use the demo credentials from your registration email or the credentials modal to login.'
              }
              Demo sessions are limited to 30 minutes.
            </p>
            {email && password && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                <strong>Ready to go!</strong> Your demo credentials are loaded and ready to use.
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder={isInDemoMode ? "demo-partner@vendorhub.com" : "your@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || isSendingMagicLink || isSendingPasswordReset}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || isSendingMagicLink || isSendingPasswordReset}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !email || !password || isSendingMagicLink || isSendingPasswordReset}
          >
            {isLoading ? 'Signing in...' : (isInDemoMode ? 'Access Demo' : 'Sign in')}
          </Button>
        </form>

        {!isInDemoMode && (
          <>
            <div className="space-y-2">
              <Button 
                type="button"
                variant="outline" 
                className="w-full" 
                disabled={!email || isSendingMagicLink || isLoading || isSendingPasswordReset}
                onClick={handleSendMagicLink}
              >
                {isSendingMagicLink ? 'Sending Magic Link...' : 'Send Magic Link'}
              </Button>
              
              <Button 
                type="button"
                variant="ghost" 
                className="w-full text-sm" 
                disabled={!email || isSendingPasswordReset || isLoading || isSendingMagicLink}
                onClick={handleForgotPassword}
              >
                {isSendingPasswordReset ? 'Sending Reset Email...' : 'Forgot Password?'}
              </Button>
            </div>

            <Separator />
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/auth" className="text-vendor-green-600 hover:text-vendor-green-700 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Want to try a demo?{' '}
                <Link to="/demo-credentials" className="text-vendor-green-600 hover:text-vendor-green-700 font-medium">
                  Get Demo Access
                </Link>
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LoginTab;
