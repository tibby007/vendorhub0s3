import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Play, User, Building2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockDataService } from '@/services/mockDataService';
import { secureSessionManager } from '@/utils/secureSessionManager';
import { secureLogger } from '@/utils/secureLogger';

interface DemoCredentials {
  email: string;
  password: string;
  role: 'Partner Admin' | 'Vendor';
  name: string;
  description: string;
}

const demoAccounts: DemoCredentials[] = [
  {
    email: 'demo-partner@vendorhub.com',
    password: 'DemoPass123!',
    role: 'Partner Admin',
    name: 'Sarah Johnson',
    description: 'Full access to partner dashboard, vendor management, and analytics'
  },
  {
    email: 'demo-vendor@vendorhub.com',
    password: 'DemoPass123!',
    role: 'Vendor',
    name: 'Mike Chen',
    description: 'Vendor portal access with submission management and document upload'
  }
];

const DemoLogin: React.FC = () => {
  const [selectedAccount, setSelectedAccount] = useState<DemoCredentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleQuickLogin = async (account: DemoCredentials) => {
    setIsLoading(true);
    try {
      secureLogger.info('Demo login initiated', {
        component: 'DemoLogin',
        action: 'quick_login',
        role: account.role
      });

      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Store demo credentials in the format expected by AuthContext
      const demoCredentials = {
        email: account.email,
        name: account.name,
        role: account.role,
        isDemoMode: true
      };

      // Store in sessionStorage as expected by AuthContext
      sessionStorage.setItem('demoCredentials', JSON.stringify(demoCredentials));
      
      // Also store in the new format for useDemoMode compatibility
      await secureSessionManager.setSecureItem('isDemoMode', true);
      await secureSessionManager.setSecureItem('demoRole', account.role);
      
      secureLogger.auditLog('demo_login_success', {
        component: 'DemoLogin',
        action: 'demo_authentication',
        email: account.email,
        role: account.role
      });

      // Trigger demo mode changed event to notify AuthContext
      window.dispatchEvent(new Event('demo-mode-changed'));

      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      secureLogger.error('Demo login failed', {
        component: 'DemoLogin',
        action: 'demo_login_error'
      });
      console.error('Demo login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = async () => {
    if (!selectedAccount) return;

    setIsLoading(true);
    try {
      // Simulate form-based login
      await handleQuickLogin(selectedAccount);
    } catch (error) {
      console.error('Manual login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">
      {/* Header Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">VendorHub</h1>
              <Badge variant="secondary" className="ml-3">
                Demo Mode
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/landing')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <h1 className="text-4xl font-bold text-green-600">VendorHub</h1>
            <Badge variant="secondary" className="ml-3">
              Demo Mode
            </Badge>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience VendorHub with realistic sample data. Choose from different user roles to explore the platform's features.
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {demoAccounts.map((account) => (
            <Card key={account.email} className="hover:shadow-lg transition-shadow border-2 hover:border-green-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {account.role === 'Partner Admin' ? (
                      <Building2 className="h-8 w-8 text-green-600" />
                    ) : (
                      <User className="h-8 w-8 text-blue-600" />
                    )}
                    <div>
                      <CardTitle className="text-xl">{account.name}</CardTitle>
                      <Badge variant={account.role === 'Partner Admin' ? 'default' : 'secondary'}>
                        {account.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 text-base">
                  {account.description}
                </CardDescription>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Email:</span>
                    <span className="text-sm text-gray-600">{account.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Password:</span>
                    <span className="text-sm text-gray-600 font-mono">{account.password}</span>
                  </div>
                </div>

                <Button 
                  onClick={() => handleQuickLogin(account)}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isLoading ? 'Logging in...' : `Try as ${account.role}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Manual Login Form */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Manual Login</CardTitle>
            <CardDescription>
              Or enter credentials manually to experience the full login flow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter demo email"
                value={selectedAccount?.email || ''}
                onChange={(e) => {
                  const account = demoAccounts.find(acc => acc.email === e.target.value);
                  setSelectedAccount(account || null);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter demo password"
                  value={selectedAccount?.password || ''}
                  onChange={(e) => {
                    if (selectedAccount) {
                      setSelectedAccount({ ...selectedAccount, password: e.target.value });
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleManualLogin}
              disabled={!selectedAccount || isLoading}
              className="w-full"
            >
              {isLoading ? 'Logging in...' : 'Login to Demo'}
            </Button>

            {/* Demo Data Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Demo Includes:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 5 sample vendors with realistic data</li>
                <li>• 15+ submissions across different stages</li>
                <li>• Transaction history and analytics</li>
                <li>• Document management examples</li>
                <li>• Customer relationship data</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Info */}
        <div className="text-center mt-12 text-gray-500">
          <p>
            Demo mode uses sample data and simulated API responses.{' '}
            <button 
              onClick={() => navigate('/landing')}
              className="text-green-600 hover:underline cursor-pointer"
            >
              Return to home page
            </button>
            {' or '}
            <button 
              onClick={() => navigate('/auth')}
              className="text-green-600 hover:underline cursor-pointer"
            >
              real login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoLogin;