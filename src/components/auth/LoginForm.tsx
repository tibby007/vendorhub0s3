
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DemoAnalytics } from '@/utils/demoAnalytics';
import DemoSessionWrapper from './DemoSessionWrapper';
import LoginHeader from './LoginHeader';
import LoginTab from './LoginTab';
import SignupTab from './SignupTab';

const LoginForm = () => {
  const [isDemoSession, setIsDemoSession] = useState(false);

  useEffect(() => {
    const demoSession = DemoAnalytics.isActiveSession();
    setIsDemoSession(demoSession);
  }, []);

  return (
    <DemoSessionWrapper>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50 p-4">
        <div className="w-full max-w-md">
          <LoginHeader isDemoSession={isDemoSession} />

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup" disabled={isDemoSession}>
                {isDemoSession ? 'Demo Mode' : 'Sign Up'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginTab isDemoSession={isDemoSession} />
            </TabsContent>

            <TabsContent value="signup">
              <SignupTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DemoSessionWrapper>
  );
};

export default LoginForm;
