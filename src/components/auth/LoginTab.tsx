
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Attempting login for:', email);
      
      // Track demo login attempt if it's a demo session
      if (isDemoSession || email.includes('demo-')) {
        DemoAnalytics.trackEvent(DEMO_EVENTS.LOGIN_ATTEMPT, {
          email,
          isDemoUser: true
        });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        
        // Provide more specific error messages, especially for demo users
        let errorMessage = 'Login failed. Please check your credentials.';
        
        if (error.message.includes('Invalid login credentials')) {
          if (email.includes('demo-')) {
            errorMessage = 'Demo credentials not found or expired. This could happen if:\n' +
                         '• The demo registration failed to create your account\n' +
                         '• The demo session has expired\n' +
                         '• Please try registering for a new demo session';
          } else {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          }
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before logging in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
        }

        toast.error('Login Failed', {
          description: errorMessage,
          duration: 8000, // Longer duration for demo error messages
        });

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
        
        return;
      }

      console.log('Login successful:', data.user?.email);

      // Check if this is a demo user and handle accordingly
      const isDemoUser = email.includes('demo-') || data.user?.user_metadata?.demo_session_id;
      
      if (isDemoUser) {
        console.log('Demo user logged in successfully');
        
        // Track successful demo login
        DemoAnalytics.trackEvent(DEMO_EVENTS.LOGIN_SUCCESS, {
          email,
          sessionId: data.user?.user_metadata?.demo_session_id,
          role: data.user?.user_metadata?.role
        });

        // Check if demo session is still valid
        const demoExpiresAt = data.user?.user_metadata?.demo_expires_at;
        if (demoExpiresAt && new Date(demoExpiresAt) < new Date()) {
          toast.error('Demo Session Expired', {
            description: 'Your demo session has expired. Please register for a new demo.',
          });
          
          // Sign out expired demo user
          await supabase.auth.signOut();
          navigate('/demo-credentials');
          return;
        }

        toast.success('Demo Login Successful!', {
          description: `Welcome to your VendorHub demo experience as ${data.user?.user_metadata?.role}.`,
        });
      } else {
        toast.success('Login Successful!', {
          description: 'Welcome back to VendorHub.',
        });
      }

      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      toast.error('Login Failed', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">
          {isDemoSession ? 'Demo Login' : 'Sign in to your account'}
        </CardTitle>
        <CardDescription>
          {isDemoSession 
            ? 'Use the demo credentials provided to access your demo session'
            : 'Enter your email and password to sign in'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isDemoSession && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Access</h4>
            <p className="text-xs text-blue-700">
              Use the demo credentials from your registration email or the credentials modal to login.
              Demo sessions are limited to 30 minutes.
            </p>
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <strong>Troubleshooting:</strong> If login fails, the demo account creation may have failed. 
              Try registering for a new demo session.
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder={isDemoSession ? "demo-partner@vendorhub.com" : "your@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : (isDemoSession ? 'Access Demo' : 'Sign in')}
          </Button>
        </form>

        {!isDemoSession && (
          <>
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
