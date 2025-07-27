import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { User, Building2, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useDemoMode } from '@/hooks/useDemoMode';

const DemoSelector = () => {
  const navigate = useNavigate();
  const { startDemoMode, isValidating } = useDemoMode();
  const [isStarting, setIsStarting] = useState(false);

  const handleDemoSelect = async (role: 'Partner Admin' | 'Vendor') => {
    setIsStarting(true);
    
    try {
      console.log('🎭 Starting demo for role:', role);
      
      // Store demo credentials directly in sessionStorage for immediate access
      const demoCredentials = {
        email: role === 'Partner Admin' ? 'partner@demo.com' : 'vendor@demo.com',
        password: 'demo123',
        role: role,
        isDemoMode: true
      };
      
      sessionStorage.setItem('demoCredentials', JSON.stringify(demoCredentials));
      sessionStorage.setItem('isDemoMode', 'true');
      sessionStorage.setItem('demoRole', role);
      
      // Also try to start the secure demo mode
      try {
        await startDemoMode(role);
      } catch (err) {
        console.warn('Secure demo mode failed, continuing with basic demo:', err);
      }
      
      toast.success(`${role} demo started! Explore all features with sample data.`);
      
      // Navigate immediately - AuthContext will pick up the demo credentials
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Failed to start demo:', error);
      // Clear any partial demo state
      sessionStorage.removeItem('demoCredentials');
      sessionStorage.removeItem('isDemoMode');
      sessionStorage.removeItem('demoRole');
      
      toast.error('Failed to start demo. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/landing" className="inline-flex items-center gap-2 text-vendor-green-600 hover:text-vendor-green-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your Demo Experience
          </h1>
          <p className="text-gray-600">
            Select the role you'd like to explore. Instant access with sample data - no signup required!
          </p>
        </div>

        {/* Demo Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Partner Admin Demo */}
          <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-vendor-green-200">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-vendor-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-vendor-green-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Partner Admin Demo</CardTitle>
              <p className="text-gray-600 text-sm">
                Manage vendors, review applications, and oversee partnerships
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">You'll explore:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Vendor application management</li>
                  <li>• Revenue analytics dashboard</li>
                  <li>• Partner resource center</li>
                  <li>• Submission tracking</li>
                </ul>
              </div>
              <Button 
                onClick={() => handleDemoSelect('Partner Admin')}
                className="w-full bg-vendor-green-600 hover:bg-vendor-green-700"
                size="lg"
                disabled={isStarting || isValidating}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting Demo...
                  </>
                ) : (
                  'Start Partner Admin Demo'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Vendor Demo */}
          <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-vendor-gold-200">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-vendor-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-vendor-gold-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Vendor Demo</CardTitle>
              <p className="text-gray-600 text-sm">
                Submit applications, access resources, and track your partnerships
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">You'll explore:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Customer application tools</li>
                  <li>• Pre-qualification system</li>
                  <li>• Resource library access</li>
                  <li>• Submission status tracking</li>
                </ul>
              </div>
              <Button 
                onClick={() => handleDemoSelect('Vendor')}
                className="w-full bg-vendor-gold-600 hover:bg-vendor-gold-700"
                size="lg"
                disabled={isStarting || isValidating}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting Demo...
                  </>
                ) : (
                  'Start Vendor Demo'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            ✓ No registration required  ✓ Instant access  ✓ Sample data scenarios  ✓ Full feature exploration
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoSelector;
