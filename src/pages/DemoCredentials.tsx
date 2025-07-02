
import React, { useState } from 'react';
import DemoLeadCaptureForm from '@/components/demo/DemoLeadCaptureForm';
import DemoCredentialsHeader from '@/components/demo/DemoCredentialsHeader';
import DemoSessionInfo from '@/components/demo/DemoSessionInfo';
import DemoEnvironmentHeader from '@/components/demo/DemoEnvironmentHeader';
import DemoAccountCard from '@/components/demo/DemoAccountCard';
import DemoUpgradeSection from '@/components/demo/DemoUpgradeSection';
import { DemoCredentials as DemoCredentialsType } from '@/types/demo';

const DemoCredentials = () => {
  const [showCredentials, setShowCredentials] = useState(false);
  const [demoCredentials, setDemoCredentials] = useState<DemoCredentialsType | null>(null);

  const handleLeadCaptureSuccess = (credentials: DemoCredentialsType) => {
    setDemoCredentials(credentials);
    setShowCredentials(true);
  };

  if (!showCredentials) {
    return <DemoLeadCaptureForm onSuccess={handleLeadCaptureSuccess} />;
  }

  if (!demoCredentials) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
      <DemoCredentialsHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DemoSessionInfo />
        <DemoEnvironmentHeader demoCredentials={demoCredentials} />
        <DemoAccountCard demoCredentials={demoCredentials} />
        <DemoUpgradeSection />
      </div>
    </div>
  );
};

export default DemoCredentials;
