
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Link, useLocation } from 'react-router-dom';
import { useLoginForm } from '@/hooks/useLoginForm';
import DemoInfoPanel from './DemoInfoPanel';
import PasswordActions from './PasswordActions';

interface LoginTabProps {
  isDemoSession?: boolean;
}

const LoginTab = ({ isDemoSession }: LoginTabProps) => {
  const location = useLocation();
  const {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    handleLogin,
    demoCredentials
  } = useLoginForm(isDemoSession);

  // Check if we're in demo mode from URL or session storage
  const isInDemoMode = isDemoSession || 
                       new URLSearchParams(location.search).get('demo') === 'true' ||
                       sessionStorage.getItem('demoSessionActive') === 'true' ||
                       !!demoCredentials;

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
          <DemoInfoPanel 
            email={email} 
            password={password} 
            role={demoCredentials?.role}
          />
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
            disabled={isLoading || !email || !password}
          >
            {isLoading ? 'Signing in...' : (isInDemoMode ? 'Access Demo' : 'Sign in')}
          </Button>
        </form>

        {!isInDemoMode && (
          <>
            <PasswordActions email={email} isLoading={isLoading} />

            <Separator />
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/auth" className="text-vendor-green-600 hover:text-vendor-green-700 font-medium">
                  Sign up
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
