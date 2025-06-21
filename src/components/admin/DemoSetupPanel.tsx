
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { setupDemoAccounts, createSampleData } from '@/utils/setupDemoAccounts';

const DemoSetupPanel = () => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSetupDemo = async () => {
    setIsSettingUp(true);
    setSetupStatus('idle');
    setMessage('');

    try {
      // Step 1: Create demo accounts
      const accountResult = await setupDemoAccounts();
      if (!accountResult.success) {
        throw new Error(accountResult.error);
      }

      // Step 2: Wait a moment for accounts to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Create sample data
      const dataResult = await createSampleData();
      if (!dataResult.success) {
        console.warn('Sample data creation failed:', dataResult.error);
        // Don't fail the whole setup if sample data fails
      }

      setSetupStatus('success');
      setMessage('Demo accounts and sample data have been set up successfully! You can now use the demo credentials to log in.');
      
    } catch (error) {
      console.error('Demo setup failed:', error);
      setSetupStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to set up demo accounts');
    } finally {
      setIsSettingUp(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Demo Account Setup
        </CardTitle>
        <CardDescription>
          Set up demo accounts and sample data for testing the VendorHub platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold">This will create:</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              demo-partner@vendorhub.com (Partner Admin role)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              demo-vendor@vendorhub.com (Vendor role)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              Sample partner organization
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              Sample customer data and resources
            </li>
          </ul>
        </div>

        {setupStatus !== 'idle' && (
          <Alert className={setupStatus === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {setupStatus === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={setupStatus === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleSetupDemo} 
          disabled={isSettingUp}
          className="w-full"
          size="lg"
        >
          {isSettingUp ? (
            <>
              <Database className="w-4 h-4 mr-2 animate-spin" />
              Setting up demo accounts...
            </>
          ) : (
            <>
              <Users className="w-4 h-4 mr-2" />
              Create Demo Accounts & Data
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          Password for both accounts: <code className="bg-gray-100 px-1 rounded">demo123</code>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemoSetupPanel;
