
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DemoAnalytics, DEMO_EVENTS } from '@/utils/demoAnalytics';

interface LoginTabProps {
  isDemoSession: boolean;
}

const LoginTab: React.FC<LoginTabProps> = ({ isDemoSession }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isDemoSession) {
        DemoAnalytics.trackEvent(DEMO_EVENTS.LOGIN_ATTEMPT, { 
          email: loginData.email,
          isDemoCredentials: loginData.email.includes('demo-')
        });
      }

      await login(loginData.email, loginData.password);
      
      if (isDemoSession) {
        DemoAnalytics.trackEvent(DEMO_EVENTS.LOGIN_SUCCESS, { 
          email: loginData.email 
        });
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isDemoSession ? 'Demo Login' : 'Welcome Back'}
        </CardTitle>
        <CardDescription>
          {isDemoSession 
            ? 'Use your demo credentials to access the platform'
            : 'Sign in to your account to continue'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={loginData.email}
              onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={loginData.password}
              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LoginTab;
